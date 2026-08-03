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
  readonly #keypressInput = new PassThrough();
  #decoder = new StringDecoder("utf8");
  readonly #onCursorPositionReport: (data: string) => void;
  readonly #onWin32InputMode: (enabled: boolean) => void;
  #pendingInput = "";
  #pendingOutput = "";

  constructor({ onCursorPositionReport = () => {}, onWin32InputMode = () => {} }: StdioProxyOptions = {}) {
    this.#onCursorPositionReport = onCursorPositionReport;
    this.#onWin32InputMode = onWin32InputMode;
    readline.emitKeypressEvents(this.#keypressInput as unknown as NodeJS.ReadStream);
  }

  onKeypress(listener: (...event: KeyPressEvent) => void): void {
    this.#keypressInput.on("keypress", listener);
  }

  handleInput(data: Buffer | string): void {
    const decoded = Buffer.isBuffer(data) ? this.#decoder.write(data) : this.#decoder.end() + data;
    if (!Buffer.isBuffer(data)) this.#decoder = new StringDecoder("utf8");
    this.#routeInput(this.#pendingInput + decoded);
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

  #routeInput(input: string): void {
    this.#pendingInput = input.match(partialCursorPositionReport)?.[0] ?? "";
    const completeInput = this.#pendingInput.length === 0 ? input : input.slice(0, -this.#pendingInput.length);
    const keypressInput = completeInput.replace(cursorPositionReport, (response) => {
      this.#onCursorPositionReport(response);
      return "";
    });
    if (keypressInput.length !== 0) this.#keypressInput.write(keypressInput);
  }
}
