// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { parseCommand, CommandToken } from "./parser.js";
import { getArgDrivenRecommendation, getSubcommandDrivenRecommendation, SuggestionIcons } from "./suggestion.js";
import { Suggestion, SuggestionBlob } from "./model.js";
import { resolveCwd } from "./utils.js";
import { Shell } from "../utils/shell.js";
import { aliasExpand, getAliasNames } from "./alias.js";
import { endTiming, startTiming } from "../utils/performance.js";
import { clearImplicitGeneratorState } from "./generatorCache.js";
import { genSubcommand, getGeneratedSubcommand, getSpecNames, loadSpec } from "./specs.js";

export const getSuggestions = async (cmd: string, cwd: string, shell: Shell, signal?: AbortSignal): Promise<SuggestionBlob | undefined> => {
  const suggestionTiming = startTiming();
  try {
    let activeCmd = parseCommand(cmd, shell);
    const rootToken = activeCmd.at(0);
    if (activeCmd.length === 0) {
      return;
    }
    if (rootToken != null && !rootToken.complete) {
      return runCommand(rootToken);
    }

    activeCmd = aliasExpand(activeCmd);

    signal?.throwIfAborted();
    const spec = await loadSpec(activeCmd, signal);
    if (spec == null) return;
    const subcommand = await getGeneratedSubcommand(spec, activeCmd, cwd, signal);
    if (subcommand == null) return;

    signal?.throwIfAborted();
    const lastCommand = activeCmd.at(-1);
    const { cwd: resolvedCwd, pathy, complete: pathyComplete } = await resolveCwd(lastCommand, cwd, shell, signal);
    if (pathy && lastCommand) {
      lastCommand.isPath = true;
      lastCommand.isPathComplete = pathyComplete;
    }
    const result = await runSubcommand(activeCmd.slice(1), activeCmd, subcommand, resolvedCwd, shell, undefined, undefined, undefined, undefined, signal);
    if (result == null) return;
    if (result.suggestions.length == 0 && !result.argumentDescription) return;

    const activeToken = lastCommand?.complete ? undefined : lastCommand;
    return { ...result, activeToken };
  } finally {
    endTiming("runtime.getSuggestions", suggestionTiming);
  }
};

export const clearTransientSuggestionState = (): void => clearImplicitGeneratorState();

const prefixMatches = (values: string[], prefix: string): string[] => {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (values[middle] < prefix) low = middle + 1;
    else high = middle;
  }

  const matches: string[] = [];
  for (let index = low; index < values.length && values[index].startsWith(prefix); index++) {
    matches.push(values[index]);
  }
  return matches;
};

const getPersistentOptions = (persistentOptions: Fig.Option[], options?: Fig.Option[]) => {
  const persistentOptionNames = new Set(persistentOptions.map((o) => (typeof o.name === "string" ? [o.name] : o.name)).flat());
  return persistentOptions.concat(
    (options ?? []).filter(
      (o) => (typeof o.name == "string" ? !persistentOptionNames.has(o.name) : o.name.some((n) => !persistentOptionNames.has(n))) && o.isPersistent === true,
    ),
  );
};

const getOption = (activeToken: CommandToken, options: Fig.Option[]): Fig.Option | undefined => {
  return options.find((o) => (typeof o.name === "string" ? o.name === activeToken.token : o.name.includes(activeToken.token)));
};

const getPersistentTokens = (tokens: CommandToken[]): CommandToken[] => {
  return tokens.filter((t) => t.isPersistent === true);
};

const getArgs = (args: Fig.SingleOrArray<Fig.Arg> | undefined): Fig.Arg[] => {
  return args instanceof Array ? args : args != null ? [args] : [];
};

const runOption = async (
  tokens: CommandToken[],
  allTokens: CommandToken[],
  option: Fig.Option,
  subcommand: Fig.Subcommand,
  cwd: string,
  shell: Shell,
  persistentOptions: Fig.Option[],
  acceptedTokens: CommandToken[],
  signal?: AbortSignal,
): Promise<SuggestionBlob | undefined> => {
  if (tokens.length === 0) {
    throw new Error("invalid state reached, option expected but no tokens found");
  }
  const activeToken = tokens[0];
  const isPersistent = persistentOptions.some((o) => (typeof o.name === "string" ? o.name === activeToken.token : o.name.includes(activeToken.token)));
  if ((option.args instanceof Array && option.args.length > 0) || option.args != null) {
    const args = option.args instanceof Array ? option.args : [option.args];
    return runArg(tokens.slice(1), allTokens, args, subcommand, cwd, shell, persistentOptions, acceptedTokens.concat(activeToken), true, false, signal);
  }
  return runSubcommand(
    tokens.slice(1),
    allTokens,
    subcommand,
    cwd,
    shell,
    persistentOptions,
    acceptedTokens.concat({
      ...activeToken,
      isPersistent,
    }),
    undefined,
    undefined,
    signal,
  );
};

const runArg = async (
  tokens: CommandToken[],
  allTokens: CommandToken[],
  args: Fig.Arg[],
  subcommand: Fig.Subcommand,
  cwd: string,
  shell: Shell,
  persistentOptions: Fig.Option[],
  acceptedTokens: CommandToken[],
  fromOption: boolean,
  fromVariadic: boolean,
  signal?: AbortSignal,
): Promise<SuggestionBlob | undefined> => {
  signal?.throwIfAborted();
  if (args.length === 0) {
    return runSubcommand(tokens, allTokens, subcommand, cwd, shell, persistentOptions, acceptedTokens, true, !fromOption, signal);
  } else if (tokens.length === 0) {
    return await getArgDrivenRecommendation(args, subcommand, persistentOptions, undefined, acceptedTokens, allTokens, fromVariadic, cwd, shell, signal);
  } else if (!tokens.at(0)?.complete) {
    return await getArgDrivenRecommendation(args, subcommand, persistentOptions, tokens[0], acceptedTokens, allTokens, fromVariadic, cwd, shell, signal);
  }

  const activeToken = tokens[0];
  if (args.every((a) => a.isOptional)) {
    if (activeToken.isOption) {
      const option = getOption(activeToken, persistentOptions.concat(subcommand.options ?? []));
      if (option != null) {
        return runOption(tokens, allTokens, option, subcommand, cwd, shell, persistentOptions, acceptedTokens, signal);
      }
      return;
    }

    const nextSubcommand = await genSubcommand(activeToken.token, subcommand, signal);
    if (nextSubcommand != null) {
      return runSubcommand(
        tokens.slice(1),
        allTokens,
        nextSubcommand,
        cwd,
        shell,
        persistentOptions,
        getPersistentTokens(acceptedTokens.concat(activeToken)),
        undefined,
        undefined,
        signal,
      );
    }
  }

  const activeArg = args[0];
  if (activeArg.isVariadic) {
    return runArg(tokens.slice(1), allTokens, args, subcommand, cwd, shell, persistentOptions, acceptedTokens.concat(activeToken), fromOption, true, signal);
  } else if (activeArg.isCommand) {
    if (tokens.length <= 0) {
      return;
    }
    const spec = await loadSpec(tokens, signal);
    if (spec == null) return;
    const subcommand = await getGeneratedSubcommand(spec, tokens, cwd, signal);
    if (subcommand == null) return;
    return runSubcommand(tokens.slice(1), allTokens, subcommand, cwd, shell, undefined, undefined, undefined, undefined, signal);
  }
  return runArg(
    tokens.slice(1),
    allTokens,
    args.slice(1),
    subcommand,
    cwd,
    shell,
    persistentOptions,
    acceptedTokens.concat(activeToken),
    fromOption,
    false,
    signal,
  );
};

const runSubcommand = async (
  tokens: CommandToken[],
  allTokens: CommandToken[],
  subcommand: Fig.Subcommand,
  cwd: string,
  shell: Shell,
  persistentOptions: Fig.Option[] = [],
  acceptedTokens: CommandToken[] = [],
  argsDepleted = false,
  argsUsed = false,
  signal?: AbortSignal,
): Promise<SuggestionBlob | undefined> => {
  signal?.throwIfAborted();
  if (tokens.length === 0) {
    return getSubcommandDrivenRecommendation(subcommand, persistentOptions, undefined, argsDepleted, argsUsed, acceptedTokens, allTokens, cwd, shell, signal);
  } else if (!tokens.at(0)?.complete) {
    return getSubcommandDrivenRecommendation(subcommand, persistentOptions, tokens[0], argsDepleted, argsUsed, acceptedTokens, allTokens, cwd, shell, signal);
  }

  const activeToken = tokens[0];
  const activeArgsLength = subcommand.args instanceof Array ? subcommand.args.length : 1;
  const allOptions = [...persistentOptions, ...(subcommand.options ?? [])];

  if (activeToken.isOption) {
    const option = getOption(activeToken, allOptions);
    if (option != null) {
      return runOption(tokens, allTokens, option, subcommand, cwd, shell, persistentOptions, acceptedTokens, signal);
    }
    return;
  }

  const nextSubcommand = await genSubcommand(activeToken.token, subcommand, signal);
  if (nextSubcommand != null) {
    return runSubcommand(
      tokens.slice(1),
      allTokens,
      nextSubcommand,
      cwd,
      shell,
      getPersistentOptions(persistentOptions, subcommand.options),
      getPersistentTokens(acceptedTokens.concat(activeToken)),
      undefined,
      undefined,
      signal,
    );
  }

  if (activeArgsLength <= 0) {
    return; // not subcommand or option & no args exist
  }

  const args = getArgs(subcommand.args);
  if (args.length != 0) {
    return runArg(tokens, allTokens, args, subcommand, cwd, shell, allOptions, acceptedTokens, false, false, signal);
  }
  // if the subcommand has no args specified, fallback to the subcommand and ignore this item
  return runSubcommand(tokens.slice(1), allTokens, subcommand, cwd, shell, persistentOptions, acceptedTokens.concat(activeToken), undefined, undefined, signal);
};

const runCommand = async (token: CommandToken): Promise<SuggestionBlob | undefined> => {
  const specs = prefixMatches(getSpecNames(), token.token);
  const aliases = prefixMatches(getAliasNames(), token.token);
  return {
    suggestions: [
      ...aliases.map(
        (alias) =>
          ({
            name: alias,
            type: "shortcut",
            allNames: [alias],
            icon: SuggestionIcons.Shortcut,
            priority: 100,
          }) as Suggestion,
      ),
      ...specs.map(
        (spec) =>
          ({
            name: spec,
            type: "subcommand",
            allNames: [spec],
            icon: SuggestionIcons.Subcommand,
            priority: 40,
          }) as Suggestion,
      ),
    ],
    activeToken: token,
  };
};
