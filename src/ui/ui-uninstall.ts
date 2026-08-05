// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import chalk from "chalk";
import { deleteCacheFolder } from "../utils/config.js";

export const render = async () => {
  deleteCacheFolder();
  process.stdout.write(chalk.green("✓") + " successfully deleted the inshellisense resources folder \n");
  process.stdout.write(
    chalk.magenta("•") + " to complete the uninstall, run the command: " + chalk.underline(chalk.cyan("npm uninstall -g @microsoft/inshellisense")) + "\n",
  );
};
