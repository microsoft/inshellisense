// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { getArgDrivenRecommendation, getSubcommandDrivenRecommendation } from "../../runtime/suggestion.js";
import { CommandToken } from "../../runtime/parser.js";
import { Shell } from "../../utils/shell.js";

// The runtime flags any token containing a path separator as a path (see resolveCwd), so branch names
// like feat/foo reach the suggestion ranking as path tokens.
const token = (value: string): CommandToken => ({
  token: value,
  tokenLength: value.length,
  complete: false,
  isOption: false,
  ...(value.includes("/") ? { isPath: true, isPathComplete: value.endsWith("/") } : {}),
});

type Rank = (suggestions: Fig.Suggestion[], typed: string, filterStrategy?: Fig.Arg["filterStrategy"]) => Promise<string[]>;

// Completing an argument right after a subcommand, e.g. `git checkout feat/foo`.
const rankFromSubcommand: Rank = async (suggestions, typed, filterStrategy) => {
  const partialToken = token(typed);
  const blob = await getSubcommandDrivenRecommendation(
    { name: "checkout", args: { name: "branch", suggestions, filterStrategy } },
    [],
    partialToken,
    false,
    false,
    [],
    [partialToken],
    process.cwd(),
    Shell.Bash,
  );
  return blob?.suggestions.map((s) => s.name) ?? [];
};

// Completing an argument slot reached after other tokens, e.g. an option's value or a variadic argument.
const rankFromArg: Rank = async (suggestions, typed, filterStrategy) => {
  const partialToken = token(typed);
  const blob = await getArgDrivenRecommendation(
    [{ name: "branch", suggestions, filterStrategy }],
    { name: "checkout" },
    [],
    partialToken,
    [],
    [partialToken],
    false,
    process.cwd(),
    Shell.Bash,
  );
  return blob?.suggestions.map((s) => s.name) ?? [];
};

// Mirrors the git spec, which gives the current branch priority 100 and other branches priority 75, and
// filters branch arguments fuzzily (path tokens are filtered by their basename, e.g. search-).
const branches: Fig.Suggestion[] = [
  { name: "feat/search-1234", description: "Current branch", priority: 100 },
  { name: "feat/search-", description: "Branch", priority: 75 },
  { name: "fix/search-5678", description: "Branch", priority: 75 },
];

describe.each([
  ["getSubcommandDrivenRecommendation", rankFromSubcommand],
  ["getArgDrivenRecommendation", rankFromArg],
])("%s ranking", (_, rank) => {
  const rankBranches = (typed: string) => rank(branches, typed, "fuzzy");

  test("ranks an exact branch name above the higher priority current branch", async () => {
    expect(await rankBranches("feat/search-")).toEqual(["feat/search-", "feat/search-1234", "fix/search-5678"]);
  });

  test("matches exactly case-sensitively", async () => {
    const options: Fig.Suggestion[] = [
      { name: "-L", priority: 100 },
      { name: "-l", priority: 50 },
    ];
    expect(await rank(options, "-l")).toEqual(["-l", "-L"]);
  });

  test("matches exactly on any of a suggestion's names", async () => {
    const suggestions: Fig.Suggestion[] = [
      { name: "statistics", priority: 100 },
      { name: ["stat", "status"], priority: 50 },
    ];
    expect((await rank(suggestions, "stat"))[0]).toBe("stat");
  });

  test("keeps priority order when nothing matches exactly", async () => {
    expect(await rankBranches("feat/s")).toEqual(["feat/search-1234", "feat/search-", "fix/search-5678"]);
  });
});
