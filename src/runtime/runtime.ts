import speclist, {
  diffVersionedCompletions as versionedSpeclist,
  // @ts-ignore
} from "@withfig/autocomplete/build/index.js";
import { parseCommand, CommandToken } from "./parser.js";
import { getArgDrivenRecommendation, getSubcommandDrivenRecommendation } from "./suggestion.js";
import { SuggestionBlob } from "./model.js";

const specSet: any = {};
(speclist as string[]).forEach((s) => {
  let activeSet = specSet;
  const specRoutes = s.split("/");
  specRoutes.forEach((route, idx) => {
    if (idx === specRoutes.length - 1) {
      const prefix = versionedSpeclist.includes(s) ? "/index.js" : `.js`;
      activeSet[route] = `@withfig/autocomplete/build/${s}${prefix}`;
    } else {
      activeSet[route] = activeSet[route] || {};
      activeSet = activeSet[route];
    }
  });
});

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
    return (await import(specSet[rootToken.token])).default;
  }
};

export const getSuggestions = async (cmd: string): Promise<SuggestionBlob | undefined> => {
  const activeCmd = parseCommand(cmd);
  const rootToken = activeCmd.at(0);
  if (activeCmd.length === 0 || !rootToken?.complete) {
    return;
  }

  const spec = await loadSpec(activeCmd);
  if (spec == null) return;
  const subcommand = getSubcommand(spec);
  if (subcommand == null) return;

  return runSubcommand(activeCmd.slice(1), subcommand);
};

const getPersistentOptions = (persistentOptions: Fig.Option[], options?: Fig.Option[]) => {
  const persistentOptionNames = new Set(persistentOptions.map((o) => (typeof o.name === "string" ? [o.name] : o.name)).flat());
  return persistentOptions.concat(
    (options ?? []).filter(
      (o) => (typeof o.name == "string" ? !persistentOptionNames.has(o.name) : o.name.some((n) => !persistentOptionNames.has(n))) && o.isPersistent === true
    )
  );
};

// TODO: handle subcommands that are versioned
const getSubcommand = (spec: Fig.Spec): Fig.Subcommand | undefined => {
  if (typeof spec === "function") {
    const potentialSubcommand = spec();
    if (potentialSubcommand.hasOwnProperty("name")) {
      return potentialSubcommand as Fig.Subcommand;
    }
    return;
  }
  return spec;
};

// TODO: implement loadspec
const genSubcommand = (command: string, parentCommand: Fig.Subcommand): Fig.Subcommand | undefined => {
  switch (typeof parentCommand.loadSpec) {
    case "function":

    case "string":

    case "object":

    case "undefined":
      return parentCommand.subcommands?.find((s) => s.name === command);
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
  option: Fig.Option,
  subcommand: Fig.Subcommand,
  persistentOptions: Fig.Option[],
  acceptedTokens: CommandToken[]
): Promise<SuggestionBlob | undefined> => {
  if (tokens.length === 0) {
    throw new Error("invalid state reached, option expected but no tokens found");
  }
  const activeToken = tokens[0];
  const isPersistent = persistentOptions.some((o) => (typeof o.name === "string" ? o.name === activeToken.token : o.name.includes(activeToken.token)));
  if ((option.args instanceof Array && option.args.length > 0) || option.args != null) {
    const args = option.args instanceof Array ? option.args : [option.args];
    return runArg(tokens.slice(1), args, subcommand, persistentOptions, acceptedTokens.concat(activeToken), true, false);
  }
  return runSubcommand(tokens.slice(1), subcommand, persistentOptions, acceptedTokens.concat({ ...activeToken, isPersistent }));
};

const runArg = async (
  tokens: CommandToken[],
  args: Fig.Arg[],
  subcommand: Fig.Subcommand,
  persistentOptions: Fig.Option[],
  acceptedTokens: CommandToken[],
  fromOption: boolean,
  fromVariadic: boolean
): Promise<SuggestionBlob | undefined> => {
  if (args.length === 0) {
    return runSubcommand(tokens, subcommand, persistentOptions, acceptedTokens, true, !fromOption);
  } else if (tokens.length === 0) {
    return await getArgDrivenRecommendation(args, subcommand, persistentOptions, undefined, acceptedTokens, fromVariadic);
  } else if (!tokens.at(0)?.complete) {
    return await getArgDrivenRecommendation(args, subcommand, persistentOptions, tokens[0].token, acceptedTokens, fromVariadic);
  }

  const activeToken = tokens[0];
  if (args.every((a) => a.isOptional)) {
    if (activeToken.isOption) {
      const option = getOption(activeToken, persistentOptions.concat(subcommand.options ?? []));
      if (option != null) {
        return runOption(tokens, option, subcommand, persistentOptions, acceptedTokens);
      }
      return;
    }

    const nextSubcommand = genSubcommand(activeToken.token, subcommand);
    if (nextSubcommand != null) {
      return runSubcommand(tokens.slice(1), nextSubcommand, persistentOptions, getPersistentTokens(acceptedTokens.concat(activeToken)));
    }
  }

  const activeArg = args[0];
  if (activeArg.isVariadic) {
    return runArg(tokens.slice(1), args, subcommand, persistentOptions, acceptedTokens.concat(activeToken), fromOption, true);
  } else if (activeArg.isCommand) {
    if (tokens.length <= 0) {
      return;
    }
    const spec = await loadSpec(tokens);
    if (spec == null) return;
    const subcommand = getSubcommand(spec);
    if (subcommand == null) return;
    return runSubcommand(tokens.slice(1), subcommand);
  }
  return runArg(tokens.slice(1), args.slice(1), subcommand, persistentOptions, acceptedTokens.concat(activeToken), fromOption, false);
};

const runSubcommand = async (
  tokens: CommandToken[],
  subcommand: Fig.Subcommand,
  persistentOptions: Fig.Option[] = [],
  acceptedTokens: CommandToken[] = [],
  argsDepleted = false,
  argsUsed = false
): Promise<SuggestionBlob | undefined> => {
  if (tokens.length === 0) {
    return getSubcommandDrivenRecommendation(subcommand, persistentOptions, undefined, argsDepleted, argsUsed, acceptedTokens);
  } else if (!tokens.at(0)?.complete) {
    return getSubcommandDrivenRecommendation(subcommand, persistentOptions, tokens[0].token, argsDepleted, argsUsed, acceptedTokens);
  }

  const activeToken = tokens[0];
  const activeArgsLength = subcommand.args instanceof Array ? subcommand.args.length : 1;
  const allOptions = [...persistentOptions, ...(subcommand.options ?? [])];

  if (activeToken.isOption) {
    const option = getOption(activeToken, allOptions);
    if (option != null) {
      return runOption(tokens, option, subcommand, persistentOptions, acceptedTokens);
    }
    return;
  }

  const nextSubcommand = genSubcommand(activeToken.token, subcommand);
  if (nextSubcommand != null) {
    return runSubcommand(
      tokens.slice(1),
      nextSubcommand,
      getPersistentOptions(persistentOptions, subcommand.options),
      getPersistentTokens(acceptedTokens.concat(activeToken))
    );
  }

  if (activeArgsLength <= 0) {
    return; // not subcommand or option & no args exist
  }

  return runArg(tokens, getArgs(subcommand.args), subcommand, allOptions, acceptedTokens, false, false);
};
