// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import readline from "node:readline";
import { PassThrough } from "node:stream";
import { StringDecoder } from "node:string_decoder";

import * as ansi from "../utils/ansi.js";
import type { KeyPressEvent } from "./suggestionManager.js";

const ESC = "\u001B";
const BEL = "\u0007";
type TerminalResponseKind = "cursor-position" | "color-10" | "color-11" | "color-12";
type TerminalQuery = { kind: TerminalResponseKind; sequence: string };
type TerminalSequenceMatch =
  | { state: "complete"; kind: TerminalResponseKind; end: number }
  | { state: "partial"; kinds: TerminalResponseKind[]; discardOnTimeout: boolean }
  | { state: "none" };

const terminalResponseLifetime = 1_000;
const terminalQueries: TerminalQuery[] = [
  { kind: "cursor-position", sequence: `${ESC}[6n` },
  { kind: "cursor-position", sequence: `${ESC}[?6n` },
  ...([10, 11, 12] as const).flatMap((color) => [
    { kind: `color-${color}` as const, sequence: `${ESC}]${color};?${BEL}` },
    { kind: `color-${color}` as const, sequence: `${ESC}]${color};?${ESC}\\` },
  ]),
];
// blocks win32 input mode, the kitty keyboard protocol and xterm modifyOtherKeys from upgrading input & breaking node's readline
// eslint-disable-next-line no-control-regex
const keyEncodingUpgrade = new RegExp("\\u001B\\[(?:\\?9001([hl])|\\?u|[=><][\\d;]*u|>[\\d;]*m)", "g");
// a trailing portion of a key encoding upgrade
// eslint-disable-next-line no-control-regex
const partialKeyEncodingUpgrade = new RegExp("^\\u001B(?:\\[(?:\\?(?:9(?:0(?:0(?:1)?)?)?)?|[=><][\\d;]*)?)?$");
const carriageReturn = "\r".charCodeAt(0);

const isDigit = (value: string | undefined): boolean => value != null && value >= "0" && value <= "9";

const parseCursorPositionResponse = (input: string, start: number): TerminalSequenceMatch => {
  if (input[start + 1] !== "[") return { state: "none" };
  const partial: TerminalSequenceMatch = { state: "partial", kinds: ["cursor-position"], discardOnTimeout: false };

  let index = start + 2;
  if (input[index] === "?") index++;

  const rowStart = index;
  while (isDigit(input[index])) index++;
  if (index === rowStart) return index === input.length ? partial : { state: "none" };
  if (index === input.length) return partial;
  if (input[index] !== ";") return { state: "none" };
  index++;

  const columnStart = index;
  while (isDigit(input[index])) index++;
  if (index === columnStart) return index === input.length ? partial : { state: "none" };
  if (index === input.length) return partial;
  return input[index] === "R" ? { state: "complete", kind: "cursor-position", end: index + 1 } : { state: "none" };
};

const parseColorResponse = (input: string, start: number): TerminalSequenceMatch => {
  if (input[start + 1] !== "]") return { state: "none" };

  const codeStart = start + 2;
  const remaining = input.slice(codeStart);
  const color = ([10, 11, 12] as const).find((value) => remaining.startsWith(`${value};`));
  if (color == null) {
    const possibleColors = ([10, 11, 12] as const).filter((value) => `${value};`.startsWith(remaining)).map((value) => `color-${value}` as const);
    return possibleColors.length === 0 ? { state: "none" } : { state: "partial", kinds: possibleColors, discardOnTimeout: false };
  }

  let index = codeStart + `${color};`.length;
  while (index < input.length) {
    if (input[index] === BEL) return { state: "complete", kind: `color-${color}`, end: index + 1 };
    if (input[index] === ESC) {
      if (index + 1 === input.length) return { state: "partial", kinds: [`color-${color}`], discardOnTimeout: true };
      return input[index + 1] === "\\" ? { state: "complete", kind: `color-${color}`, end: index + 2 } : { state: "none" };
    }
    index++;
  }
  return { state: "partial", kinds: [`color-${color}`], discardOnTimeout: true };
};

const parseTerminalResponse = (input: string, start: number): TerminalSequenceMatch => {
  if (input[start] !== ESC) return { state: "none" };
  if (start + 1 === input.length) {
    return { state: "partial", kinds: ["cursor-position", "color-10", "color-11", "color-12"], discardOnTimeout: false };
  }
  return input[start + 1] === "[" ? parseCursorPositionResponse(input, start) : parseColorResponse(input, start);
};

const getPartialTerminalQuery = (input: string): string => {
  let partial = "";
  for (const { sequence } of terminalQueries) {
    const minimum = Math.max(0, input.length - sequence.length + 1);
    for (let start = minimum; start < input.length; start++) {
      const suffix = input.slice(start);
      if (suffix.length > partial.length && suffix.length < sequence.length && sequence.startsWith(suffix)) {
        partial = suffix;
      }
    }
  }
  return partial;
};

const getPartialKeyEncodingUpgrade = (input: string): string => {
  const sequenceStart = input.lastIndexOf(ESC);
  if (sequenceStart === -1) return "";
  const suffix = input.slice(sequenceStart);
  return partialKeyEncodingUpgrade.test(suffix) ? suffix : "";
};

const replaceBareLineFeeds = (output: string): string => {
  let feed = output.indexOf("\n");
  if (feed === -1) return output;

  let replaced = "";
  let copiedTo = 0;
  for (; feed !== -1; feed = output.indexOf("\n", feed + 1)) {
    if (output.charCodeAt(feed - 1) === carriageReturn) continue;
    replaced += output.slice(copiedTo, feed);
    replaced += ansi.index;
    copiedTo = feed + 1;
  }
  return replaced + output.slice(copiedTo);
};

type StdioProxyOptions = {
  onTerminalResponse?: (data: string) => void;
  onWin32InputMode?: (enabled: boolean) => void;
};

export class StdioProxy {
  readonly #keypressInput = new PassThrough();
  #decoder = new StringDecoder("utf8");
  readonly #onTerminalResponse: (data: string) => void;
  readonly #onWin32InputMode: (enabled: boolean) => void;
  readonly #pendingTerminalQueries = new Map<TerminalResponseKind, number[]>();
  readonly #terminalResponseWaiters = new Set<() => void>();
  #pendingInput = "";
  #pendingInputTimer?: NodeJS.Timeout;
  #pendingOutput = "";
  #pendingQueryOutput = "";

  constructor({ onTerminalResponse = () => {}, onWin32InputMode = () => {} }: StdioProxyOptions = {}) {
    this.#onTerminalResponse = onTerminalResponse;
    this.#onWin32InputMode = onWin32InputMode;
    readline.emitKeypressEvents(this.#keypressInput as unknown as NodeJS.ReadStream);
  }

  onKeypress(listener: (...event: KeyPressEvent) => void): void {
    this.#keypressInput.on("keypress", listener);
  }

  handleInput(data: Buffer | string): void {
    this.#clearPendingInputTimer();
    const decoded = Buffer.isBuffer(data) ? this.#decoder.write(data) : this.#decoder.end() + data;
    if (!Buffer.isBuffer(data)) this.#decoder = new StringDecoder("utf8");
    this.#routeInput(this.#pendingInput + decoded);
  }

  handleOutput(data: string): string {
    this.#trackTerminalQueries(data);
    const input = this.#pendingOutput + data;
    this.#pendingOutput = getPartialKeyEncodingUpgrade(input);
    const completeInput = this.#pendingOutput.length === 0 ? input : input.slice(0, -this.#pendingOutput.length);

    return replaceBareLineFeeds(
      completeInput.replace(keyEncodingUpgrade, (_sequence, win32Mode?: string) => {
        if (win32Mode != null) this.#onWin32InputMode(win32Mode === "h");
        return "";
      }),
    );
  }

  dispose(): string {
    this.#clearPendingInputTimer();
    const remaining = this.#decoder.end();
    this.#pendingInput = "";
    if (remaining.length !== 0) this.#keypressInput.write(remaining);
    this.#keypressInput.destroy();
    const pendingOutput = this.#pendingOutput;
    this.#pendingOutput = "";
    this.#pendingQueryOutput = "";
    this.#pendingTerminalQueries.clear();
    this.#resolveTerminalResponseWaiters();
    return pendingOutput;
  }

  waitForPendingTerminalResponses(): Promise<void> {
    this.#pruneTerminalQueries();
    const pending = [...this.#pendingTerminalQueries.values()].flat();
    if (pending.length === 0) return Promise.resolve();

    const wait = Math.max(...pending.map((createdAt) => createdAt + terminalResponseLifetime - Date.now()), 0);
    return new Promise((resolve) => {
      const finish = () => {
        clearTimeout(timer);
        this.#terminalResponseWaiters.delete(finish);
        this.#pruneTerminalQueries();
        resolve();
      };
      this.#terminalResponseWaiters.add(finish);
      const timer = setTimeout(finish, wait);
    });
  }

  #routeInput(input: string): void {
    this.#pendingInput = "";
    let keypressInput = "";
    let index = 0;
    while (index < input.length) {
      const sequenceStart = input.indexOf(ESC, index);
      if (sequenceStart === -1) {
        keypressInput += input.slice(index);
        break;
      }

      keypressInput += input.slice(index, sequenceStart);
      const match = parseTerminalResponse(input, sequenceStart);
      if (match.state === "complete") {
        const response = input.slice(sequenceStart, match.end);
        if (this.#consumeTerminalQuery(match.kind)) this.#onTerminalResponse(response);
        index = match.end;
      } else if (match.state === "partial") {
        if (match.discardOnTimeout || this.#hasPendingTerminalQuery(match.kinds)) {
          this.#pendingInput = input.slice(sequenceStart);
          this.#schedulePendingInput(match.discardOnTimeout, match.kinds);
          break;
        }
        keypressInput += ESC;
        index = sequenceStart + 1;
      } else {
        keypressInput += ESC;
        index = sequenceStart + 1;
      }
    }
    if (keypressInput.length !== 0) this.#keypressInput.write(keypressInput);
  }

  #trackTerminalQueries(data: string): void {
    const input = this.#pendingQueryOutput + data;
    this.#pendingQueryOutput = getPartialTerminalQuery(input);
    const completeInput = this.#pendingQueryOutput.length === 0 ? input : input.slice(0, -this.#pendingQueryOutput.length);
    const createdAt = Date.now();

    for (const { kind, sequence } of terminalQueries) {
      let index = completeInput.indexOf(sequence);
      while (index !== -1) {
        const pending = this.#pendingTerminalQueries.get(kind) ?? [];
        pending.push(createdAt);
        this.#pendingTerminalQueries.set(kind, pending);
        index = completeInput.indexOf(sequence, index + sequence.length);
      }
    }
  }

  #consumeTerminalQuery(kind: TerminalResponseKind): boolean {
    this.#pruneTerminalQueries();
    const pending = this.#pendingTerminalQueries.get(kind);
    if (pending == null || pending.length === 0) return false;
    pending.shift();
    if (pending.length === 0) this.#pendingTerminalQueries.delete(kind);
    if (this.#pendingTerminalQueries.size === 0) this.#resolveTerminalResponseWaiters();
    return true;
  }

  #hasPendingTerminalQuery(kinds: TerminalResponseKind[]): boolean {
    this.#pruneTerminalQueries();
    return kinds.some((kind) => (this.#pendingTerminalQueries.get(kind)?.length ?? 0) > 0);
  }

  #schedulePendingInput(discard: boolean, kinds: TerminalResponseKind[]): void {
    const pending = kinds.flatMap((kind) => this.#pendingTerminalQueries.get(kind) ?? []);
    const wait =
      pending.length === 0 ? terminalResponseLifetime : Math.max(...pending.map((createdAt) => createdAt + terminalResponseLifetime - Date.now()), 0);
    this.#pendingInputTimer = setTimeout(() => {
      const input = this.#pendingInput;
      this.#pendingInput = "";
      this.#pendingInputTimer = undefined;
      if (!discard && input.length !== 0) this.#keypressInput.write(input);
    }, wait);
  }

  #clearPendingInputTimer(): void {
    if (this.#pendingInputTimer != null) clearTimeout(this.#pendingInputTimer);
    this.#pendingInputTimer = undefined;
  }

  #pruneTerminalQueries(): void {
    const oldest = Date.now() - terminalResponseLifetime;
    for (const [kind, pending] of this.#pendingTerminalQueries) {
      const active = pending.filter((createdAt) => createdAt > oldest);
      if (active.length === 0) {
        this.#pendingTerminalQueries.delete(kind);
      } else {
        this.#pendingTerminalQueries.set(kind, active);
      }
    }
  }

  #resolveTerminalResponseWaiters(): void {
    for (const resolve of [...this.#terminalResponseWaiters]) resolve();
  }
}
