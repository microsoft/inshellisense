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

export type PromptPattern = {
  regex: string;
  postfix: string;
};

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
  prompt?: {
    bash?: PromptPattern[];
    pwsh?: PromptPattern[];
    xonsh?: PromptPattern[];
    nu?: PromptPattern[];
    powershell?: PromptPattern[];
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

const promptPatternsSchema: JSONSchemaType<PromptPattern[]> = {
  type: "array",
  nullable: true,
  items: {
    type: "object",
    properties: {
      regex: { type: "string" },
      postfix: { type: "string" },
    },
    required: ["regex", "postfix"],
  },
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
    prompt: {
      type: "object",
      nullable: true,
      properties: {
        bash: promptPatternsSchema,
        pwsh: promptPatternsSchema,
        powershell: promptPatternsSchema,
        xonsh: promptPatternsSchema,
        nu: promptPatternsSchema,
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

const configFile = ".inshellisenserc";
const cachePath = path.join(os.homedir(), ".inshellisense");
const configPath = path.join(os.homedir(), configFile);

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
  if (fs.existsSync(configPath)) {
    let config: Config;
    try {
      config = toml.parse((await fsAsync.readFile(configPath)).toString());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      program.error(`${configFile} is invalid toml. Parsing error on line ${e.line}, column ${e.column}: ${e.message}`);
    }
    const isValid = ajv.validate(configSchema, config);
    if (!isValid) {
      program.error(`${configFile} is invalid: ${ajv.errorsText()}`);
    }
    globalConfig = {
      bindings: {
        nextSuggestion: config?.bindings?.nextSuggestion ?? globalConfig.bindings.nextSuggestion,
        previousSuggestion: config?.bindings?.previousSuggestion ?? globalConfig.bindings.previousSuggestion,
        acceptSuggestion: config?.bindings?.acceptSuggestion ?? globalConfig.bindings.acceptSuggestion,
        dismissSuggestions: config?.bindings?.dismissSuggestions ?? globalConfig.bindings.dismissSuggestions,
      },
      prompt: {
        bash: config.prompt?.bash,
        powershell: config.prompt?.powershell,
        xonsh: config.prompt?.xonsh,
        pwsh: config.prompt?.pwsh,
        nu: config.prompt?.nu,
      },
      specs: {
        path: [`${os.homedir()}/.fig/autocomplete/build`, ...(config?.specs?.path ?? [])],
      },
    };
  }
};

export const deleteCacheFolder = async (): Promise<void> => {
  const cliConfigPath = path.join(os.homedir(), cachePath);
  if (fs.existsSync(cliConfigPath)) {
    fs.rmSync(cliConfigPath, { recursive: true });
  }
};
