// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import fsAsync from "node:fs/promises";
import _Ajv, { JSONSchemaType } from "ajv";
import { Command } from "commander";

const Ajv = _Ajv as unknown as typeof _Ajv.default;
const ajv = new Ajv();

type PromptPattern = {
  regex: string;
  postfix: string;
};
type Config = {
  promptRegex?: {
    bash?: PromptPattern;
    pwsh?: PromptPattern;
    powershell?: PromptPattern;
  };
};

const configSchema: JSONSchemaType<Config> = {
  type: "object",
  properties: {
    promptRegex: {
      type: "object",
      properties: {
        bash: {
          type: "object",
          nullable: true,
          properties: {
            regex: { type: "string" },
            postfix: { type: "string" },
          },
          required: ["regex", "postfix"],
        },
        pwsh: {
          type: "object",
          nullable: true,
          properties: {
            regex: { type: "string" },
            postfix: { type: "string" },
          },
          required: ["regex", "postfix"],
        },
        powershell: {
          type: "object",
          nullable: true,
          properties: {
            regex: { type: "string" },
            postfix: { type: "string" },
          },
          required: ["regex", "postfix"],
        },
      },
      nullable: true,
    },
  },
  additionalProperties: false,
};

const configFolder = ".inshellisense";
const cachePath = path.join(os.homedir(), configFolder, "config.json");

let globalConfig: Config = {};
export const getConfig = (): Config => globalConfig;
export const loadConfig = async (program: Command) => {
  if (fs.existsSync(cachePath)) {
    const config = JSON.parse((await fsAsync.readFile(cachePath)).toString());
    const isValid = ajv.validate(configSchema, config);
    if (!isValid) {
      program.error("inshellisense config is invalid: " + ajv.errorsText());
    }
    globalConfig = config;
  }
};

export const deleteConfigFolder = async (): Promise<void> => {
  const cliConfigPath = path.join(os.homedir(), configFolder);
  if (fs.existsSync(cliConfigPath)) {
    fs.rmSync(cliConfigPath, { recursive: true });
  }
};
