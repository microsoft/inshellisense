// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { ISTerm } from "../../isterm/pty.js";
import type { SuggestionBlob } from "../../runtime/model.js";
import { Shell } from "../../utils/shell.js";
import { getMaxLines, SuggestionManager } from "../../ui/suggestionManager.js";
import stripAnsi from "strip-ansi";
import { wcswidth } from "../../utils/unicode.js";
import { getConfig } from "../../utils/config.js";

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

const blob = (name: string): SuggestionBlob => ({
  suggestions: [{ name, allNames: [name], icon: "*", priority: 50 }],
});

test("does not commit stale suggestions when a generator ignores cancellation", async () => {
  let commandText = "first";
  const first = deferred<SuggestionBlob>();
  const second = deferred<SuggestionBlob>();
  const terminal = {
    cwd: process.cwd(),
    cols: 80,
    getCommandState: () => ({ commandText, cursorTerminated: true, hasOutput: false }),
    getCursorState: () => ({ cursorX: 0 }),
  } as unknown as ISTerm;
  const runtime = Promise.resolve({
    getSuggestions: async (command: string) => (command === "first" ? first.promise : second.promise),
    clearTransientSuggestionState: () => {},
  });
  const manager = new SuggestionManager(terminal, Shell.Bash, runtime);

  const firstRequest = manager.exec();
  await Promise.resolve();
  commandText = "second";
  manager.invalidate();
  const secondRequest = manager.exec();

  first.resolve(blob("stale"));
  await expect(firstRequest).resolves.toBe(false);
  second.resolve(blob("current"));
  await expect(secondRequest).resolves.toBe(true);

  const rendered = manager
    .render("below", 0)
    .map((patch) => patch.data)
    .join("\n");
  expect(rendered).toContain("current");
  expect(rendered).not.toContain("stale");
});

test("clears prompt-scoped generator state when the command ends", async () => {
  let commandText: string | undefined = "first";
  let clearCalls = 0;
  const terminal = {
    cwd: process.cwd(),
    cols: 80,
    getCommandState: () => ({ commandText, cursorTerminated: true, hasOutput: false }),
    getCursorState: () => ({ cursorX: 0 }),
  } as unknown as ISTerm;
  const runtime = Promise.resolve({
    getSuggestions: async () => blob("current"),
    clearTransientSuggestionState: () => {
      clearCalls += 1;
    },
  });
  const manager = new SuggestionManager(terminal, Shell.Bash, runtime);

  await manager.exec();
  commandText = undefined;
  await manager.exec();

  expect(clearCalls).toBe(1);
});

test("clears prompt-scoped state when the command ends before its first suggestions finish", async () => {
  let commandText: string | undefined = "first";
  let clearCalls = 0;
  const first = deferred<SuggestionBlob>();
  const started = deferred<void>();
  const terminal = {
    cwd: process.cwd(),
    cols: 80,
    getCommandState: () => ({ commandText, cursorTerminated: true, hasOutput: false }),
  } as unknown as ISTerm;
  const runtime = Promise.resolve({
    getSuggestions: async () => {
      started.resolve();
      return first.promise;
    },
    clearTransientSuggestionState: () => {
      clearCalls += 1;
    },
  });
  const manager = new SuggestionManager(terminal, Shell.Bash, runtime);

  const pending = manager.exec();
  await started.promise;
  commandText = undefined;
  await manager.exec();
  first.resolve(blob("obsolete"));

  await expect(pending).resolves.toBe(false);
  expect(clearCalls).toBe(1);
});

test("does not consume suggestion bindings while the UI is hidden", async () => {
  const writes: string[] = [];
  const terminal = {
    cwd: process.cwd(),
    cols: 80,
    write: (data: string) => writes.push(data),
    getCommandState: () => ({ commandText: "first", cursorTerminated: true, hasOutput: false }),
    getCursorState: () => ({ cursorX: 0 }),
  } as unknown as ISTerm;
  const runtime = Promise.resolve({
    getSuggestions: async () => blob("current"),
  });
  const manager = new SuggestionManager(terminal, Shell.Bash, runtime);
  await manager.exec();

  expect(manager.update({ name: "tab", sequence: "\t", shift: false, ctrl: false }, false)).toBe(false);
  expect(writes).toEqual([]);
});

test("does not consume suggestion bindings when the UI is hidden", async () => {
  const writes: string[] = [];
  const terminal = {
    cwd: process.cwd(),
    cols: 80,
    write: (data: string) => writes.push(data),
    getCommandState: () => ({ commandText: "first", cursorTerminated: true, hasOutput: false }),
    getCursorState: () => ({ cursorX: 0 }),
  } as unknown as ISTerm;
  const runtime = Promise.resolve({
    getSuggestions: async () => blob("current"),
  });
  const manager = new SuggestionManager(terminal, Shell.Bash, runtime);
  await manager.exec();

  expect(manager.update({ name: "tab", sequence: "\t", shift: false, ctrl: false }, false)).toBe(false);
  expect(writes).toEqual([]);
});

describe("adaptive suggestion layout", () => {
  let originalConfig: ReturnType<typeof getConfig>;

  beforeEach(() => {
    originalConfig = { ...getConfig(), maxSuggestions: getConfig().maxSuggestions };
  });

  afterEach(() => {
    Object.assign(getConfig(), originalConfig);
  });

  const createManager = async (suggestionBlob: SuggestionBlob, cols = 80) => {
    const writes: string[] = [];
    const terminal = {
      cwd: process.cwd(),
      cols,
      write: (data: string) => writes.push(data),
      getCommandState: () => ({ commandText: "git ", cursorTerminated: true, hasOutput: false }),
    } as unknown as ISTerm;
    const manager = new SuggestionManager(terminal, Shell.Bash, Promise.resolve({ getSuggestions: async () => suggestionBlob }));
    await manager.exec();
    const press = (binding: "nextSuggestion" | "previousSuggestion" | "acceptSuggestion") => {
      const { key, shift, control } = getConfig().bindings[binding];
      return manager.update({ name: key, sequence: "", shift: !!shift, ctrl: !!control });
    };
    return { manager, terminal, writes, press };
  };

  const items = (): SuggestionBlob => ({
    suggestions: Array.from({ length: 8 }, (_, index) => ({
      name: `item-${index}`,
      allNames: [`item-${index}`],
      icon: "*",
      priority: 50,
      description: `details-${index}`,
    })),
  });

  const text = (patches: ReturnType<SuggestionManager["render"]>) => patches.map(({ data }) => stripAnsi(data)).join("\n");

  const expectFits = (patches: ReturnType<SuggestionManager["render"]>, cols: number, lines: number) => {
    expect(patches.length).toBeGreaterThan(0);
    expect(patches.length).toBeLessThanOrEqual(lines);
    for (const patch of patches) {
      expect(patch.startX).toBeGreaterThanOrEqual(0);
      expect(patch.startX + patch.length).toBeLessThanOrEqual(cols);
      expect(wcswidth(stripAnsi(patch.data))).toBe(patch.length);
    }
  };

  test.each([3, 21, 40, 69, 70, 80])("fits %i columns near the right edge", async (cols) => {
    const { manager } = await createManager(items(), cols);
    const patches = manager.render("below", cols - 1, 7);

    expectFits(patches, cols, 7);
    expect(text(patches).includes("details-0")).toBe(cols >= 70);
    expect(text(patches)).toContain("┌");
    expect(text(patches)).toContain("┘");
    if (cols >= 10) expect(text(patches)).toContain("item-0");
  });

  test.each(["above", "below"] as const)("keeps keyboard selection visible with a short menu %s the cursor", async (direction) => {
    const { manager, press, writes } = await createManager(items(), 40);
    expect(text(manager.render(direction, 0, 4))).toContain("item-0");
    for (let index = 0; index < 5; index++) press("nextSuggestion");

    const patches = manager.render(direction, 0, 4);
    expectFits(patches, 40, 4);
    expect(text(patches)).toContain("item-5");
    expect(text(patches)).not.toContain("item-0");
    press("acceptSuggestion");
    expect(writes).toEqual(["item-5 "]);

    for (let index = 0; index < 4; index++) press("previousSuggestion");
    expect(text(manager.render(direction, 0, 4))).toContain("item-1");
  });

  test("inserts the full suggestion when its label is truncated", async () => {
    const name = "a-very-long-suggestion-name";
    const { manager, press, writes } = await createManager(blob(name), 10);
    const patches = manager.render("below", 0, 3);
    expectFits(patches, 10, 3);
    expect(text(patches)).toContain("…");
    expect(text(patches)).not.toContain(name);
    press("acceptSuggestion");
    expect(writes).toEqual([`${name} `]);
  });

  test.each([
    [2, 7],
    [80, 2],
  ])("hides the menu safely with only %i columns and %i lines", async (cols, lines) => {
    const { manager } = await createManager(items(), cols);
    expect(manager.render("below", 0, lines)).toEqual([]);
  });

  test("fits a standalone argument description into a narrow terminal", async () => {
    const { manager } = await createManager({ suggestions: [], argumentDescription: "A long argument description that must be truncated" }, 12);
    const patches = manager.render("above", 11, 3);
    expectFits(patches, 12, 3);
    expect(text(patches)).toContain("…");
  });

  test("truncates wide characters and emoji by terminal cell width", async () => {
    const { manager } = await createManager(blob("美国人🚀美国人🚀美国人"), 11);
    const patches = manager.render("below", 10, 3);
    expectFits(patches, 11, 3);
    expect(text(patches)).toContain("…");
  });

  test("fits wide characters in a minimal standalone description", async () => {
    const { manager } = await createManager({ suggestions: [], argumentDescription: "美国人🚀" }, 3);
    const patches = manager.render("below", 2, 3);
    expectFits(patches, 3, 3);
    expect(text(patches)).toContain("…");
  });

  test.each([21, 69])("stacks the description below the complete list at %i columns", async (cols) => {
    const { manager } = await createManager(items(), cols);
    const patches = manager.render("below", cols - 1, 10);

    expectFits(patches, cols, 10);
    expect(patches).toHaveLength(10);
    expect(text(patches.slice(0, 7))).toContain("item-4");
    expect(text(patches.slice(0, 7))).not.toContain("details-0");
    expect(text(patches.slice(7))).toContain("details-0");
    expect(patches.every(({ length }) => length === Math.min(40, cols))).toBe(true);
  });

  test.each([9, 10])("keeps all list rows when %i lines are available for a stacked description", async (lines) => {
    const { manager } = await createManager(items(), 21);
    const patches = manager.render("below", 0, lines);

    expectFits(patches, 21, lines);
    expect(text(patches)).toContain("item-4");
    expect(text(patches).includes("details-0")).toBe(lines === 10);
    expect(patches).toHaveLength(lines === 10 ? 10 : 7);
  });

  test("places a truncated description after the list", async () => {
    const description = "Long description ".repeat(30);
    const suggestionBlob = items();
    suggestionBlob.suggestions[0].description = description;
    const { manager } = await createManager(suggestionBlob, 21);
    const patches = manager.render("below", 20, 11);

    expectFits(patches, 21, 11);
    expect(patches).toHaveLength(11);
    expect(text(patches.slice(0, 7))).toContain("item-0");
    expect(text(patches.slice(0, 7))).toContain("item-4");
    expect(text(patches.slice(7))).toContain("Long description");
    expect(text(patches.slice(7))).toContain("…");
  });

  test("caps a stacked description at five content lines", async () => {
    const suggestionBlob = items();
    suggestionBlob.suggestions[0].description = "Long description ".repeat(30);
    const { manager } = await createManager(suggestionBlob, 21);
    const patches = manager.render("below", 0, 20);

    expectFits(patches, 21, 20);
    expect(patches).toHaveLength(14);
    expect(text(patches.slice(7))).toContain("…");
  });

  test("keeps the selected description through stacked, hidden, and side-by-side layouts", async () => {
    const { manager, terminal, press, writes } = await createManager(items());
    for (let index = 0; index < 6; index++) press("nextSuggestion");
    expect(text(manager.render("below", 0, 10))).toContain("details-6");

    terminal.cols = 21;
    const stacked = manager.render("above", 20, 10);
    expectFits(stacked, 21, 10);
    expect(text(stacked.slice(0, 5))).toContain("item-6");
    expect(text(stacked.slice(5))).toContain("details-6");

    const hidden = text(manager.render("above", 20, 7));
    expect(hidden).not.toContain("details-6");
    expect(hidden).toContain("item-6");
    terminal.cols = 80;
    expect(text(manager.render("below", 0, 7))).toContain("details-6");
    press("acceptSuggestion");
    expect(writes).toEqual(["item-6 "]);
  });

  test("uses the configured list height for pagination", async () => {
    getConfig().maxSuggestions = 2;
    const { manager, press, writes } = await createManager(items());

    const firstPage = text(manager.render("below", 0, 20));
    expect(firstPage).toContain("item-1");
    expect(firstPage).not.toContain("item-2");
    press("nextSuggestion");
    press("nextSuggestion");
    expect(text(manager.render("below", 0, 20))).toContain("item-2");
    press("acceptSuggestion");
    expect(writes).toEqual(["item-2 "]);
  });

  test("uses configured description dimensions and reserves enough rows", async () => {
    Object.assign(getConfig(), { descriptionWidth: 45, descriptionHeight: 8 });
    const suggestionBlob = items();
    suggestionBlob.suggestions[0].description = "description ".repeat(100);
    const { manager, terminal } = await createManager(suggestionBlob, 100);

    const sideBySide = manager.render("below", 0);
    expectFits(sideBySide, 100, 11);
    expect(sideBySide).toHaveLength(10);
    expect(sideBySide[0].length).toBe(85);
    expect(text(sideBySide)).toContain("…");
    expect(getMaxLines(100)).toBe(11);

    terminal.cols = 60;
    const stacked = manager.render("above", 59);
    expectFits(stacked, 60, 18);
    expect(stacked).toHaveLength(17);
    expect(stacked.every(({ length }) => length === 45)).toBe(true);
    expect(getMaxLines(60)).toBe(18);
  });

  test.each(["above", "below"] as const)("expands descriptions %s the cursor without expanding the suggestion count", async (direction) => {
    getConfig().truncateDescriptions = false;
    const suggestionBlob = items();
    suggestionBlob.suggestions[0].description = "x".repeat(480) + " ending";
    const { manager } = await createManager(suggestionBlob, 160);
    const patches = manager.render(direction, 159, 25);

    expectFits(patches, 160, 25);
    expect(patches.length).toBeGreaterThan(7);
    expect(Math.max(...patches.map(({ length }) => length))).toBeGreaterThan(70);
    expect(text(patches)).toContain("ending");
    expect(text(patches)).not.toContain("…");
    expect(text(patches)).toContain("item-4");
    expect(text(patches)).not.toContain("item-5");
  });

  test("expands standalone argument descriptions", async () => {
    getConfig().truncateDescriptions = false;
    const { manager } = await createManager({ suggestions: [], argumentDescription: "x".repeat(480) + " ending" }, 100);
    const patches = manager.render("below", 99, 20);

    expectFits(patches, 100, 20);
    expect(patches.length).toBeGreaterThan(7);
    expect(patches[0].length).toBeGreaterThan(30);
    expect(text(patches)).toContain("ending");
    expect(text(patches)).not.toContain("…");
  });

  test("expands stacked descriptions and restores the layout and selection after resizing", async () => {
    getConfig().truncateDescriptions = false;
    const suggestionBlob = items();
    suggestionBlob.suggestions[6].description = "x".repeat(480) + " ending";
    const { manager, terminal, press, writes } = await createManager(suggestionBlob, 60);
    for (let index = 0; index < 6; index++) press("nextSuggestion");

    const expanded = manager.render("below", 59, 30);
    expectFits(expanded, 60, 30);
    expect(expanded[0].length).toBeGreaterThan(40);
    expect(text(expanded)).toContain("ending");
    expect(text(expanded)).not.toContain("…");

    terminal.cols = 21;
    const constrained = manager.render("above", 20, 10);
    expectFits(constrained, 21, 10);
    expect(text(constrained)).toContain("item-6");
    expect(text(constrained)).toContain("…");

    terminal.cols = 60;
    expect(manager.render("below", 59, 30)).toEqual(expanded);
    press("acceptSuggestion");
    expect(writes).toEqual(["item-6 "]);
  });

  test.each([3, 21, 80])("still truncates at terminal boundaries with truncation disabled at %i columns", async (cols) => {
    getConfig().truncateDescriptions = false;
    const suggestionBlob = items();
    suggestionBlob.suggestions[0].description = "x".repeat(2000);
    const { manager } = await createManager(suggestionBlob, cols);
    const patches = manager.render("below", cols - 1, 10);

    expectFits(patches, cols, 10);
    expect(patches).toHaveLength(10);
    expect(text(patches)).toContain("…");
    expect(Math.max(...patches.map(({ length }) => length))).toBe(cols);
  });
});
