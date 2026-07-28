// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Shell, supportedShells as shells } from "../utils/shell.js";
import { inferShell } from "../utils/shell.js";
import { loadConfig } from "../utils/config.js";
import { Command } from "commander";
import log from "../utils/log.js";
import { checkUnpackedVersion } from "../utils/node.js";
import { endTiming, startTiming } from "../utils/performance.js";

export const supportedShells = shells.join(", ");

type RootCommandOptions = {
  shell: Shell | undefined;
  verbose: boolean | undefined;
  check: boolean | undefined;
  test: boolean | undefined;
  login: boolean | undefined;
};

export const action = (program: Command) => async (options: RootCommandOptions) => {
  const startupTiming = startTiming();
  const inISTerm = process.env.ISTERM === "1";
  if (options.check || inISTerm) {
    const { renderConfirmation } = await import("../ui/ui-status.js");
    process.stdout.write(renderConfirmation(inISTerm));
    endTiming("startup.check", startupTiming);
    process.exit(0);
  }

  const isVersionUpToDate = await checkUnpackedVersion();
  if (!isVersionUpToDate) {
    const { renderMissingResources } = await import("../ui/ui-status.js");
    process.stdout.write(renderMissingResources());
    endTiming("startup.missingResources", startupTiming);
    process.exit(1);
  }

  if (options.verbose) await log.enable();

  const [, inferredShell] = await Promise.all([loadConfig(program), options.shell ? Promise.resolve(options.shell) : inferShell()]);

  log.overrideConsole();

  const shell = (options.shell ?? inferredShell) as Shell | undefined;
  if (shell == null) {
    program.error(`Unable to identify shell, use the -s/--shell option to provide your shell`, { exitCode: 1 });
  }
  if (!shells.map((s) => s.valueOf()).includes(shell)) {
    program.error(`Unsupported shell: '${shell}', supported shells: ${supportedShells}`, { exitCode: 1 });
  }

  const [{ initializeRuntime }, { render }] = await Promise.all([import("../runtime/initialize.js"), import("../ui/ui-root.js")]);
  await initializeRuntime(shell, options.test ?? false);
  endTiming("startup.beforeRender", startupTiming);
  await render(program, shell, options.test ?? false, options.login ?? false);
};
