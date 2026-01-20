// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from "node:path";

import { CommandToken } from "./parser.js";
import { runGenerator } from "./generator.js";
import { runTemplates } from "./template.js";
import { Suggestion, SuggestionBlob } from "./model.js";
import log from "../utils/log.js";
import { escapePath } from "./utils.js";
import { addPathSeparator, endsWithPathSeparator, getPathDirname, removePathSeparator, Shell } from "../utils/shell.js";
import { getConfig } from "../utils/config.js";

export enum SuggestionIcons {
  File = "📄",
  Folder = "📁",
  Subcommand = "📦",
  Option = "🔗",
  Argument = "💲",
  Mixin = "🏝️",
  Shortcut = "🔥",
  Special = "⭐",
  Default = "📀",
}
export const NerdFontIcons = {
  alert: "\udb80\udc27",
  android: "\ue70e",
  apple: "\ue711",
  asterisk: "\uf069",
  aws: "\ue7ad",
  azure: "\ue754",
  box: "\uf1b2",
  carrot: "\uef3b",
  characters: "\udb82\udf34",
  commandkey: "\udb81\ude33",
  commit: "\ue729",
  cpu: "\uf4bc",
  database: "\ue706",
  discord: "\uf1ff",
  docker: "\ue7b0",
  firebase: "\ue787",
  flag: "\udb80\udd4f",
  gcloud: "\udb84\uddf6",
  git: "\ue702",
  github: "\ue709",
  gitlab: "\ue7eb",
  gradle: "\ue7f2",
  heroku: "\ue77b",
  invite: "\udb83\udebb",
  kubernetes: "\ue81d",
  netlify: "\ue83c",
  node: "\ued0d",
  npm: "\ued0e",
  slack: "\ue8a4",
  string: "\udb84\udc21",
  twitter: "\uf099",
  vercel: "\ue8d3",
  yarn: "\ue8ec",
};

const getIcon = (icon: string | undefined, suggestionType: Fig.SuggestionType | undefined): string => {
  // eslint-disable-next-line no-control-regex
  if (icon && /[^\u0000-\u00ff]/.test(icon)) {
    return icon;
  }
  if (icon && icon.startsWith("fig://icon?type=") && getConfig().useNerdFont) {
    const iconType = icon.split("fig://icon?type=")[1].toLowerCase();
    const iconUtf = NerdFontIcons[iconType as keyof typeof NerdFontIcons];
    if (iconUtf != null && iconUtf !== "") {
      return iconUtf;
    }
  }

  switch (suggestionType) {
    case "arg":
      return SuggestionIcons.Argument;
    case "file":
      return SuggestionIcons.File;
    case "folder":
      return SuggestionIcons.Folder;
    case "option":
      return SuggestionIcons.Option;
    case "subcommand":
      return SuggestionIcons.Subcommand;
    case "mixin":
      return SuggestionIcons.Mixin;
    case "shortcut":
      return SuggestionIcons.Shortcut;
    case "special":
      return SuggestionIcons.Special;
  }
  return SuggestionIcons.Default;
};

const getLong = (suggestion: Fig.SingleOrArray<string>): string => {
  return suggestion instanceof Array ? suggestion.reduce((p, c) => (p.length > c.length ? p : c)) : suggestion;
};

const getPathy = (type: Fig.SuggestionType | undefined): boolean => {
  return type === "file" || type === "folder";
};

const toSuggestion = (suggestion: Fig.Suggestion, name?: string, type?: Fig.SuggestionType): Suggestion | undefined => {
  if (suggestion.name == null) return;
  return {
    name: name ?? getLong(suggestion.name),
    description: suggestion.description,
    icon: getIcon(suggestion.icon, type ?? suggestion.type),
    allNames: suggestion.name instanceof Array ? suggestion.name : [suggestion.name],
    priority: suggestion.priority ?? 50,
    insertValue: suggestion.insertValue,
    type: suggestion.type,
    hidden: suggestion.hidden,
  };
};

function filter<T extends Fig.BaseSuggestion & { name?: Fig.SingleOrArray<string>; type?: Fig.SuggestionType | undefined }>(
  suggestions: T[],
  filterStrategy: FilterStrategy | undefined,
  partialCmd: string | undefined,
  suggestionType: Fig.SuggestionType | undefined,
): Suggestion[] {
  if (!partialCmd) return suggestions.map((s) => toSuggestion(s, undefined, suggestionType)).filter((s) => s != null) as Suggestion[];

  switch (filterStrategy) {
    case "fuzzy":
      return suggestions
        .map((s) => {
          if (s.name == null) return;
          if (s.name instanceof Array) {
            const matchedName = s.name.find((n) => n.toLowerCase().includes(partialCmd.toLowerCase()));
            return matchedName != null
              ? {
                  name: matchedName,
                  description: s.description,
                  icon: getIcon(s.icon, s.type ?? suggestionType),
                  allNames: s.name,
                  priority: s.priority ?? 50,
                  insertValue: s.insertValue,
                  type: s.type,
                  hidden: s.hidden,
                }
              : undefined;
          }
          return s.name.toLowerCase().includes(partialCmd.toLowerCase())
            ? {
                name: s.name,
                description: s.description,
                icon: getIcon(s.icon, s.type ?? suggestionType),
                allNames: [s.name],
                priority: s.priority ?? 50,
                insertValue: s.insertValue,
                type: s.type,
                hidden: s.hidden,
              }
            : undefined;
        })
        .filter((s) => s != null) as Suggestion[];
    default:
      return suggestions
        .map((s) => {
          if (s.name == null) return;
          if (s.name instanceof Array) {
            const matchedName = s.name.find((n) => n.toLowerCase().startsWith(partialCmd.toLowerCase()));
            return matchedName != null
              ? {
                  name: matchedName,
                  description: s.description,
                  icon: getIcon(s.icon, s.type ?? suggestionType),
                  allNames: s.name,
                  insertValue: s.insertValue,
                  priority: s.priority ?? 50,
                  type: s.type,
                  hidden: s.hidden,
                }
              : undefined;
          }
          return s.name.toLowerCase().startsWith(partialCmd.toLowerCase())
            ? {
                name: s.name,
                description: s.description,
                icon: getIcon(s.icon, s.type ?? suggestionType),
                allNames: [s.name],
                insertValue: s.insertValue,
                priority: s.priority ?? 50,
                type: s.type,
                hidden: s.hidden,
              }
            : undefined;
        })
        .filter((s) => s != null) as Suggestion[];
  }
}

type FilterStrategy = "fuzzy" | "prefix" | "default";

const generatorSuggestions = async (
  generator: Fig.SingleOrArray<Fig.Generator> | undefined,
  allTokens: CommandToken[],
  filterStrategy: FilterStrategy | undefined,
  partialCmd: string | undefined,
  cwd: string,
): Promise<Suggestion[]> => {
  const generators = generator instanceof Array ? generator : generator ? [generator] : [];
  const tokens = allTokens.map((t) => t.token);
  if (partialCmd) tokens.push(partialCmd);
  const suggestions = (await Promise.all(generators.map((gen) => runGenerator(gen, tokens, cwd)))).flat();
  return filter<Fig.Suggestion>(
    suggestions.map((suggestion) => ({ ...suggestion, priority: suggestion.priority ?? 60 })),
    filterStrategy,
    partialCmd,
    undefined,
  );
};

const templateSuggestions = async (
  templates: Fig.Template | undefined,
  filterStrategy: FilterStrategy | undefined,
  partialCmd: string | undefined,
  cwd: string,
): Promise<Suggestion[]> => {
  return filter<Fig.Suggestion>(await runTemplates(templates ?? [], cwd), filterStrategy, partialCmd, undefined);
};

const suggestionSuggestions = (
  suggestions: (string | Fig.Suggestion)[] | undefined,
  filterStrategy: FilterStrategy | undefined,
  partialCmd: string | undefined,
): Suggestion[] => {
  const cleanedSuggestions = suggestions?.map((s) => (typeof s === "string" ? { name: s } : s)) ?? [];
  return filter<Fig.Suggestion>(cleanedSuggestions ?? [], filterStrategy, partialCmd, undefined);
};

const subcommandSuggestions = (
  subcommands: Fig.Subcommand[] | undefined,
  filterStrategy: FilterStrategy | undefined,
  partialCmd: string | undefined,
): Suggestion[] => {
  return filter<Fig.Subcommand>(subcommands ?? [], filterStrategy, partialCmd, "subcommand");
};

const optionSuggestions = (
  options: Fig.Option[] | undefined,
  acceptedTokens: CommandToken[],
  filterStrategy: FilterStrategy | undefined,
  partialCmd: string | undefined,
): Suggestion[] => {
  const usedOptions = new Set(acceptedTokens.filter((t) => t.isOption).map((t) => t.token));
  const validOptions = options?.filter((o) => o.exclusiveOn?.every((exclusiveOption) => !usedOptions.has(exclusiveOption)) ?? true);
  return filter<Fig.Option>(validOptions ?? [], filterStrategy, partialCmd, "option");
};

function adjustPathSuggestions(
  suggestions: Suggestion[],
  partialToken: CommandToken | undefined,
  lastToken: CommandToken | undefined,
  shell: Shell,
): Suggestion[] {
  const isInPath = lastToken?.isPath && !lastToken.complete;
  return suggestions.map((s) => {
    const pathy = isInPath || getPathy(s.type);
    const rawInsertValue = removePathSeparator(s.insertValue ?? s.name ?? "");
    const insertValue = isInPath || s.type == "folder" ? addPathSeparator(rawInsertValue, shell) : rawInsertValue;
    const partialDir = getPathDirname(partialToken?.token ?? "", shell);
    const isPartialTokenPath = partialToken?.isPath && endsWithPathSeparator(partialDir, shell);
    const fullPath = isPartialTokenPath ? `${partialDir}${insertValue}` : insertValue;
    return pathy ? { ...s, insertValue: escapePath(fullPath, shell), name: removePathSeparator(s.name) } : s;
  });
}

const removeAcceptedSuggestions = (suggestions: Suggestion[], acceptedTokens: CommandToken[]): Suggestion[] => {
  const seen = new Set<string>(acceptedTokens.map((t) => t.token));
  return suggestions.filter((s) => s.allNames.every((n) => !seen.has(n)));
};

const removeDuplicateSuggestion = (suggestions: Suggestion[]): Suggestion[] => {
  const seen = new Set<string>();
  return suggestions
    .map((s) => {
      if (seen.has(s.name)) return null;
      seen.add(s.name);
      return s;
    })
    .filter((s): s is Suggestion => s != null);
};

const removeHiddenSuggestions = (suggestions: Suggestion[], partialToken: CommandToken | undefined): Suggestion[] => {
  return suggestions.filter((s) => s.hidden !== true || (partialToken != null && s.name === partialToken.token));
};

const removeHomeDirectorySuggestion = (suggestions: Suggestion[], allTokens: CommandToken[]): Suggestion[] => {
  const containsHomeDir = allTokens.some((t) => t.token.startsWith("~"));
  return suggestions.filter((s) => s.type !== "folder" || !containsHomeDir || !s.name.startsWith("~"));
};

const removeEmptySuggestion = (suggestions: Suggestion[]): Suggestion[] => {
  return suggestions.filter((s) => s.name.length > 0);
};

export const getSubcommandDrivenRecommendation = async (
  subcommand: Fig.Subcommand,
  persistentOptions: Fig.Option[],
  partialToken: CommandToken | undefined,
  argsDepleted: boolean,
  argsFromSubcommand: boolean,
  acceptedTokens: CommandToken[],
  allTokens: CommandToken[],
  cwd: string,
  shell: Shell,
): Promise<SuggestionBlob | undefined> => {
  log.debug({ msg: "suggestion point", subcommand, persistentOptions, partialToken, argsDepleted, argsFromSubcommand, acceptedTokens, cwd });
  if (argsDepleted && argsFromSubcommand) {
    return;
  }
  let partialCmd = partialToken?.token;
  if (partialToken?.isPath) {
    partialCmd = partialToken.isPathComplete ? "" : path.basename(partialCmd ?? "");
  }

  const lastToken = allTokens.at(-1);
  const suggestions: Suggestion[] = [];
  const argLength = subcommand.args instanceof Array ? subcommand.args.length : subcommand.args ? 1 : 0;
  const allOptions = persistentOptions.concat(subcommand.options ?? []);

  if (!argsFromSubcommand) {
    suggestions.push(...subcommandSuggestions(subcommand.subcommands, subcommand.filterStrategy, partialCmd));
    suggestions.push(...optionSuggestions(allOptions, acceptedTokens, subcommand.filterStrategy, partialCmd));
  }
  if (argLength != 0) {
    const activeArg = subcommand.args instanceof Array ? subcommand.args[0] : subcommand.args;
    suggestions.push(...(await generatorSuggestions(activeArg?.generators, allTokens, activeArg?.filterStrategy, partialCmd, cwd)));
    suggestions.push(...suggestionSuggestions(activeArg?.suggestions, activeArg?.filterStrategy, partialCmd));
    suggestions.push(...(await templateSuggestions(activeArg?.template, activeArg?.filterStrategy, partialCmd, cwd)));
  }

  return {
    suggestions: removeDuplicateSuggestion(
      removeEmptySuggestion(
        removeHiddenSuggestions(
          removeHomeDirectorySuggestion(
            removeAcceptedSuggestions(
              adjustPathSuggestions(
                suggestions.sort((a, b) => b.priority - a.priority),
                partialToken,
                lastToken,
                shell,
              ),
              acceptedTokens,
            ),
            allTokens,
          ),
          partialToken,
        ),
      ),
    ),
  };
};

export const getArgDrivenRecommendation = async (
  args: Fig.Arg[],
  subcommand: Fig.Subcommand,
  persistentOptions: Fig.Option[],
  partialToken: CommandToken | undefined,
  acceptedTokens: CommandToken[],
  allTokens: CommandToken[],
  variadicArgBound: boolean,
  cwd: string,
  shell: Shell,
): Promise<SuggestionBlob | undefined> => {
  let partialCmd = partialToken?.token;
  if (partialToken?.isPath) {
    partialCmd = partialToken.isPathComplete ? "" : path.basename(partialCmd ?? "");
  }

  const lastToken = allTokens.at(-1);
  const activeArg = args[0];
  const allOptions = persistentOptions.concat(subcommand.options ?? []);
  const suggestions = [
    ...(await generatorSuggestions(args[0].generators, allTokens, activeArg?.filterStrategy, partialCmd, cwd)),
    ...suggestionSuggestions(args[0].suggestions, activeArg?.filterStrategy, partialCmd),
    ...(await templateSuggestions(args[0].template, activeArg?.filterStrategy, partialCmd, cwd)),
  ];

  if (activeArg.isOptional || (activeArg.isVariadic && variadicArgBound)) {
    suggestions.push(...subcommandSuggestions(subcommand.subcommands, activeArg?.filterStrategy, partialCmd));
    suggestions.push(...optionSuggestions(allOptions, acceptedTokens, activeArg?.filterStrategy, partialCmd));
  }

  return {
    suggestions: removeDuplicateSuggestion(
      removeEmptySuggestion(
        removeHiddenSuggestions(
          removeHomeDirectorySuggestion(
            removeAcceptedSuggestions(
              adjustPathSuggestions(
                suggestions.sort((a, b) => b.priority - a.priority),
                partialToken,
                lastToken,
                shell,
              ),
              acceptedTokens,
            ),
            allTokens,
          ),
          partialToken,
        ),
      ),
    ),
    argumentDescription: activeArg.description ?? activeArg.name,
  };
};
