// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import fsAsync from "node:fs/promises";
import toml from "toml";
import _Ajv, { JSONSchemaType } from "ajv";
import { Command } from "commander";

const Ajv = _Ajv as unknown as typeof _Ajv.default;
const ajv = new Ajv();

type Binding = {
  shift?: boolean;
  control?: boolean;
  key: string;
};

type Config = {
  bindings: {
    nextSuggestion: Binding;
    previousSuggestion: Binding;
    dismissSuggestions: Binding;
    acceptSuggestion: Binding;
  };
  specs?: {
    path?: string[];
  };
};

const bindingSchema: JSONSchemaType<Binding> = {
  type: "object",
  nullable: true,
  properties: {
    shift: { type: "boolean", nullable: true },
    control: { type: "boolean", nullable: true },
    key: { type: "string" },
  },
  required: ["key"],
};

const specPathsSchema: JSONSchemaType<string[]> = {
  type: "array",
  items: { type: "string" },
  nullable: true,
};

const configSchema = {
  type: "object",
  nullable: true,
  properties: {
    bindings: {
      type: "object",
      nullable: true,
      properties: {
        nextSuggestion: bindingSchema,
        previousSuggestion: bindingSchema,
        dismissSuggestions: bindingSchema,
        acceptSuggestion: bindingSchema,
      },
    },
    specs: {
      type: "object",
      nullable: true,
      properties: {
        path: specPathsSchema,
      },
    },
  },
  additionalProperties: false,
};

const rcFile = ".inshellisenserc";
const xdgFile = "rc.toml";
const cachePath = path.join(os.homedir(), ".inshellisense");
const rcPath = path.join(os.homedir(), rcFile);
const xdgPath = path.join(os.homedir(), ".config", "inshellisense", xdgFile);

const configPaths = [rcPath, xdgPath];

let globalConfig: Config = {
  bindings: {
    nextSuggestion: { key: "down" },
    previousSuggestion: { key: "up" },
    acceptSuggestion: { key: "tab" },
    dismissSuggestions: { key: "escape" },
  },
};

export const getConfig = (): Config => globalConfig;
export const loadConfig = async (program: Command) => {
  configPaths.forEach(async (configPath) => {
    if (fs.existsSync(configPath)) {
      let config: Config;
      try {
        config = toml.parse((await fsAsync.readFile(configPath)).toString());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        program.error(`${configPath} is invalid toml. Parsing error on line ${e.line}, column ${e.column}: ${e.message}`);
      }
      const isValid = ajv.validate(configSchema, config);
      if (!isValid) {
        program.error(`${configPath} is invalid: ${ajv.errorsText()}`);
      }
      globalConfig = {
        bindings: {
          nextSuggestion: config?.bindings?.nextSuggestion ?? globalConfig.bindings.nextSuggestion,
          previousSuggestion: config?.bindings?.previousSuggestion ?? globalConfig.bindings.previousSuggestion,
          acceptSuggestion: config?.bindings?.acceptSuggestion ?? globalConfig.bindings.acceptSuggestion,
          dismissSuggestions: config?.bindings?.dismissSuggestions ?? globalConfig.bindings.dismissSuggestions,
        },
        specs: {
          path: [...(config?.specs?.path ?? []), ...(config?.specs?.path ?? [])],
        },
      };
    }
  });
  globalConfig.specs = { path: [path.join(os.homedir(), ".fig", "autocomplete", "build"), ...(globalConfig.specs?.path ?? [])].map(p => `file:\\${p}`) };
};

export const deleteCacheFolder = (): void => {
  if (fs.existsSync(cachePath)) {
    fs.rmSync(cachePath, { recursive: true });
  }
};
