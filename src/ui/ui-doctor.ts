// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import chalk from "chalk";
import { checkLegacyConfigs, checkShellConfigPlugin, checkShellConfigs } from "../utils/shell.js";

export const render = async () => {
  let errors = 0;
  errors += await renderLegacyConfigIssues();
  errors += await renderShellPluginIssues();
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

const renderShellPluginIssues = async (): Promise<number> => {
  const { shellsWithoutPlugin, shellsWithBadPlugin } = await checkShellConfigPlugin();
  if (shellsWithoutPlugin.length == 0) {
    process.stdout.write(chalk.green("✓") + " all shells have plugins\n");
  } else {
    process.stderr.write(chalk.red("•") + " the following shells do not have the plugin installed:\n");
    shellsWithoutPlugin.forEach((shell) => {
      process.stderr.write(chalk.red("  - ") + shell + "\n");
    });
    process.stderr.write(chalk.yellow("  review the README to generate the missing shell plugins, this warning can be ignored if you prefer manual startup\n"));
  }

  if (shellsWithBadPlugin.length == 0) {
    process.stdout.write(chalk.green("✓") + " all shells have correct plugins\n");
  } else {
    process.stderr.write(chalk.red("•") + " the following shells have plugins incorrectly installed:\n");
    shellsWithBadPlugin.forEach((shell) => {
      process.stderr.write(chalk.red("  - ") + shell + "\n");
    });
    process.stderr.write(chalk.yellow("  remove and regenerate the plugins according to the README, only whitespace can be after the shell plugins\n"));
  }

  if (shellsWithoutPlugin.length > 0 || shellsWithBadPlugin.length > 0) {
    return 1;
  }
  return 0;
};
