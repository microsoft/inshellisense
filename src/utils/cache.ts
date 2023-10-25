// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from "node:os";
import path from "node:path";
import fsAsync from "node:fs/promises";
import fs from "node:fs";

const cacheFolder = ".inshellisense";
const folderPath = path.join(os.homedir(), cacheFolder);
const cachePath = path.join(os.homedir(), cacheFolder, "inshellisense.cache");

export const saveCommand = async (command: string[]) => {
  if (!fs.existsSync(folderPath)) {
    await fsAsync.mkdir(folderPath);
  }
  await fsAsync.writeFile(cachePath, command.map((c, idx) => `${idx.toString().padStart(5)}  ${c}`).join("\n"));
};

export const loadCommand = async (): Promise<string> => {
  if (!fs.existsSync(folderPath)) {
    await fsAsync.mkdir(folderPath);
  }
  return fsAsync.readFile(cachePath, { encoding: "utf-8" });
};
