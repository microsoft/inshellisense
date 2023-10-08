// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommandToken } from "./parser.js";
import { runGenerator } from "./generator.js";
import { runTemplates } from "./template.js";
import { Suggestion, SuggestionBlob } from "./model.js";

enum SuggestionIcons {
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

const getIcon = (suggestionType?: Fig.SuggestionType | undefined): string => {
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

const toSuggestion = (suggestion: Fig.Suggestion, name?: string, type?: Fig.SuggestionType): Suggestion | undefined => {
  if (suggestion.name == null) return;
  return {
    name: name ?? getLong(suggestion.name),
    description: suggestion.description,
    icon: getIcon(type ?? suggestion.type),
    allNames: suggestion.name instanceof Array ? suggestion.name : [suggestion.name],
    priority: suggestion.priority ?? 50,
    insertValue: suggestion.insertValue,
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
                  icon: getIcon(s.type ?? suggestionType),
                  allNames: s.name,
                  priority: s.priority ?? 50,
                  insertValue: s.insertValue,
                }
              : undefined;
          }
          return s.name.toLowerCase().includes(partialCmd.toLowerCase())
            ? {
                name: s.name,
                description: s.description,
                icon: getIcon(s.type ?? suggestionType),
                allNames: [s.name],
                priority: s.priority ?? 50,
                insertValue: s.insertValue,
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
                  icon: getIcon(s.type ?? suggestionType),
                  allNames: s.name,
                  insertValue: s.insertValue,
                  priority: s.priority ?? 50,
                }
              : undefined;
          }
          return s.name.toLowerCase().startsWith(partialCmd.toLowerCase())
            ? {
                name: s.name,
                description: s.description,
                icon: getIcon(s.type ?? suggestionType),
                allNames: [s.name],
                insertValue: s.insertValue,
                priority: s.priority ?? 50,
              }
            : undefined;
        })
        .filter((s) => s != null) as Suggestion[];
  }
}

type FilterStrategy = "fuzzy" | "prefix" | "default";

const generatorSuggestions = async (
  generator: Fig.SingleOrArray<Fig.Generator> | undefined,
  acceptedTokens: CommandToken[],
  filterStrategy: FilterStrategy | undefined,
  partialCmd: string | undefined,
): Promise<Suggestion[]> => {
  const generators = generator instanceof Array ? generator : generator ? [generator] : [];
  const tokens = acceptedTokens.map((t) => t.token);
  const suggestions = (await Promise.all(generators.map((gen) => runGenerator(gen, tokens)))).flat();
  return filter<Fig.Suggestion>(suggestions, filterStrategy, partialCmd, undefined);
};

const templateSuggestions = async (
  templates: Fig.Template | undefined,
  filterStrategy: FilterStrategy | undefined,
  partialCmd: string | undefined,
): Promise<Suggestion[]> => {
  return filter<Fig.Suggestion>(await runTemplates(templates ?? []), filterStrategy, partialCmd, undefined);
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

const removeDuplicateSuggestions = (suggestions: Suggestion[], acceptedTokens: CommandToken[]): Suggestion[] => {
  const seen = new Set<string>(acceptedTokens.map((t) => t.token));
  return suggestions.filter((s) => s.allNames.every((n) => !seen.has(n)));
};

const removeEmptySuggestion = (suggestions: Suggestion[]): Suggestion[] => {
  return suggestions.filter((s) => s.name.length > 0);
};

export const getSubcommandDrivenRecommendation = async (
  subcommand: Fig.Subcommand,
  persistentOptions: Fig.Option[],
  partialCmd: string | undefined,
  argsDepleted: boolean,
  argsFromSubcommand: boolean,
  acceptedTokens: CommandToken[],
): Promise<SuggestionBlob | undefined> => {
  if (argsDepleted && argsFromSubcommand) {
    return;
  }
  const suggestions: Suggestion[] = [];
  const argLength = subcommand.args instanceof Array ? subcommand.args.length : subcommand.args ? 1 : 0;
  const allOptions = persistentOptions.concat(subcommand.options ?? []);

  if (!argsFromSubcommand) {
    suggestions.push(...subcommandSuggestions(subcommand.subcommands, subcommand.filterStrategy, partialCmd));
    suggestions.push(...optionSuggestions(allOptions, acceptedTokens, subcommand.filterStrategy, partialCmd));
  }
  if (argLength != 0) {
    const activeArg = subcommand.args instanceof Array ? subcommand.args[0] : subcommand.args;
    suggestions.push(...(await generatorSuggestions(activeArg?.generators, acceptedTokens, activeArg?.filterStrategy, partialCmd)));
    suggestions.push(...suggestionSuggestions(activeArg?.suggestions, activeArg?.filterStrategy, partialCmd));
    suggestions.push(...(await templateSuggestions(activeArg?.template, activeArg?.filterStrategy, partialCmd)));
  }

  return {
    suggestions: removeEmptySuggestion(
      removeDuplicateSuggestions(
        suggestions.sort((a, b) => b.priority - a.priority),
        acceptedTokens,
      ),
    ),
  };
};

export const getArgDrivenRecommendation = async (
  args: Fig.Arg[],
  subcommand: Fig.Subcommand,
  persistentOptions: Fig.Option[],
  partialCmd: string | undefined,
  acceptedTokens: CommandToken[],
  variadicArgBound: boolean,
): Promise<SuggestionBlob | undefined> => {
  const activeArg = args[0];
  const allOptions = persistentOptions.concat(subcommand.options ?? []);
  const suggestions = [
    ...(await generatorSuggestions(args[0].generators, acceptedTokens, activeArg?.filterStrategy, partialCmd)),
    ...suggestionSuggestions(args[0].suggestions, activeArg?.filterStrategy, partialCmd),
    ...(await templateSuggestions(args[0].template, activeArg?.filterStrategy, partialCmd)),
  ];

  if ((activeArg.isOptional && !activeArg.isVariadic) || (activeArg.isVariadic && activeArg.isOptional && !variadicArgBound)) {
    suggestions.push(...subcommandSuggestions(subcommand.subcommands, activeArg?.filterStrategy, partialCmd));
    suggestions.push(...optionSuggestions(allOptions, acceptedTokens, activeArg?.filterStrategy, partialCmd));
  }

  return {
    suggestions: removeEmptySuggestion(
      removeDuplicateSuggestions(
        suggestions.sort((a, b) => b.priority - a.priority),
        acceptedTokens,
      ),
    ),
    argumentDescription: activeArg.description ?? activeArg.name,
  };
};
