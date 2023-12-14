// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { getSuggestions } from "../../runtime/runtime.js";

const testData = [
  { name: "partialPrefixFilter", command: "git sta" },
  { name: "completePrefixFilter", command: "git stat" },
  { name: "emptySuggestions", command: "git to" },
  { name: "alreadyUsedSuggestion", command: "cd ~ " },
  { name: "alreadyUsedOption", command: "act --bind --b" },
  { name: "exclusiveOnOption", command: "ag --affinity --no" },
  { name: "providedSuggestion", command: "bw completion --shell " },
  { name: "fullyTypedSuggestion", command: "ls -W" },
  { name: "optionsSuggestedAfterVariadicArg", command: "ls item -", maxSuggestions: 3 },
  { name: "noOptionsSuggestedDuringVariadicArg", command: "ls -W ite" },
  { name: "providedArgDescription", command: "act completion bash -a " },
  { name: "completedOptionWithArg", command: "act completion bash -a 'actor' " },
  { name: "command", command: "sudo git sta" },
  { name: "nestedNonCommands", command: "az az ", skip: true }, // TODO: fix skipped test
  { name: "loadSpec", command: "aws acm add" },
  { name: "noArgsArgumentGiven", command: "gcc lab ", maxSuggestions: 3 },
];

describe(`parseCommand`, () => {
  testData.forEach(({ command, name, skip, maxSuggestions }) => {
    if (skip) return;
    test(name, async () => {
      const suggestions = await getSuggestions(command);
      if (suggestions != null && suggestions.suggestions != null) {
        suggestions.suggestions = suggestions?.suggestions.slice(0, maxSuggestions);
      }
      expect(suggestions).toMatchSnapshot();
    });
  });
});
