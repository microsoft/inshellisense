// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Command } from "commander";
import { createShellConfigs, initSupportedShells as shells, getShellSourceCommand, Shell } from "../utils/shell.js";
import { unpackResources } from "../utils/node.js";
import { render } from "../ui/ui-init.js";

const supportedShells = shells.join(", ");

const action = (program: Command) => async (shell: string | undefined) => {
  await createShellConfigs();
  try {
    await unpackResources();
  } catch (error) {
    program.error(`Failed to unpack resources: ${error instanceof Error ? error.message : String(error)}`, { exitCode: 1 });
  }

  if (shell == null) {
    await render();
    return;
  }
  if (!shells.map((s) => s.valueOf()).includes(shell)) {
    program.error(`Unsupported shell: '${shell}', supported shells: ${supportedShells}`, { exitCode: 1 });
  }
  const config = getShellSourceCommand(shell as Shell);
  process.stdout.write(`\n\n${config}\n`);
};

const cmd = new Command("init");
cmd.description(`generates shell configurations & prints the source command for a specified shell`);
cmd.argument("[shell]", `shell to generate plugin for, supported shells: ${supportedShells}`);
cmd.action(action(cmd));

export default cmd;
