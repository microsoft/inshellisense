// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import ansi from "ansi-escapes";

import type { ISTerm } from "../../isterm/pty.js";
import * as dec from "../../utils/dec.js";
import { SuggestionRenderer } from "../../ui/suggestionRenderer.js";
import { SuggestionManager } from "../../ui/suggestionManager.js";
import { Shell } from "../../utils/shell.js";
import stripAnsi from "strip-ansi";
import { getConfig } from "../../utils/config.js";

const originalTerminalEmulator = process.env.TERMINAL_EMULATOR;
const originalConfig = { ...getConfig() };

afterEach(() => {
  Object.assign(getConfig(), originalConfig);
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

test("passes data through on direction changes without visible suggestions", () => {
  delete process.env.TERMINAL_EMULATOR;
  const output: string[] = [];
  const cursor = { cursorX: 0, cursorY: 20, remainingLines: 2, hidden: false, shift: 0 };
  const term = {
    cols: 80,
    getCommandState: () => ({}),
    getCursorState: () => ({ ...cursor }),
    getPatch: () => "patch",
    isAlternateBuffer: () => false,
  } as unknown as ISTerm;
  const suggestions = {
    render: () => [],
    suspend: async () => {},
  } as unknown as SuggestionManager;
  const renderer = new SuggestionRenderer(term, suggestions, (data) => output.push(data));

  renderer.renderPtyData("frame-bottom", false);
  cursor.cursorY = 2;
  cursor.remainingLines = 20;
  renderer.renderPtyData("frame-top", false);

  expect(output).toEqual(["frame-bottom", "frame-top"]);
});

test.each(["above", "below"] as const)("renders a short adaptive menu %s the cursor", async (direction) => {
  const output: string[] = [];
  const term = {
    cwd: process.cwd(),
    cols: 21,
    getCommandState: () => ({ commandText: "g", cursorTerminated: true, hasOutput: false }),
    getCursorState: () => ({ cursorX: 20, cursorY: direction === "above" ? 3 : 0, remainingLines: direction === "below" ? 3 : 0, hidden: false, shift: 0 }),
    getPatch: (_height: number, patches: ReturnType<SuggestionManager["render"]>) => patches.map(({ data }) => data).join("\n"),
    isAlternateBuffer: () => false,
  } as unknown as ISTerm;
  const suggestions = new SuggestionManager(
    term,
    Shell.Bash,
    Promise.resolve({
      getSuggestions: async () => ({ suggestions: ["first", "second", "third"].map((name) => ({ name, allNames: [name], icon: "*", priority: 50 })) }),
    }),
  );
  await suggestions.exec();
  const renderer = new SuggestionRenderer(term, suggestions, (data) => output.push(data));

  renderer.renderSuggestionUpdate(false);

  expect(renderer.hasVisibleSuggestions).toBe(true);
  expect(stripAnsi(output.join(""))).toContain("first");
  expect(stripAnsi(output.join(""))).not.toContain("second");
  expect(stripAnsi(output.join(""))).toContain("┘");
});

test("uses the available space above for a stacked description", async () => {
  const output: string[] = [];
  const term = {
    cwd: process.cwd(),
    cols: 50,
    getCommandState: () => ({ commandText: "g", cursorTerminated: true, hasOutput: false }),
    getCursorState: () => ({ cursorX: 0, cursorY: 14, remainingLines: 8, hidden: false, shift: 0 }),
    getPatch: (_height: number, patches: ReturnType<SuggestionManager["render"]>) => patches.map(({ data }) => data).join("\n"),
    isAlternateBuffer: () => false,
  } as unknown as ISTerm;
  const suggestions = new SuggestionManager(
    term,
    Shell.Bash,
    Promise.resolve({
      getSuggestions: async () => ({
        suggestions: Array.from({ length: 5 }, (_, index) => ({
          name: `item-${index}`,
          allNames: [`item-${index}`],
          icon: "*",
          priority: 50,
          description: "description",
        })),
      }),
    }),
  );
  await suggestions.exec();
  const renderer = new SuggestionRenderer(term, suggestions, (data) => output.push(data));

  renderer.renderSuggestionUpdate(false);

  expect(stripAnsi(output.join(""))).toContain("description");
});

test.each(["above", "below"] as const)("uses all available rows for an expanding description %s the cursor", async (direction) => {
  getConfig().truncateDescriptions = false;
  const output: string[] = [];
  const patchHeights: number[] = [];
  const term = {
    cwd: process.cwd(),
    cols: 80,
    getCommandState: () => ({ commandText: "g", cursorTerminated: true, hasOutput: false }),
    getCursorState: () => ({
      cursorX: 0,
      cursorY: direction === "above" ? 20 : 8,
      remainingLines: direction === "below" ? 20 : 8,
      hidden: false,
      shift: 0,
    }),
    getPatch: (height: number, patches: ReturnType<SuggestionManager["render"]>) => {
      patchHeights.push(height);
      return patches.map(({ data }) => data).join("\n");
    },
    isAlternateBuffer: () => false,
  } as unknown as ISTerm;
  const suggestions = new SuggestionManager(
    term,
    Shell.Bash,
    Promise.resolve({
      getSuggestions: async () => ({
        suggestions: [{ name: "item", allNames: ["item"], icon: "*", priority: 50, description: "x".repeat(400) + " ending" }],
      }),
    }),
  );
  await suggestions.exec();
  const renderer = new SuggestionRenderer(term, suggestions, (data) => output.push(data));

  renderer.renderSuggestionUpdate(false);
  await renderer.handleBufferChange("alternate");

  expect(stripAnsi(output[0])).toContain("ending");
  expect(stripAnsi(output[0])).not.toContain("…");
  expect(patchHeights.every((height) => height === 20)).toBe(true);
  expect(output).toHaveLength(2);
});
