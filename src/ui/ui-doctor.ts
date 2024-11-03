// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import chalk from "chalk";
import { checkLegacyConfigs, checkShellConfigs } from "../utils/shell.js";

export const render = async () => {
  let errors = 0;
  errors += await renderLegacyConfigIssues();
  errors += renderShellConfigIssues();

  process.exit(errors);
};

const renderLegacyConfigIssues = async (): Promise<number> => {
  const shellsWithLegacyConfigs = await checkLegacyConfigs();
  if (shellsWithLegacyConfigs.length > 0) {
    process.stderr.write(chalk.red("•") + chalk.bold(" detected legacy configurations\n"));
    process.stderr.write("  the following shells have legacy configurations:\n");
    shellsWithLegacyConfigs.forEach((shell) => {
      process.stderr.write(chalk.red("  - ") + shell + "\n");
    });
    process.stderr.write(
      chalk.yellow("  remove any inshellisense configurations from your shell profile and re-add them following the instructions in the README\n"),
    );
    return 1;
  } else {
    process.stdout.write(chalk.green("✓") + " no legacy configurations found\n");
  }
  return 0;
};

const renderShellConfigIssues = (): number => {
  const shellsWithoutConfigs = checkShellConfigs();
  if (shellsWithoutConfigs.length > 0) {
    process.stderr.write(chalk.red("•") + " the following shells do not have configurations:\n");
    shellsWithoutConfigs.forEach((shell) => {
      process.stderr.write(chalk.red("  - ") + shell + "\n");
    });
    process.stderr.write(chalk.yellow("  run " + chalk.underline(chalk.cyan("is init --generate-full-configs")) + " to generate new configurations\n"));
    return 1;
  } else {
    process.stdout.write(chalk.green("✓") + " all shells have configurations\n");
  }
  return 0;
};
