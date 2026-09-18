// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import readline from "node:readline";
import { PassThrough } from "node:stream";
import { StringDecoder } from "node:string_decoder";

import * as ansi from "../utils/ansi.js";
import type { KeyPressEvent } from "./suggestionManager.js";

// eslint-disable-next-line no-control-regex
const cursorPositionReport = new RegExp("\\u001B\\[\\??\\d+;\\d+R", "g");
// eslint-disable-next-line no-control-regex
const partialCursorPositionReport = new RegExp("\\u001B\\[\\??\\d*(?:;\\d*)?$");
// blocks win32 input mode, the kitty keyboard protocol and xterm modifyOtherKeys from upgrading input & breaking node's readline
// eslint-disable-next-line no-control-regex
const keyEncodingUpgrade = new RegExp("\\u001B\\[(?:\\?9001([hl])|\\?u|[=><][\\d;]*u|>[\\d;]*m)", "g");
// a trailing portion of a key encoding upgrade
// eslint-disable-next-line no-control-regex
const partialKeyEncodingUpgrade = new RegExp("^\\u001B(?:\\[(?:\\?(?:9(?:0(?:0(?:1)?)?)?)?|[=><][\\d;]*)?)?$");
const carriageReturn = "\r".charCodeAt(0);

const getPartialKeyEncodingUpgrade = (input: string): string => {
  const sequenceStart = input.lastIndexOf("\u001B");
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
  onCursorPositionReport?: (data: string) => void;
  onWin32InputMode?: (enabled: boolean) => void;
};

export class StdioProxy {
  readonly #keypressListeners: ((...event: KeyPressEvent) => void)[] = [];
  #pendingKeypressInput = "";
  #keypressInput = this.#createKeypressInput();
  #decoder = new StringDecoder("utf8");
  readonly #onCursorPositionReport: (data: string) => void;
  readonly #onWin32InputMode: (enabled: boolean) => void;
  #pendingInput = "";
  #pendingOutput = "";

  constructor({ onCursorPositionReport = () => {}, onWin32InputMode = () => {} }: StdioProxyOptions = {}) {
    this.#onCursorPositionReport = onCursorPositionReport;
    this.#onWin32InputMode = onWin32InputMode;
  }

  onKeypress(listener: (...event: KeyPressEvent) => void): void {
    this.#keypressListeners.push(listener);
  }

  handleInput(data: Buffer | string, forwardInput?: (data: string) => void): void {
    const decoded = Buffer.isBuffer(data) ? this.#decoder.write(data) : this.#decoder.end() + data;
    if (!Buffer.isBuffer(data)) this.#decoder = new StringDecoder("utf8");
    this.#routeInput(this.#pendingInput + decoded, forwardInput);
  }

  handleOutput(data: string): string {
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
    const remaining = this.#pendingInput + this.#decoder.end();
    this.#pendingInput = "";
    if (remaining.length !== 0) this.#keypressInput.write(remaining);
    this.#keypressInput.destroy();
    const pendingOutput = this.#pendingOutput;
    this.#pendingOutput = "";
    return pendingOutput;
  }

  #createKeypressInput(): PassThrough {
    const input = new PassThrough();
    readline.emitKeypressEvents(input as unknown as NodeJS.ReadStream);
    input.on("keypress", (...event: KeyPressEvent) => {
      this.#pendingKeypressInput = this.#pendingKeypressInput.slice(event[1].sequence.length);
      this.#keypressListeners.forEach((listener) => listener(...event));
    });
    return input;
  }

  #routeInput(input: string, forwardInput?: (data: string) => void): void {
    this.#pendingInput = input.match(partialCursorPositionReport)?.[0] ?? "";
    const completeInput = this.#pendingInput.length === 0 ? input : input.slice(0, -this.#pendingInput.length);
    const keypressInput = completeInput.replace(cursorPositionReport, (response) => {
      this.#onCursorPositionReport(response);
      return "";
    });
    if (forwardInput != null) {
      const pending = this.#pendingKeypressInput;
      if (pending.length !== 0) {
        // Forward incomplete keys in order, without leaving readline's Escape timer active on this route.
        this.#keypressInput.removeAllListeners("keypress");
        this.#keypressInput.destroy();
        this.#pendingKeypressInput = "";
        this.#keypressInput = this.#createKeypressInput();
      }
      if (pending.length + keypressInput.length !== 0) forwardInput(pending + keypressInput);
    } else if (keypressInput.length !== 0) {
      this.#pendingKeypressInput += keypressInput;
      this.#keypressInput.write(keypressInput);
    }
  }
}
