// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Command } from "commander";
import { Shell, shellEnvSupportedShells as shells, getShellConfig } from "../utils/shell.js";

const supportedShells = shells.join(", ");

const action = (program: Command) => async (shell: string) => {
  if (!shells.map((s) => s.valueOf()).includes(shell)) {
    program.error(`Unsupported shell: '${shell}', supported shells: ${supportedShells}`, { exitCode: 1 });
  }
  const config = getShellConfig(shell as Shell);
  process.stdout.write(`\n\n# ---------------- inshellisense shell plugin ----------------\n${config}`);
  process.exit(0);
};

const cmd = new Command("shellenv");
cmd.description(`generates shell configurations for the provided shell`);
cmd.argument("<shell>", `shell to generate configuration for, supported shells: ${supportedShells}`);
cmd.action(action(cmd));

export default cmd;
