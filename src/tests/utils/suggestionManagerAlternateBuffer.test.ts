// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { ISTerm } from "../../isterm/pty.js";
import type { SuggestionBlob } from "../../runtime/model.js";
import { Shell } from "../../utils/shell.js";
import { SuggestionManager } from "../../ui/suggestionManager.js";

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

test("clears rendered suggestions when suspended", async () => {
  let transientClears = 0;
  const suggestionBlob: SuggestionBlob = {
    suggestions: [{ name: "current", allNames: ["current"], icon: "*", priority: 50 }],
  };
  const terminal = {
    cwd: process.cwd(),
    cols: 80,
    getCommandState: () => ({ commandText: "first", cursorTerminated: true, hasOutput: false }),
    getCursorState: () => ({ cursorX: 0 }),
  } as unknown as ISTerm;
  const runtime = Promise.resolve({
    getSuggestions: async () => suggestionBlob,
    clearTransientSuggestionState: () => {
      transientClears += 1;
    },
  });
  const manager = new SuggestionManager(terminal, Shell.Bash, runtime);

  await manager.exec();
  expect(manager.render("below", 0)).not.toEqual([]);

  await manager.suspend();

  expect(manager.render("below", 0)).toEqual([]);
  expect(transientClears).toBe(1);
});

test("clears transient state when an in-flight request is suspended", async () => {
  let transientClears = 0;
  const suggestions = deferred<SuggestionBlob>();
  const terminal = {
    cwd: process.cwd(),
    cols: 80,
    getCommandState: () => ({ commandText: "first", cursorTerminated: true, hasOutput: false }),
    getCursorState: () => ({ cursorX: 0 }),
  } as unknown as ISTerm;
  const runtime = Promise.resolve({
    getSuggestions: async () => suggestions.promise,
    clearTransientSuggestionState: () => {
      transientClears += 1;
    },
  });
  const manager = new SuggestionManager(terminal, Shell.Bash, runtime);

  const request = manager.exec();
  await manager.suspend();

  suggestions.resolve({ suggestions: [] });

  await expect(request).resolves.toBe(false);
  expect(transientClears).toBe(1);
});
