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

type PromptPattern = {
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
    powershell?: PromptPattern[];
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
      },
    },
  },
  additionalProperties: false,
};

const configFile = ".inshellisenserc";
const cachePath = path.join(os.homedir(), ".inshellisense");
const configPath = path.join(os.homedir(), configFile);

let globalConfig: Config;
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
        nextSuggestion: config?.bindings?.nextSuggestion ?? {
          key: "down",
        },
        previousSuggestion: config?.bindings?.previousSuggestion ?? {
          key: "up",
        },
        acceptSuggestion: config?.bindings?.acceptSuggestion ?? {
          key: "tab",
        },
        dismissSuggestions: config?.bindings?.dismissSuggestions ?? {
          key: "escape",
        },
      },
      prompt: {
        bash: config.prompt?.bash,
        powershell: config.prompt?.powershell,
        xonsh: config.prompt?.xonsh,
        pwsh: config.prompt?.pwsh,
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
