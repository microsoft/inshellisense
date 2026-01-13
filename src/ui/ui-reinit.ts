// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import chalk from "chalk";
import { unpackNativeModules, unpackShellFiles } from "../utils/node.js";
import { createShellConfigs } from "../utils/shell.js";
import { shellResourcesPath, nativeResourcesPath, loggingResourcesPath, initResourcesPath } from "../utils/constants.js";
import fs from "node:fs"

export const render = async () => {
  fs.rmSync(shellResourcesPath, { recursive: true, force: true });
  fs.rmSync(nativeResourcesPath, { recursive: true, force: true });
  fs.rmSync(loggingResourcesPath, { recursive: true, force: true });
  fs.rmSync(initResourcesPath, { recursive: true, force: true });
  process.stdout.write(chalk.green("✓") + " removed old inshellisense resources \n");

  await createShellConfigs();
  await unpackNativeModules();
  await unpackShellFiles();
  process.stdout.write(chalk.green("✓") + " successfully installed inshellisense \n");
};
