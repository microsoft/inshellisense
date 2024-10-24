// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from "node:fs";

import { getSuggestions } from "../../runtime/runtime.js";
import { Shell } from "../../utils/shell.js";
import { SuggestionIcons } from "../../runtime/suggestion.js";

const testData = [
  { name: "partialPrefixFilter", command: "git sta" },
  { name: "completePrefixFilter", command: "git stat" },
  { name: "emptySuggestions", command: "git to" },
  { name: "alreadyUsedSuggestion", command: "cd ~ " },
  { name: "alreadyUsedOption", command: "act --bind --b" },
  { name: "exclusiveOnOption", command: "ag --affinity --no" },
  { name: "providedSuggestion", command: "bw completion --shell " },
  { name: "fullyTypedSuggestion", command: "ls -W" },
  { name: "provideFolderSuggestion", command: "ls sr" },
  { name: "provideFileSuggestion", command: "ls READ" },
  { name: "optionsSuggestedAfterVariadicArg", command: "ls item -l", maxSuggestions: 3 },
  { name: "noOptionsSuggestedDuringVariadicArg", command: "ls -W ite" },
  { name: "providedArgDescription", command: "act completion bash -a " },
  { name: "completedOptionWithArg", command: "act completion bash -a 'actor' " },
  { name: "command", command: "sudo git sta" },
  { name: "nestedNonCommands", command: "az az ", skip: true }, // TODO: fix skipped test
  { name: "loadSpec", command: "aws acm add" },
  { name: "noArgsArgumentGiven", command: "gcc lab ", maxSuggestions: 3 },
  { name: "generatorUsingPartialInput", command: "dotnet add package Microsoft.Azure.WebJobs.Cor", maxSuggestions: 1 },
  { name: "pathSuggestion", command: "source she" },
  { name: "pathNestedSuggestion", command: "source .github/work" },
  { name: "pathWithFileSuggestion", command: "source shell/", maxSuggestions: 1 },
  { name: "pathWithFileFilteredSuggestion", command: "source shell/shellIntegration.", maxSuggestions: 1 },
];

describe(`parseCommand`, () => {
  testData.forEach(({ command, name, skip, maxSuggestions }) => {
    if (skip) return;
    test(name, async () => {
      const suggestions = await getSuggestions(command, process.cwd(), Shell.Bash);
      if (suggestions != null && suggestions.suggestions != null) {
        suggestions.suggestions = suggestions?.suggestions.slice(0, maxSuggestions);
      }
      expect(suggestions).toMatchSnapshot();
    });
  });
});

const commandSuggestionsData = [
  {
    name: "brewInstallMullvad",
    command: "brew install mullvad-brow",
    platforms: ["darwin"],
    maxSuggestions: 1,
    expectedNames: ["mullvad-browser"],
    expectedIcons: ["🍺"],
  },
  { name: "gitStat", command: "git stat", maxSuggestions: 1, expectedNames: ["status"], expectedIcons: [SuggestionIcons.Subcommand] }, // subcommand generator
  { name: "gitStatus", command: "git status ", expectedNames: ["demo.ts"] }, // script + post-process generator
  { name: "ls", command: "ls ", expectedNames: [".eslintrc.cjs"], expectedIcons: [SuggestionIcons.File] }, // file generator
  { name: "cd", command: "cd ", expectedNames: ["docs/"], expectedIcons: [SuggestionIcons.Folder] }, // folder generator
  { name: "find", command: "find -", maxSuggestions: 1, expectedIcons: [SuggestionIcons.Option] }, // filtering file generator
  { name: "goTool", command: "go build -buildmode ", maxSuggestions: 1, expectedNames: ["archive"] }, // script + split-on generator
  { name: "preCommitRun", command: "pre-commit run ", maxSuggestions: 1, expectedIcons: [SuggestionIcons.Option] }, // script + post-process generator w/ console logs
];

describe(`getCommandSuggestions`, () => {
  beforeAll(async () => await getCommandSuggestionsSetup());

  commandSuggestionsData.forEach(({ command, name, maxSuggestions, expectedNames, expectedIcons, platforms }) => {
    if (platforms != null && !platforms.includes(process.platform)) return;
    test(name, async () => {
      const suggestions = await getSuggestions(command, process.cwd(), Shell.Bash);
      if (suggestions != null && suggestions.suggestions != null) {
        suggestions.suggestions = suggestions?.suggestions.slice(0, maxSuggestions);
      }
      const names = suggestions?.suggestions.map((s) => s.allNames).flat() ?? [];
      const icons = suggestions?.suggestions.map((s) => s.icon) ?? [];
      expect(names).toEqual(expect.arrayContaining(expectedNames ?? []));
      expect(icons).toEqual(expect.arrayContaining(expectedIcons ?? []));
    });
  });

  afterAll(async () => await getCommandSuggestionsCleanup());
});

const getCommandSuggestionsSetup = async () => {
  fs.closeSync(fs.openSync("demo.ts", "w"));
};

const getCommandSuggestionsCleanup = async () => {
  fs.rmSync("demo.ts");
};
