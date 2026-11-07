// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { jest } from "@jest/globals";
import fs from "node:fs";
import fsAsync from "node:fs/promises";
import { Command } from "commander";
import { getConfig, loadConfig } from "../../utils/config.js";

let originalConfig: ReturnType<typeof getConfig>;

beforeEach(() => {
  originalConfig = { ...getConfig(), maxSuggestions: getConfig().maxSuggestions };
  jest.spyOn(fs, "existsSync").mockImplementation((file) => String(file).endsWith(".inshellisenserc"));
});

afterEach(() => {
  Object.assign(getConfig(), originalConfig);
  jest.restoreAllMocks();
});

const load = async (source: string) => {
  jest.spyOn(fsAsync, "readFile").mockResolvedValue(Buffer.from(source));
  const program = new Command().exitOverride().configureOutput({ writeErr: () => {} });
  await loadConfig(program);
};

test("keeps the existing popup defaults when sizing options are omitted", async () => {
  await load("");

  expect(getConfig()).toMatchObject({
    maxSuggestions: 5,
    descriptionWidth: 30,
    descriptionHeight: 5,
    truncateDescriptions: true,
  });
});

test("loads popup sizing and disabled truncation from TOML", async () => {
  await load("maxSuggestions = 8\ndescriptionWidth = 45\ndescriptionHeight = 10\ntruncateDescriptions = false");

  expect(getConfig()).toMatchObject({
    maxSuggestions: 8,
    descriptionWidth: 45,
    descriptionHeight: 10,
    truncateDescriptions: false,
  });
});

test.each([
  "maxSuggestions = 0",
  "maxSuggestions = 1.5",
  "descriptionWidth = 2",
  "descriptionWidth = 30.5",
  "descriptionHeight = 0",
  "descriptionHeight = -1",
  "descriptionHeight = 2.5",
  'truncateDescriptions = "false"',
])("rejects invalid popup configuration: %s", async (source) => {
  await expect(load(source)).rejects.toThrow("is invalid");
});

test.each<[string, boolean]>([
  ["", true],
  ["cacheGeneratedSpecs = true", true],
  ["cacheGeneratedSpecs = false", false],
])("loads generated spec caching from %p", async (config, expected) => {
  await load(config);

  expect(getConfig().cacheGeneratedSpecs).toBe(expected);
});

test("rejects a non-boolean generated spec caching setting", async () => {
  await expect(load('cacheGeneratedSpecs = "false"')).rejects.toThrow("cacheGeneratedSpecs");
});
