// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import chalk from "chalk";
import { unpackNativeModules, unpackShellFiles } from "../utils/node.js";

export const render = async () => {
  await unpackNativeModules();
  await unpackShellFiles();
  process.stdout.write(chalk.green("✓") + " successfully installed inshellisense \n");
};
