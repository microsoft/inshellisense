// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import chalk from "chalk";

export const renderConfirmation = (live: boolean): string => {
  const statusMessage = live ? chalk.green("live") : chalk.red("not found");
  return `inshellisense session [${statusMessage}]\n`;
};

export const renderStartupFailure = (message: string | undefined): string => {
  const reason = message != null && message.length > 0 ? `: ${message}` : "";
  return (
    chalk.red(`inshellisense failed to start${reason}\n`) +
    chalk.dim(`starting your shell without inshellisense, run "is doctor" or "is reinit" to fix the installation\n`)
  );
};
