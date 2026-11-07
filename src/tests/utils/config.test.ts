// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { jest } from "@jest/globals";
import fs from "node:fs";
import fsAsync from "node:fs/promises";
import { Command } from "commander";
import { getConfig, loadConfig } from "../../utils/config.js";

afterEach(() => {
  jest.restoreAllMocks();
});

test.each([
  ["", true],
  ["cacheGeneratedSpecs = true", true],
  ["cacheGeneratedSpecs = false", false],
])("loads generated spec caching from %p", async (config, expected) => {
  jest.spyOn(fs, "existsSync").mockReturnValue(true);
  jest.spyOn(fsAsync, "readFile").mockResolvedValue(Buffer.from(config as string));

  await loadConfig(new Command());

  expect(getConfig().cacheGeneratedSpecs).toBe(expected);
});

test("rejects a non-boolean generated spec caching setting", async () => {
  jest.spyOn(fs, "existsSync").mockReturnValue(true);
  jest.spyOn(fsAsync, "readFile").mockResolvedValue(Buffer.from('cacheGeneratedSpecs = "false"'));
  const program = new Command().exitOverride().configureOutput({ writeErr: () => {} });

  await expect(loadConfig(program)).rejects.toThrow("cacheGeneratedSpecs");
});
