// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import chalk from "chalk";

export const render = async () => {
  process.stdout.write(chalk.green("✓") + " successfully installed inshellisense \n");
};
