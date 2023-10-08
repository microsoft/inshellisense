import os from "node:os";
import path from "node:path";
import fsAsync from "node:fs/promises";
import fs from "node:fs";

const folderPath = path.join(os.homedir(), ".clac");
const cachePath = path.join(os.homedir(), ".clac", "clac.cache");

export const saveCommand = async (command: string) => {
  if (!fs.existsSync(folderPath)) {
    await fsAsync.mkdir(folderPath);
  }
  await fsAsync.writeFile(cachePath, command);
};

export const loadCommand = async (): Promise<string> => {
  if (!fs.existsSync(folderPath)) {
    await fsAsync.mkdir(folderPath);
  }
  return fsAsync.readFile(cachePath, { encoding: "utf-8" });
};
