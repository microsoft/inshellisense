// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import fsAsync from "node:fs/promises";
import toml from "toml";
import _Ajv, { JSONSchemaType } from "ajv";
import { Command } from "commander";
import { allResourcesPath, xdgConfigPath } from "./constants.js";

const Ajv = _Ajv as unknown as typeof _Ajv.default;
const ajv = new Ajv();

type Binding = {
  shift?: boolean;
  control?: boolean;
  key: string;
};

type BoxBorderStyle = "square" | "rounded";

type Config = {
  bindings: {
    nextSuggestion: Binding;
    previousSuggestion: Binding;
    dismissSuggestions: Binding;
    acceptSuggestion: Binding;
  };
  specs: {
    path: string[];
  };
  useAliases: boolean;
  cacheGeneratedSpecs: boolean;
  useNerdFont: boolean;
  maxSuggestions?: number;
  activeSuggestionBackgroundColor: string;
  boxBorderStyle: BoxBorderStyle;
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
    useAliases: {
      type: "boolean",
      nullable: true,
      default: false,
    },
    cacheGeneratedSpecs: {
      type: "boolean",
      nullable: true,
      default: true,
    },
    useNerdFont: {
      type: "boolean",
      nullable: true,
      default: false,
    },
    maxSuggestions: {
      type: "number",
      nullable: true,
      default: 5,
    },
    activeSuggestionBackgroundColor: {
      type: "string",
      nullable: true,
      pattern: "^#[0-9A-Fa-f]{6}$",
      default: "#7D56F4",
    },
    boxBorderStyle: {
      type: "string",
      nullable: true,
      enum: ["square", "rounded"],
      default: "square",
    },
  },
  additionalProperties: false,
};

const rcFile = ".inshellisenserc";
const rcPath = path.join(os.homedir(), rcFile);

const configPaths = [rcPath, xdgConfigPath];

let globalConfig: Config = {
  bindings: {
    nextSuggestion: { key: "down" },
    previousSuggestion: { key: "up" },
    acceptSuggestion: { key: "tab" },
    dismissSuggestions: { key: "escape" },
  },
  specs: {
    path: [],
  },
  useAliases: false,
  cacheGeneratedSpecs: true,
  useNerdFont: false,
  activeSuggestionBackgroundColor: "#7D56F4",
  boxBorderStyle: "square",
};

export const getConfig = (): Config => globalConfig;
export const loadConfig = async (program: Command) => {
  for (const configPath of configPaths) {
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
          path: [...(config?.specs?.path ?? [])],
        },
        useAliases: config.useAliases ?? false,
        cacheGeneratedSpecs: config?.cacheGeneratedSpecs ?? true,
        useNerdFont: config?.useNerdFont ?? false,
        maxSuggestions: config?.maxSuggestions ?? 5,
        activeSuggestionBackgroundColor: config?.activeSuggestionBackgroundColor ?? "#7D56F4",
        boxBorderStyle: config?.boxBorderStyle ?? "square",
      };
    }
  }
  globalConfig.specs = { path: [path.join(os.homedir(), ".fig", "autocomplete", "build"), ...(globalConfig.specs?.path ?? [])] };
};

export const deleteCacheFolder = (): void => {
  if (fs.existsSync(allResourcesPath)) {
    fs.rmSync(allResourcesPath, { recursive: true });
  }
};
