// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import figSpecList, {
  diffVersionedCompletions as figVersionedSpeclist,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
} from "@withfig/autocomplete/build/index.js";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseCommand, CommandToken } from "./parser.js";
import { getArgDrivenRecommendation, getSubcommandDrivenRecommendation, SuggestionIcons } from "./suggestion.js";
import { Suggestion, SuggestionBlob } from "./model.js";
import { buildExecuteShellCommand, resolveCwd } from "./utils.js";
import { Shell } from "../utils/shell.js";
import { aliasExpand, getAliasNames } from "./alias.js";
import { getConfig } from "../utils/config.js";
import log from "../utils/log.js";
import { specResourcesPath } from "../utils/constants.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- recursive type, setting as any
const specSet: any = {};
const ignoredSpecs = ["gcloud", "az", "aws"];
const speclist = figSpecList.filter((spec: string) => !ignoredSpecs.some((name) => spec.startsWith(name + "/")));
const versionedSpeclist = figVersionedSpeclist.filter((spec: string) => !ignoredSpecs.some((name) => spec.startsWith(name)));

function loadSpecsSet(speclist: string[], versionedSpeclist: string[], specsPath: string) {
  speclist.forEach((s) => {
    let activeSet = specSet;
    const specRoutes = s.split("/");
    specRoutes.forEach((route, idx) => {
      if (typeof activeSet !== "object") {
        return;
      }
      if (idx === specRoutes.length - 1) {
        const prefix = versionedSpeclist.includes(s) ? "/index.js" : `.js`;
        activeSet[route] = `${specsPath}${path.sep}${s}${prefix}`;
      } else {
        activeSet[route] = activeSet[route] || {};
        activeSet = activeSet[route];
      }
    });
  });
}

loadSpecsSet(speclist as string[], versionedSpeclist, specResourcesPath);

const loadedSpecs: { [key: string]: Fig.Spec } = {};

const loadSpec = async (cmd: CommandToken[]): Promise<Fig.Spec | undefined> => {
  const rootToken = cmd.at(0);
  if (!rootToken?.complete) {
    return;
  }

  if (loadedSpecs[rootToken.token]) {
    return loadedSpecs[rootToken.token];
  }
  if (specSet[rootToken.token]) {
    const specPath = specSet[rootToken.token];
    const importPath = path.isAbsolute(specPath) ? pathToFileURL(specPath).href : specPath;
    const spec = (await import(importPath)).default;
    loadedSpecs[rootToken.token] = spec;
    return spec;
  }
};

// this load spec function should only be used for `loadSpec` on the fly as it is cacheless
const lazyLoadSpec = async (key: string): Promise<Fig.Spec | undefined> => {
  const specPath = path.join(specResourcesPath, `${key}.js`);
  const importPath = path.isAbsolute(specPath) ? pathToFileURL(specPath).href : specPath;
  return (await import(importPath)).default;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- will be implemented in below TODO
const lazyLoadSpecLocation = async (location: Fig.SpecLocation): Promise<Fig.Spec | undefined> => {
  return; //TODO: implement spec location loading
};

export const loadLocalSpecsSet = async () => {
  const specsPath = getConfig().specs.path;
  await Promise.allSettled(
    specsPath.map((specPath) => {
      const indexPath = path.join(specPath, "index.js");
      const importPath = path.isAbsolute(indexPath) ? pathToFileURL(indexPath).href : indexPath;
      return import(importPath)
        .then((res) => {
          const { default: speclist, diffVersionedCompletions: versionedSpeclist } = res;
          loadSpecsSet(speclist, versionedSpeclist, specPath);
        })
        .catch((e) => {
          log.debug({ msg: `no local specs imported from '${specPath}', this will not break the current session`, e: (e as Error).message, specPath });
        });
    }),
  );
};

export const getSuggestions = async (cmd: string, cwd: string, shell: Shell): Promise<SuggestionBlob | undefined> => {
  let activeCmd = parseCommand(cmd, shell);
  if (activeCmd.length === 0) {
    return;
  }

  const rootToken = activeCmd.at(0);
  
  if (rootToken != null && !rootToken.complete) {
    return runCommand(rootToken);
  }

  activeCmd = aliasExpand(activeCmd);

  const spec = await loadSpec(activeCmd);
  if (spec == null) return;
  const subcommand = getSubcommand(spec);
  if (subcommand == null) return;

  const lastCommand = activeCmd.at(-1);
  const { cwd: resolvedCwd, pathy, complete: pathyComplete } = await resolveCwd(lastCommand, cwd, shell);
  if (pathy && lastCommand) {
    lastCommand.isPath = true;
    lastCommand.isPathComplete = pathyComplete;
  }
  const result = await runSubcommand(activeCmd.slice(1), activeCmd, subcommand, resolvedCwd, shell);
  if (result == null) return;
  if (result.suggestions.length == 0 && !result.argumentDescription) return;

  const charactersToDrop = lastCommand?.complete ? 0 : lastCommand?.tokenLength;
  return { ...result, charactersToDrop };
};

export const getSpecNames = (): string[] => {
  return Object.keys(specSet).filter((spec) => !spec.startsWith("@") && spec != "-");
};

const getPersistentOptions = (persistentOptions: Fig.Option[], options?: Fig.Option[]) => {
  const persistentOptionNames = new Set(persistentOptions.map((o) => (typeof o.name === "string" ? [o.name] : o.name)).flat());
  return persistentOptions.concat(
    (options ?? []).filter(
      (o) => (typeof o.name == "string" ? !persistentOptionNames.has(o.name) : o.name.some((n) => !persistentOptionNames.has(n))) && o.isPersistent === true,
    ),
  );
};

// TODO: handle subcommands that are versioned
const getSubcommand = (spec?: Fig.Spec): Fig.Subcommand | undefined => {
  if (spec == null) return;
  if (typeof spec === "function") {
    const potentialSubcommand = spec();
    if (Object.prototype.hasOwnProperty.call(potentialSubcommand, "name")) {
      return potentialSubcommand as Fig.Subcommand;
    }
    return;
  }
  return spec;
};

const executeShellCommand = buildExecuteShellCommand(5000);

const genSubcommand = async (command: string, parentCommand: Fig.Subcommand): Promise<Fig.Subcommand | undefined> => {
  if (!parentCommand.subcommands || parentCommand.subcommands.length === 0) return;

  const subcommandIdx = parentCommand.subcommands.findIndex((s) => (Array.isArray(s.name) ? s.name.includes(command) : s.name === command));

  if (subcommandIdx === -1) return;
  const subcommand = parentCommand.subcommands[subcommandIdx];

  // this pulls in the spec from the load spec and overwrites the subcommand in the parent with the loaded spec.
  // then it returns the subcommand and clears the loadSpec field so that it doesn't get called again
  switch (typeof subcommand.loadSpec) {
    case "function": {
      const partSpec = await subcommand.loadSpec(command, executeShellCommand);
      if (partSpec instanceof Array) {
        const locationSpecs = (await Promise.all(partSpec.map((s) => lazyLoadSpecLocation(s)))).filter((s) => s != null) as Fig.Spec[];
        const subcommands = locationSpecs.map((s) => getSubcommand(s)).filter((s) => s != null) as Fig.Subcommand[];
        (parentCommand.subcommands as Fig.Subcommand[])[subcommandIdx] = {
          ...subcommand,
          ...(subcommands.find((s) => s?.name == command) ?? []),
          loadSpec: undefined,
        };
        return (parentCommand.subcommands as Fig.Subcommand[])[subcommandIdx];
      } else if (Object.prototype.hasOwnProperty.call(partSpec, "type")) {
        const locationSingleSpec = await lazyLoadSpecLocation(partSpec as Fig.SpecLocation);
        (parentCommand.subcommands as Fig.Subcommand[])[subcommandIdx] = {
          ...subcommand,
          ...(getSubcommand(locationSingleSpec) ?? []),
          loadSpec: undefined,
        };
        return (parentCommand.subcommands as Fig.Subcommand[])[subcommandIdx];
      } else {
        (parentCommand.subcommands as Fig.Subcommand[])[subcommandIdx] = {
          ...subcommand,
          ...partSpec,
          loadSpec: undefined,
        };
        return (parentCommand.subcommands as Fig.Subcommand[])[subcommandIdx];
      }
    }
    case "string": {
      const spec = await lazyLoadSpec(subcommand.loadSpec as string);
      (parentCommand.subcommands as Fig.Subcommand[])[subcommandIdx] = {
        ...subcommand,
        ...(getSubcommand(spec) ?? []),
        loadSpec: undefined,
      };
      return (parentCommand.subcommands as Fig.Subcommand[])[subcommandIdx];
    }
    case "object": {
      (parentCommand.subcommands as Fig.Subcommand[])[subcommandIdx] = {
        ...subcommand,
        ...(subcommand.loadSpec ?? {}),
        loadSpec: undefined,
      };
      return (parentCommand.subcommands as Fig.Subcommand[])[subcommandIdx];
    }
    case "undefined": {
      return subcommand;
    }
  }
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
): Promise<SuggestionBlob | undefined> => {
  if (tokens.length === 0) {
    throw new Error("invalid state reached, option expected but no tokens found");
  }
  const activeToken = tokens[0];
  const isPersistent = persistentOptions.some((o) => (typeof o.name === "string" ? o.name === activeToken.token : o.name.includes(activeToken.token)));
  if ((option.args instanceof Array && option.args.length > 0) || option.args != null) {
    const args = option.args instanceof Array ? option.args : [option.args];
    return runArg(tokens.slice(1), allTokens, args, subcommand, cwd, shell, persistentOptions, acceptedTokens.concat(activeToken), true, false);
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
): Promise<SuggestionBlob | undefined> => {
  if (args.length === 0) {
    return runSubcommand(tokens, allTokens, subcommand, cwd, shell, persistentOptions, acceptedTokens, true, !fromOption);
  } else if (tokens.length === 0) {
    return await getArgDrivenRecommendation(args, subcommand, persistentOptions, undefined, acceptedTokens, allTokens, fromVariadic, cwd, shell);
  } else if (!tokens.at(0)?.complete) {
    return await getArgDrivenRecommendation(args, subcommand, persistentOptions, tokens[0], acceptedTokens, allTokens, fromVariadic, cwd, shell);
  }

  const activeToken = tokens[0];
  if (args.every((a) => a.isOptional)) {
    if (activeToken.isOption) {
      const option = getOption(activeToken, persistentOptions.concat(subcommand.options ?? []));
      if (option != null) {
        return runOption(tokens, allTokens, option, subcommand, cwd, shell, persistentOptions, acceptedTokens);
      }
      return;
    }

    const nextSubcommand = await genSubcommand(activeToken.token, subcommand);
    if (nextSubcommand != null) {
      return runSubcommand(tokens.slice(1), allTokens, nextSubcommand, cwd, shell, persistentOptions, getPersistentTokens(acceptedTokens.concat(activeToken)));
    }
  }

  const activeArg = args[0];
  if (activeArg.isVariadic) {
    return runArg(tokens.slice(1), allTokens, args, subcommand, cwd, shell, persistentOptions, acceptedTokens.concat(activeToken), fromOption, true);
  } else if (activeArg.isCommand) {
    if (tokens.length <= 0) {
      return;
    }
    const spec = await loadSpec(tokens);
    if (spec == null) return;
    const subcommand = getSubcommand(spec);
    if (subcommand == null) return;
    return runSubcommand(tokens.slice(1), allTokens, subcommand, cwd, shell);
  }
  return runArg(tokens.slice(1), allTokens, args.slice(1), subcommand, cwd, shell, persistentOptions, acceptedTokens.concat(activeToken), fromOption, false);
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
): Promise<SuggestionBlob | undefined> => {
  if (tokens.length === 0) {
    return getSubcommandDrivenRecommendation(subcommand, persistentOptions, undefined, argsDepleted, argsUsed, acceptedTokens, allTokens, cwd, shell);
  } else if (!tokens.at(0)?.complete) {
    return getSubcommandDrivenRecommendation(subcommand, persistentOptions, tokens[0], argsDepleted, argsUsed, acceptedTokens, allTokens, cwd, shell);
  }

  const activeToken = tokens[0];
  const activeArgsLength = subcommand.args instanceof Array ? subcommand.args.length : 1;
  const allOptions = [...persistentOptions, ...(subcommand.options ?? [])];

  if (activeToken.isOption) {
    const option = getOption(activeToken, allOptions);
    if (option != null) {
      return runOption(tokens, allTokens, option, subcommand, cwd, shell, persistentOptions, acceptedTokens);
    }
    return;
  }

  const nextSubcommand = await genSubcommand(activeToken.token, subcommand);
  if (nextSubcommand != null) {
    return runSubcommand(
      tokens.slice(1),
      allTokens,
      nextSubcommand,
      cwd,
      shell,
      getPersistentOptions(persistentOptions, subcommand.options),
      getPersistentTokens(acceptedTokens.concat(activeToken)),
    );
  }

  if (activeArgsLength <= 0) {
    return; // not subcommand or option & no args exist
  }

  const args = getArgs(subcommand.args);
  if (args.length != 0) {
    return runArg(tokens, allTokens, args, subcommand, cwd, shell, allOptions, acceptedTokens, false, false);
  }
  // if the subcommand has no args specified, fallback to the subcommand and ignore this item
  return runSubcommand(tokens.slice(1), allTokens, subcommand, cwd, shell, persistentOptions, acceptedTokens.concat(activeToken));
};

const runCommand = async (token: CommandToken): Promise<SuggestionBlob | undefined> => {
  const specs = Object.keys(specSet)
    .filter((spec) => spec.startsWith(token.token))
    .sort();
  const aliases = getAliasNames()
    .filter((spec) => spec.startsWith(token.token))
    .sort();
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
    charactersToDrop: token.tokenLength,
  };
};
