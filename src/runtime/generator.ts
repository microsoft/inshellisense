// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { runTemplates } from "./template.js";
import { buildExecuteShellCommand } from "./utils.js";

const getGeneratorContext = (): Fig.GeneratorContext => {
  return {
    environmentVariables: Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] != null)),
    currentWorkingDirectory: process.cwd(),
    currentProcess: "", // TODO: define current process
    sshPrefix: "", // deprecated, should be empty
    isDangerous: false,
    searchTerm: "", // TODO: define search term
  };
};

// TODO: add support for caching, trigger, & getQueryTerm
export const runGenerator = async (generator: Fig.Generator, tokens: string[]): Promise<Fig.Suggestion[]> => {
  const { script, postProcess, scriptTimeout, splitOn, custom, template } = generator;

  const executeShellCommand = buildExecuteShellCommand(scriptTimeout ?? 5000);
  const suggestions = [];
  try {
    if (script) {
      const scriptOutput = typeof script === "function" ? script(tokens) : script != null ? await executeShellCommand(script) : "";
      if (postProcess) {
        suggestions.push(...postProcess(scriptOutput, tokens));
      } else if (splitOn) {
        suggestions.push(...scriptOutput.split(splitOn).map((s) => ({ name: s })));
      }
    }

    if (custom) {
      suggestions.push(...(await custom(tokens, executeShellCommand, getGeneratorContext())));
    }

    if (template != null) {
      suggestions.push(...(await runTemplates(template)));
    }
    return suggestions;
  } catch (e) {
    /* empty */
  }
  return suggestions;
};
