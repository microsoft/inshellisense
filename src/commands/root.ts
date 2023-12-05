// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { render } from "../ui/ui-root.js";
import { Shell, supportedShells as shells, setupZshDotfiles } from "../utils/shell.js";
import { inferShell } from "../utils/shell.js";
import { loadConfig } from "../utils/config.js";
import { Command } from "commander";

export const supportedShells = shells.join(", ");

type RootCommandOptions = {
  shell: Shell | undefined;
};

export const action = (program: Command) => async (options: RootCommandOptions) => {
  await loadConfig(program);

  const shell = options.shell ?? ((await inferShell()) as unknown as Shell | undefined);
  if (shell == null) {
    program.error(`Unable to identify shell, use the -s/--shell option to provide your shell`, { exitCode: 1 });
  }
  if (!shells.map((s) => s.valueOf()).includes(shell)) {
    program.error(`Unsupported shell: '${shell}', supported shells: ${supportedShells}`, { exitCode: 1 });
  }
  if (shell == Shell.Zsh) {
    await setupZshDotfiles();
  }
  await render(shell);
};
