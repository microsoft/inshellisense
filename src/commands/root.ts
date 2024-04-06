// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { render, renderConfirmation } from "../ui/ui-root.js";
import { Shell, supportedShells as shells, setupZshDotfiles, setupBashPreExec } from "../utils/shell.js";
import { inferShell } from "../utils/shell.js";
import { loadConfig } from "../utils/config.js";
import { Command } from "commander";
import log from "../utils/log.js";
import { loadAliases } from "../runtime/alias.js";
import { loadLocalSpecsSet } from "../runtime/runtime.js";

export const supportedShells = shells.join(", ");

type RootCommandOptions = {
  shell: Shell | undefined;
  verbose: boolean | undefined;
  check: boolean | undefined;
  test: boolean | undefined;
  parentTermExit: boolean | undefined;
};

export const action = (program: Command) => async (options: RootCommandOptions) => {
  const inISTerm = process.env.ISTERM === "1";
  if (options.check || inISTerm) {
    process.stdout.write(renderConfirmation(inISTerm));
    return;
  }

  if (options.verbose) await log.enable();

  await loadConfig(program);

  await loadLocalSpecsSet();

  const shell = options.shell ?? ((await inferShell()) as unknown as Shell | undefined);
  if (shell == null) {
    program.error(`Unable to identify shell, use the -s/--shell option to provide your shell`, { exitCode: 1 });
  }
  if (!shells.map((s) => s.valueOf()).includes(shell)) {
    program.error(`Unsupported shell: '${shell}', supported shells: ${supportedShells}`, { exitCode: 1 });
  }
  if (shell == Shell.Zsh) {
    await setupZshDotfiles();
  } else if (shell == Shell.Bash) {
    await setupBashPreExec();
  }
  await loadAliases(shell);
  await render(shell, options.test ?? false, options.parentTermExit ?? false);
};
