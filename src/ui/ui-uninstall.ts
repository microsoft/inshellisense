// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import chalk from "chalk";
import { unbindAll, deleteConfigFolder } from "../utils/bindings.js";

export const render = async () => {
  await unbindAll();
  process.stdout.write(chalk.green("✓") + " successfully uninstalled all existing bindings \n");
  deleteConfigFolder();
  process.stdout.write(chalk.green("✓") + " successfully deleted the .inshellisense config folder \n");
  process.stdout.write(
    chalk.magenta("•") + " to complete the uninstall, run the the command: " + chalk.underline(chalk.cyan("npm uninstall -g @microsoft/inshellisense")) + "\n",
  );
};
