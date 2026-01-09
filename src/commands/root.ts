// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { render, renderConfirmation } from "../ui/ui-root.js";
import { Shell, supportedShells as shells, setupZshDotfiles } from "../utils/shell.js";
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
  login: boolean | undefined;
};

export const action = (program: Command) => async (options: RootCommandOptions) => {
  const inISTerm = process.env.ISTERM === "1";
  if (options.check || inISTerm) {
    process.stdout.write(renderConfirmation(inISTerm));
    process.exit(0);
  }

  if (options.verbose) await log.enable();

  const [, inferredShell] = await Promise.all([
    loadConfig(program),
    options.shell ? Promise.resolve(options.shell) : inferShell(),
  ]);

  log.overrideConsole();

  const shell = (options.shell ?? inferredShell) as Shell | undefined;
  if (shell == null) {
    program.error(`Unable to identify shell, use the -s/--shell option to provide your shell`, { exitCode: 1 });
  }
  if (!shells.map((s) => s.valueOf()).includes(shell)) {
    program.error(`Unsupported shell: '${shell}', supported shells: ${supportedShells}`, { exitCode: 1 });
  }

  await Promise.all([
    loadLocalSpecsSet(),
    loadAliases(shell),
    shell == Shell.Zsh ? setupZshDotfiles() : Promise.resolve(),
  ]);

  await render(program, shell, options.test ?? false, options.login ?? false);
};
