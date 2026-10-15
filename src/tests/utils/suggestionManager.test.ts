// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { ISTerm } from "../../isterm/pty.js";
import type { SuggestionBlob } from "../../runtime/model.js";
import { Shell } from "../../utils/shell.js";
import { SuggestionManager } from "../../ui/suggestionManager.js";
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

describe("enter as the accept binding", () => {
  let previousAcceptBinding: ReturnType<typeof getConfig>["bindings"]["acceptSuggestion"];

  beforeEach(() => {
    previousAcceptBinding = getConfig().bindings.acceptSuggestion;
    getConfig().bindings.acceptSuggestion = { key: "return" };
  });

  afterEach(() => {
    getConfig().bindings.acceptSuggestion = previousAcceptBinding;
  });

  const setup = async (commandText: string, token: string) => {
    const writes: string[] = [];
    let clearCommandCalls = 0;
    const terminal = {
      cwd: process.cwd(),
      cols: 80,
      write: (data: string) => writes.push(data),
      clearCommand: () => {
        clearCommandCalls += 1;
      },
      getCommandState: () => ({ commandText, cursorTerminated: true, hasOutput: false }),
      getCursorState: () => ({ cursorX: 0 }),
    } as unknown as ISTerm;
    const runtime = Promise.resolve({
      getSuggestions: async () => ({ ...blob("checkout"), activeToken: { token, tokenLength: token.length, complete: false, isOption: false } }),
      clearTransientSuggestionState: () => {},
    });
    const manager = new SuggestionManager(terminal, Shell.Bash, runtime);
    await manager.exec();
    return { manager, writes, clearCommandCalls: () => clearCommandCalls };
  };

  const enter = { name: "return", sequence: "\r", shift: false, ctrl: false };

  test("keeps tracking the command when enter accepts a suggestion", async () => {
    const { manager, writes, clearCommandCalls } = await setup("git chec", "chec");

    expect(manager.update(enter, true)).toBe(true);
    expect(writes).not.toEqual([]);
    expect(clearCommandCalls()).toBe(0);
  });

  test("clears the command when enter is not consumed by a binding", async () => {
    const { manager, writes, clearCommandCalls } = await setup("git chec", "chec");

    expect(manager.update(enter, false)).toBe(false);
    expect(writes).toEqual([]);
    expect(clearCommandCalls()).toBe(1);
  });

  test("runs the command when enter is pressed on an empty token without a selection", async () => {
    const { manager, writes, clearCommandCalls } = await setup("git checkout ", "");

    expect(manager.update(enter, true)).toBe(false);
    expect(writes).toEqual([]);
    expect(clearCommandCalls()).toBe(1);
  });

  test("accepts the selected suggestion when enter is pressed on an empty token after navigating", async () => {
    const { manager, writes, clearCommandCalls } = await setup("git checkout ", "");

    manager.update({ name: "down", sequence: "\u001b[B", shift: false, ctrl: false }, true);
    expect(manager.update(enter, true)).toBe(true);
    expect(writes).not.toEqual([]);
    expect(clearCommandCalls()).toBe(0);
  });
});
