// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { jest } from "@jest/globals";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { Shell } from "../../utils/shell.js";
import { getConfig } from "../../utils/config.js";

const utils = await import("../../runtime/utils.js");
const constants = await import("../../utils/constants.js");
const specsPath = path.join(process.cwd(), "node_modules", "@withfig", "autocomplete", "build");
const executeShellCommand = jest.fn<Fig.ExecuteCommandFunction>();
const buildExecuteShellCommand = jest.fn(() => executeShellCommand);

jest.unstable_mockModule("../../runtime/utils.js", () => ({ ...utils, buildExecuteShellCommand }));
jest.unstable_mockModule("../../utils/constants.js", () => ({ ...constants, specResourcesPath: specsPath }));

const { getSuggestions, clearTransientSuggestionState } = await import("../../runtime/runtime.js");
const { getGeneratedSubcommand } = await import("../../runtime/specs.js");
const { parseCommand } = await import("../../runtime/parser.js");
const zSpec = (await import(pathToFileURL(path.join(specsPath, "z.js")).href)).default as Fig.Subcommand;
const gitSpec = (await import(pathToFileURL(path.join(specsPath, "git.js")).href)).default as Fig.Subcommand;
const cwd = path.join(process.cwd(), "src");

beforeEach(() => {
  jest.clearAllMocks();
  clearTransientSuggestionState();
  getConfig().cacheGeneratedSpecs = true;
  executeShellCommand.mockReset().mockResolvedValue({ stdout: "", stderr: "", status: 0 });
});

afterEach(() => {
  jest.restoreAllMocks();
  getConfig().cacheGeneratedSpecs = true;
});

test.each(["z ", "z project"])("resolves the bundled zoxide wrapper for %p", async (command) => {
  executeShellCommand.mockImplementation(async ({ command }) => ({
    stdout: command === "zoxide" ? "10 /work/project" : "",
    stderr: "",
    status: 0,
  }));
  const controller = new AbortController();

  const result = await getSuggestions(command, cwd, Shell.Zsh, controller.signal);

  expect(result?.suggestions.map((suggestion) => suggestion.name)).toContain("/work/project");
  expect(executeShellCommand).toHaveBeenCalledWith({ command: "bash", args: ["-c", "command -v zoxide"], cwd });
  expect(buildExecuteShellCommand).toHaveBeenCalledWith(5000, controller.signal);
});

test("merges generated completions without modifying the cached static spec", async () => {
  const subcommands = [...(gitSpec.subcommands ?? [])];
  const options = [...(gitSpec.options ?? [])];
  const generateSpec = jest
    .spyOn(gitSpec, "generateSpec")
    .mockResolvedValueOnce({
      name: "git",
      subcommands: [{ name: "generated-command" }],
      options: [{ name: "--generated-option" }],
      args: { suggestions: ["generated-argument"] },
    })
    .mockResolvedValueOnce({ name: "git", subcommands: [{ name: "fresh-command" }] });

  const first = await getSuggestions("git ", cwd, Shell.Bash);
  const second = await getSuggestions("git ", process.cwd(), Shell.Bash);
  const firstNames = first?.suggestions.map((suggestion) => suggestion.name);
  const secondNames = second?.suggestions.map((suggestion) => suggestion.name);

  expect(firstNames).toEqual(expect.arrayContaining(["status", "--help", "generated-command", "--generated-option", "generated-argument"]));
  expect(secondNames).toEqual(expect.arrayContaining(["status", "--help", "fresh-command"]));
  expect(secondNames).not.toContain("generated-command");
  expect(secondNames).not.toContain("--generated-option");
  expect(secondNames).not.toContain("generated-argument");
  expect(gitSpec.subcommands).toEqual(subcommands);
  expect(gitSpec.options).toEqual(options);
  expect(generateSpec).toHaveBeenCalledTimes(2);
});

test.each(["failure", "empty"] as const)("retains static completions after %s generation", async (result) => {
  const generateSpec = jest.spyOn(gitSpec, "generateSpec").mockImplementation(async () => {
    if (result === "failure") throw new Error("generator failed");
    // Some bundled generators return nothing when no extra commands are available.
    return undefined as unknown as Fig.Spec;
  });

  const suggestions = await getSuggestions("git ", cwd, Shell.Bash);

  expect(suggestions?.suggestions.map((suggestion) => suggestion.name)).toEqual(expect.arrayContaining(["status", "--help"]));
  await getSuggestions("git sta", cwd, Shell.Bash);
  expect(generateSpec).toHaveBeenCalledTimes(result === "failure" ? 2 : 1);
});

test("generates a wrapped command's spec with its own tokens and preserves explicit execution directories", async () => {
  const generateSpec = jest.spyOn(zSpec, "generateSpec").mockImplementation(async (_tokens, execute) => {
    await execute({ command: "probe", args: [], cwd: process.cwd() });
    return { name: "z", args: { suggestions: ["project"] } };
  });

  const result = await getSuggestions("sudo z proj", cwd, Shell.Bash);

  expect(result?.suggestions.map((suggestion) => suggestion.name)).toEqual(["project"]);
  expect(generateSpec).toHaveBeenCalledWith(["z", "proj"], expect.any(Function));
  expect(executeShellCommand).toHaveBeenCalledWith({ command: "probe", args: [], cwd: process.cwd() });
});

test.each([false, true])("propagates cancellation when generation rejects: %p", async (reject) => {
  const controller = new AbortController();
  jest.spyOn(gitSpec, "generateSpec").mockImplementation(async () => {
    controller.abort();
    if (reject) throw new Error("interrupted");
    return { name: "git", subcommands: [{ name: "stale-command" }] };
  });

  await expect(getSuggestions("git ", cwd, Shell.Bash, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
});

test("reuses generated specs while typing and regenerates after the prompt ends", async () => {
  const generateSpec = jest.spyOn(zSpec, "generateSpec").mockResolvedValue({ name: "z", args: { suggestions: ["project"] } });

  const first = await getSuggestions("z p", cwd, Shell.Bash);
  const second = await getSuggestions("z pr", cwd, Shell.Bash);

  expect(first?.suggestions.map((suggestion) => suggestion.name)).toEqual(["project"]);
  expect(second?.suggestions.map((suggestion) => suggestion.name)).toEqual(["project"]);
  expect(generateSpec).toHaveBeenCalledTimes(1);

  clearTransientSuggestionState();
  generateSpec.mockResolvedValue({ name: "z", args: { suggestions: ["project-new"] } });
  const nextPrompt = await getSuggestions("z p", cwd, Shell.Bash);

  expect(nextPrompt?.suggestions.map((suggestion) => suggestion.name)).toEqual(["project-new"]);
  expect(generateSpec).toHaveBeenCalledTimes(2);
});

test("scopes generated specs by spec identity and working directory", async () => {
  const first = { name: "tool", generateSpec: jest.fn<NonNullable<Fig.Subcommand["generateSpec"]>>().mockResolvedValue({ name: "first" }) };
  const second = { name: "tool", generateSpec: jest.fn<NonNullable<Fig.Subcommand["generateSpec"]>>().mockResolvedValue({ name: "second" }) };
  const tokens = parseCommand("tool ", Shell.Bash);

  for (const directory of [cwd, process.cwd(), cwd]) {
    await expect(getGeneratedSubcommand(first, tokens, directory)).resolves.toMatchObject({ name: "first" });
    await expect(getGeneratedSubcommand(second, tokens, directory)).resolves.toMatchObject({ name: "second" });
  }

  expect(first.generateSpec).toHaveBeenCalledTimes(2);
  expect(second.generateSpec).toHaveBeenCalledTimes(2);
});

test.each(["configuration", "spec", "generated spec"])("bypasses the cache when disabled by %s", async (disabledBy) => {
  const spec: Fig.Subcommand = {
    name: "tool",
    cache: disabledBy === "spec" ? false : undefined,
    generateSpec: jest.fn<NonNullable<Fig.Subcommand["generateSpec"]>>().mockResolvedValue({
      name: "tool",
      cache: disabledBy === "generated spec" ? false : undefined,
    }),
  };
  if (disabledBy === "configuration") getConfig().cacheGeneratedSpecs = false;
  const tokens = parseCommand("tool ", Shell.Bash);

  await getGeneratedSubcommand(spec, tokens, cwd);
  await getGeneratedSubcommand(spec, tokens, cwd);

  expect(spec.generateSpec).toHaveBeenCalledTimes(2);
});

test("keeps zoxide directory suggestions live when the root spec is cached", async () => {
  const generateSpec = jest.spyOn(zSpec, "generateSpec");
  executeShellCommand.mockImplementation(async ({ command, args }) => ({
    stdout: command === "zoxide" ? `10 /work/${args.at(-1) === "pr" ? "project-new" : "project"}` : "",
    stderr: "",
    status: 0,
  }));

  const first = await getSuggestions("z p", cwd, Shell.Bash);
  const second = await getSuggestions("z pr", cwd, Shell.Bash);

  expect(first?.suggestions.map((suggestion) => suggestion.name)).toContain("/work/project");
  expect(second?.suggestions.map((suggestion) => suggestion.name)).toContain("/work/project-new");
  expect(second?.suggestions.map((suggestion) => suggestion.name)).not.toContain("/work/project");
  expect(generateSpec).toHaveBeenCalledTimes(1);
  expect(executeShellCommand.mock.calls.filter(([input]) => input.command === "zoxide")).toHaveLength(2);
});

test.each(["prompt reset", "cancellation"])("does not cache an obsolete in-flight generation after %s", async (invalidation) => {
  let resolve!: (spec: Fig.Spec) => void;
  const pending = new Promise<Fig.Spec>((resolvePromise) => {
    resolve = resolvePromise;
  });
  const spec: Fig.Subcommand = {
    name: "tool",
    generateSpec: jest.fn<NonNullable<Fig.Subcommand["generateSpec"]>>().mockReturnValueOnce(pending).mockResolvedValue({ name: "current" }),
  };
  const tokens = parseCommand("tool ", Shell.Bash);
  const controller = new AbortController();
  const obsolete = getGeneratedSubcommand(spec, tokens, cwd, controller.signal).catch((error) => error);

  if (invalidation === "prompt reset") clearTransientSuggestionState();
  else controller.abort();

  await expect(getGeneratedSubcommand(spec, tokens, cwd)).resolves.toMatchObject({ name: "current" });
  resolve({ name: "obsolete" });
  const oldResult = await obsolete;
  if (invalidation === "cancellation") expect(oldResult).toMatchObject({ name: "AbortError" });

  await expect(getGeneratedSubcommand(spec, tokens, cwd)).resolves.toMatchObject({ name: "current" });
  expect(spec.generateSpec).toHaveBeenCalledTimes(2);
});
