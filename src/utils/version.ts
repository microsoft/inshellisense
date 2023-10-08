// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import url from "node:url";
import path from "node:path";
import fsAsync from "node:fs/promises";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getVersion = async (): Promise<string> => {
  const packageJsonPath = path.join(__dirname, "..", "..", "package.json");
  const packageJson = await fsAsync.readFile(packageJsonPath, { encoding: "utf-8" });
  const packageJsonParsed = JSON.parse(packageJson);
  return packageJsonParsed.version;
};
