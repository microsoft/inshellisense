// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { jest } from "@jest/globals";

import { clearGeneratorState, clearImplicitGeneratorState, getGeneratorSuggestions } from "../../runtime/generatorCache.js";
import { executeGenerator, getGeneratorQueryTerm } from "../../runtime/generator.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

beforeEach(() => {
  clearGeneratorState();
  jest.useRealTimers();
});

test("debounces opted-in generators for 100ms", async () => {
  jest.useFakeTimers();
  let calls = 0;
  const generator: Fig.Generator = {
    custom: async () => {
      calls += 1;
      return [{ name: "result" }];
    },
  };

  const result = getGeneratorSuggestions(generator, ["tool", "query"], "query", process.cwd(), true);
  await jest.advanceTimersByTimeAsync(99);
  expect(calls).toBe(0);
  await jest.advanceTimersByTimeAsync(1);

  await expect(result).resolves.toEqual([{ name: "result" }]);
  expect(calls).toBe(1);
});

test("reuses generated suggestions until a trigger matches", async () => {
  let calls = 0;
  const generator: Fig.Generator = {
    trigger: "/",
    custom: async () => {
      calls += 1;
      return [{ name: `result-${calls}` }];
    },
  };

  await getGeneratorSuggestions(generator, ["tool", "one"], "one", process.cwd(), false);
  const reused = await getGeneratorSuggestions(generator, ["tool", "onetwo"], "onetwo", process.cwd(), false);
  const regenerated = await getGeneratorSuggestions(generator, ["tool", "one/two"], "one/two", process.cwd(), false);

  expect(reused).toEqual([{ name: "result-1" }]);
  expect(regenerated).toEqual([{ name: "result-2" }]);
  expect(calls).toBe(2);
});

test("uses configured query terms", () => {
  const generator: Fig.Generator = {
    getQueryTerm: (token) => token.split("/").at(-1) ?? "",
  };

  expect(getGeneratorQueryTerm(generator, "folder/partial")).toBe("partial");
});

test("treats string query terms as delimiters", () => {
  const generator: Fig.Generator = {
    getQueryTerm: ":",
  };

  expect(getGeneratorQueryTerm(generator, "owner:group")).toBe("group");
  expect(getGeneratorQueryTerm(generator, "owner")).toBe("owner");
});

test("scopes configured caches by directory", async () => {
  let calls = 0;
  const generator: Fig.Generator = {
    cache: { strategy: "max-age", ttl: 60_000, cacheByDirectory: true },
    custom: async () => {
      calls += 1;
      return [{ name: `result-${calls}` }];
    },
  };

  await getGeneratorSuggestions(generator, ["tool"], "", "first", false);
  await getGeneratorSuggestions(generator, ["tool"], "", "first", false);
  await getGeneratorSuggestions(generator, ["tool"], "", "second", false);

  expect(calls).toBe(2);
});

test("does not reuse an in-flight refresh after a trigger invalidates it", async () => {
  const refresh = deferred<Fig.Suggestion[]>();
  let calls = 0;
  const generator: Fig.Generator = {
    trigger: "/",
    cache: { strategy: "stale-while-revalidate", ttl: -1 },
    custom: async () => {
      calls += 1;
      if (calls === 2) return refresh.promise;
      return [{ name: `result-${calls}` }];
    },
  };
  await getGeneratorSuggestions(generator, ["tool", "one"], "one", process.cwd(), false);
  await getGeneratorSuggestions(generator, ["tool", "one"], "one", process.cwd(), false);
  await getGeneratorSuggestions(generator, ["tool", "onetwo"], "onetwo", process.cwd(), false);
  const triggered = await getGeneratorSuggestions(generator, ["tool", "one/two"], "one/two", process.cwd(), false);
  refresh.resolve([{ name: "obsolete" }]);
  await refresh.promise;

  expect(triggered).toEqual([{ name: "result-3" }]);
  expect(calls).toBe(3);
});

test("clears implicit caches between prompts", async () => {
  let value = "first";
  let calls = 0;
  const generator: Fig.Generator = {
    custom: async () => {
      calls += 1;
      return [{ name: value }];
    },
  };

  await expect(getGeneratorSuggestions(generator, ["tool"], "", process.cwd(), false)).resolves.toEqual([{ name: "first" }]);
  value = "second";
  await expect(getGeneratorSuggestions(generator, ["tool"], "", process.cwd(), false)).resolves.toEqual([{ name: "first" }]);
  clearImplicitGeneratorState();
  await expect(getGeneratorSuggestions(generator, ["tool"], "", process.cwd(), false)).resolves.toEqual([{ name: "second" }]);

  expect(calls).toBe(2);
});

test("retries a failed triggered generation", async () => {
  let calls = 0;
  const generator: Fig.Generator = {
    trigger: { on: "change" },
    custom: async () => {
      calls += 1;
      if (calls === 2) throw new Error("temporary failure");
      return [{ name: `result-${calls}` }];
    },
  };

  await getGeneratorSuggestions(generator, ["tool", "a"], "a", process.cwd(), false);
  await expect(getGeneratorSuggestions(generator, ["tool", "ab"], "ab", process.cwd(), false)).resolves.toEqual([]);
  await expect(getGeneratorSuggestions(generator, ["tool", "ab"], "ab", process.cwd(), false)).resolves.toEqual([{ name: "result-3" }]);

  expect(calls).toBe(3);
});

test("background refreshes do not move trigger state backward", async () => {
  const refresh = deferred<Fig.Suggestion[]>();
  let calls = 0;
  const generator: Fig.Generator = {
    trigger: { on: "change" },
    cache: { strategy: "stale-while-revalidate", ttl: -1 },
    custom: async () => {
      calls += 1;
      if (calls === 2) return refresh.promise;
      return [{ name: `result-${calls}` }];
    },
  };

  await getGeneratorSuggestions(generator, ["tool", "a"], "a", process.cwd(), false);
  await getGeneratorSuggestions(generator, ["tool", "a"], "a", process.cwd(), false);
  await getGeneratorSuggestions(generator, ["tool", "ab"], "ab", process.cwd(), false);
  refresh.resolve([{ name: "obsolete" }]);
  await refresh.promise;
  const result = await getGeneratorSuggestions(generator, ["tool", "abc"], "abc", process.cwd(), false);

  expect(result).toEqual([{ name: "result-4" }]);
  expect(calls).toBe(4);
});

test("does not reuse an aborted in-flight generation", async () => {
  const firstResult = deferred<Fig.Suggestion[]>();
  let calls = 0;
  const generator: Fig.Generator = {
    custom: async () => {
      calls += 1;
      return calls === 1 ? firstResult.promise : [{ name: "current" }];
    },
  };
  const firstController = new AbortController();
  const firstRequest = getGeneratorSuggestions(generator, ["tool"], "", process.cwd(), false, firstController.signal).catch((error) => error);
  firstController.abort();

  const current = await getGeneratorSuggestions(generator, ["tool"], "", process.cwd(), false, new AbortController().signal);
  firstResult.resolve([{ name: "stale" }]);
  const firstError = await firstRequest;

  expect(current).toEqual([{ name: "current" }]);
  expect((firstError as { name?: string }).name).toBe("AbortError");
  expect(calls).toBe(2);
});

test("reuses a generator when a path query moves past a delimiter", async () => {
  let calls = 0;
  const generator: Fig.Generator = {
    custom: async () => {
      calls += 1;
      return [{ name: "entry" }];
    },
  };
  await getGeneratorSuggestions(generator, ["tool", "folder/"], "folder/", process.cwd(), false);
  await getGeneratorSuggestions(generator, ["tool", "folder/e"], "folder/e", process.cwd(), false);

  expect(calls).toBe(1);
});

describe("custom generator executeShellCommand", () => {
  const nodeGenerator = (script: string, cwd?: string): Fig.Generator => ({
    custom: async (_tokens, executeShellCommand) => {
      const { stdout } = await executeShellCommand({ command: process.execPath, args: ["-e", script], cwd });
      return [{ name: stdout }];
    },
  });

  test("runs in the generator's cwd when the generator does not pass one", async () => {
    const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "generator-cwd-")));
    try {
      const [suggestion] = await executeGenerator(nodeGenerator("process.stdout.write(process.cwd())"), [], dir);
      expect(suggestion.name).toBe(dir);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test("keeps a cwd passed by the generator", async () => {
    const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "generator-cwd-")));
    try {
      const [suggestion] = await executeGenerator(nodeGenerator("process.stdout.write(process.cwd())", dir), [], os.tmpdir());
      expect(suggestion.name).toBe(dir);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test("cleans output like Fig: CRLF to LF, no leading or trailing newlines", async () => {
    const script = String.raw`process.stdout.write("\r\n\n  a\r\nb  \r\n\n")`;
    const [suggestion] = await executeGenerator(nodeGenerator(script), [], process.cwd());
    expect(suggestion.name).toBe("  a\nb  ");
  });
});
