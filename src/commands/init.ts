// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Command } from "commander";
import { createShellConfigs, initSupportedShells as shells, getShellSourceCommand, Shell } from "../utils/shell.js";

const supportedShells = shells.join(", ");

type InitCommandOptions = {
  generateFullConfigs: boolean | undefined;
  checkLegacyConfigs: boolean | undefined;
};

const action = (program: Command) => async (shell: string | undefined, options: InitCommandOptions) => {
  if (options.generateFullConfigs) {
    await createShellConfigs();
    return;
  }
  if (shell == null) program.error(`Shell is required, supported shells: ${supportedShells}`, { exitCode: 1 });
  if (!shells.map((s) => s.valueOf()).includes(shell)) {
    program.error(`Unsupported shell: '${shell}', supported shells: ${supportedShells}`, { exitCode: 1 });
  }
  const config = getShellSourceCommand(shell as Shell);
  process.stdout.write(`\n\n${config}\n`);
};

const cmd = new Command("init");
cmd.description(`generates shell configurations and prints the source command for the specified shell`);
cmd.argument("[shell]", `shell to generate for, supported shells: ${supportedShells}`);
cmd.option("--generate-full-configs");
cmd.action(action(cmd));

export default cmd;
