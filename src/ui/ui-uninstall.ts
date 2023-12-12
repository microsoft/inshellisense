// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import chalk from "chalk";
import { deleteConfigFolder } from "../utils/config.js";

export const render = async () => {
  deleteConfigFolder();
  process.stdout.write(chalk.green("✓") + " successfully deleted the .inshellisense config folder \n");
  process.stdout.write(
    chalk.magenta("•") + " to complete the uninstall, run the the command: " + chalk.underline(chalk.cyan("npm uninstall -g @microsoft/inshellisense")) + "\n",
  );
};
