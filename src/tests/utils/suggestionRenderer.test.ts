// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import ansi from "ansi-escapes";

import type { ISTerm } from "../../isterm/pty.js";
import * as dec from "../../utils/dec.js";
import { SuggestionRenderer } from "../../ui/suggestionRenderer.js";
import type { SuggestionManager } from "../../ui/suggestionManager.js";

const originalTerminalEmulator = process.env.TERMINAL_EMULATOR;

afterEach(() => {
  if (originalTerminalEmulator == null) {
    delete process.env.TERMINAL_EMULATOR;
  } else {
    process.env.TERMINAL_EMULATOR = originalTerminalEmulator;
  }
});

const createRenderer = (writeOutput: (data: string) => void) => {
  const term = {
    cols: 80,
    getCommandState: () => ({ commandText: "g", cursorTerminated: true, hasOutput: false }),
    getCursorState: () => ({ cursorX: 1, cursorY: 0, remainingLines: 28, hidden: false, shift: 0 }),
    getPatch: () => "patch",
    isAlternateBuffer: () => false,
  } as unknown as ISTerm;
  const suggestions = {
    render: () => [{ startX: 1, length: 5, data: "item" }],
    suspend: async () => {},
  } as unknown as SuggestionManager;

  return new SuggestionRenderer(term, suggestions, writeOutput);
};

test("uses ANSI cursor position sequences by default", async () => {
  delete process.env.TERMINAL_EMULATOR;
  const output: string[] = [];
  const renderer = createRenderer((data) => output.push(data));

  renderer.renderSuggestionUpdate(false);
  await renderer.handleBufferChange("alternate");

  expect(output).toHaveLength(2);
  output.forEach((data) => {
    expect(data).toContain(ansi.cursorSavePosition);
    expect(data).toContain(ansi.cursorRestorePosition);
    expect(data).not.toContain(dec.cursorSavePosition);
    expect(data).not.toContain(dec.cursorRestorePosition);
  });
});

test("uses DEC cursor position sequences in JetBrains terminals", async () => {
  process.env.TERMINAL_EMULATOR = "JetBrains-JediTerm";
  const output: string[] = [];
  const renderer = createRenderer((data) => output.push(data));

  renderer.renderSuggestionUpdate(false);
  await renderer.handleBufferChange("alternate");

  expect(output).toHaveLength(2);
  output.forEach((data) => {
    expect(data).toContain(dec.cursorSavePosition);
    expect(data).toContain(dec.cursorRestorePosition);
    expect(data).not.toContain(ansi.cursorSavePosition);
    expect(data).not.toContain(ansi.cursorRestorePosition);
  });
});
