// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import figSpecList, {
  diffVersionedCompletions as figVersionedSpeclist,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
} from "@withfig/autocomplete/build/index.js";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { CommandToken } from "./parser.js";
import { buildExecuteShellCommand } from "./utils.js";
import { getConfig } from "../utils/config.js";
import log from "../utils/log.js";
import { specResourcesPath } from "../utils/constants.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- recursive type, setting as any
const specSet: any = {};
let specNames: string[] = [];
const ignoredSpecs = ["gcloud", "az", "aws"];
const speclist = figSpecList.filter((spec: string) => !ignoredSpecs.some((name) => spec === name || spec.startsWith(name + "/")));
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
  specNames = Object.keys(specSet)
    .filter((spec) => !spec.startsWith("@") && spec != "-")
    .sort();
}

loadSpecsSet(speclist as string[], versionedSpeclist, specResourcesPath);

const loadedSpecs: { [key: string]: Fig.Spec } = {};

export const loadSpec = async (cmd: CommandToken[], signal?: AbortSignal): Promise<Fig.Spec | undefined> => {
  const rootToken = cmd.at(0);
  if (!rootToken?.complete) {
    return;
  }

  if (loadedSpecs[rootToken.token]) {
    return loadedSpecs[rootToken.token];
  }
  if (specSet[rootToken.token]) {
    signal?.throwIfAborted();
    const specPath = specSet[rootToken.token];
    const importPath = path.isAbsolute(specPath) ? pathToFileURL(specPath).href : specPath;
    const spec = (await import(importPath)).default;
    loadedSpecs[rootToken.token] = spec;
    return spec;
  }
};

// this load spec function should only be used for `loadSpec` on the fly as it is cacheless
const lazyLoadSpec = async (key: string, signal?: AbortSignal): Promise<Fig.Spec | undefined> => {
  signal?.throwIfAborted();
  const specPath = path.join(specResourcesPath, `${key}.js`);
  const importPath = path.isAbsolute(specPath) ? pathToFileURL(specPath).href : specPath;
  return (await import(importPath)).default;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- will be implemented in below TODO
const lazyLoadSpecLocation = async (location: Fig.SpecLocation, signal?: AbortSignal): Promise<Fig.Spec | undefined> => {
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

export const getSpecNames = (): string[] => {
  return specNames;
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

export const getGeneratedSubcommand = async (
  spec: Fig.Spec,
  tokens: CommandToken[],
  cwd: string,
  signal?: AbortSignal,
): Promise<Fig.Subcommand | undefined> => {
  const subcommand = getSubcommand(spec);
  if (!subcommand?.generateSpec) return subcommand;

  signal?.throwIfAborted();
  const executeShellCommand = buildExecuteShellCommand(5000, signal);
  try {
    const generated = getSubcommand(
      await subcommand.generateSpec(
        tokens.map((token) => token.token),
        (command) => executeShellCommand({ ...command, cwd: command.cwd ?? cwd }),
      ),
    );
    signal?.throwIfAborted();
    if (generated == null) return subcommand;
    return {
      ...subcommand,
      ...generated,
      subcommands: [...(subcommand.subcommands ?? []), ...(generated.subcommands ?? [])],
      options: [...(subcommand.options ?? []), ...(generated.options ?? [])],
    };
  } catch (error) {
    signal?.throwIfAborted();
    log.debug({ msg: "failed to generate spec, falling back to static completions", command: tokens[0]?.token, error });
    return subcommand;
  }
};

export const genSubcommand = async (command: string, parentCommand: Fig.Subcommand, signal?: AbortSignal): Promise<Fig.Subcommand | undefined> => {
  if (!parentCommand.subcommands || parentCommand.subcommands.length === 0) return;

  const subcommandIdx = parentCommand.subcommands.findIndex((s) => (Array.isArray(s.name) ? s.name.includes(command) : s.name === command));

  if (subcommandIdx === -1) return;
  const subcommand = parentCommand.subcommands[subcommandIdx];

  // this pulls in the spec from the load spec and overwrites the subcommand in the parent with the loaded spec.
  // then it returns the subcommand and clears the loadSpec field so that it doesn't get called again
  signal?.throwIfAborted();
  const executeShellCommand = buildExecuteShellCommand(5000, signal);
  switch (typeof subcommand.loadSpec) {
    case "function": {
      const partSpec = await subcommand.loadSpec(command, executeShellCommand);
      if (partSpec instanceof Array) {
        const locationSpecs = (await Promise.all(partSpec.map((s) => lazyLoadSpecLocation(s, signal)))).filter((s) => s != null) as Fig.Spec[];
        const subcommands = locationSpecs.map((s) => getSubcommand(s)).filter((s) => s != null) as Fig.Subcommand[];
        (parentCommand.subcommands as Fig.Subcommand[])[subcommandIdx] = {
          ...subcommand,
          ...(subcommands.find((s) => s?.name == command) ?? []),
          loadSpec: undefined,
        };
        return (parentCommand.subcommands as Fig.Subcommand[])[subcommandIdx];
      } else if (Object.prototype.hasOwnProperty.call(partSpec, "type")) {
        const locationSingleSpec = await lazyLoadSpecLocation(partSpec as Fig.SpecLocation, signal);
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
      const spec = await lazyLoadSpec(subcommand.loadSpec as string, signal);
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
