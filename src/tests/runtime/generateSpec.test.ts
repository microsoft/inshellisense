// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { jest } from "@jest/globals";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { Shell } from "../../utils/shell.js";

const utils = await import("../../runtime/utils.js");
const constants = await import("../../utils/constants.js");
const specsPath = path.join(process.cwd(), "node_modules", "@withfig", "autocomplete", "build");
const executeShellCommand = jest.fn<Fig.ExecuteCommandFunction>();
const buildExecuteShellCommand = jest.fn(() => executeShellCommand);

jest.unstable_mockModule("../../runtime/utils.js", () => ({ ...utils, buildExecuteShellCommand }));
jest.unstable_mockModule("../../utils/constants.js", () => ({ ...constants, specResourcesPath: specsPath }));

const { getSuggestions, clearTransientSuggestionState } = await import("../../runtime/runtime.js");
const zSpec = (await import(pathToFileURL(path.join(specsPath, "z.js")).href)).default as Fig.Subcommand;
const gitSpec = (await import(pathToFileURL(path.join(specsPath, "git.js")).href)).default as Fig.Subcommand;
const cwd = path.join(process.cwd(), "src");

beforeEach(() => {
  jest.clearAllMocks();
  clearTransientSuggestionState();
  executeShellCommand.mockReset().mockResolvedValue({ stdout: "", stderr: "", status: 0 });
});

afterEach(() => {
  jest.restoreAllMocks();
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
  jest.spyOn(gitSpec, "generateSpec").mockImplementation(async () => {
    if (result === "failure") throw new Error("generator failed");
    // Some bundled generators return nothing when no extra commands are available.
    return undefined as unknown as Fig.Spec;
  });

  const suggestions = await getSuggestions("git ", cwd, Shell.Bash);

  expect(suggestions?.suggestions.map((suggestion) => suggestion.name)).toEqual(expect.arrayContaining(["status", "--help"]));
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
