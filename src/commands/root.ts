// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { render } from "../ui/ui-root.js";
import { Shell, supportedShells as shells } from "../utils/bindings.js";
import { inferShell } from "../utils/shell.js";
import { Command } from "commander";

export const supportedShells = shells.join(", ");

export const action = (program: Command) => async () => {
  const shell = (await inferShell()) as unknown as Shell | undefined;
  if (shell == null) {
    program.error(`Unable to identify shell, use the -s/--shell option to provide your shell`, { exitCode: 1 });
  }
  if (!shells.map((s) => s.valueOf()).includes(shell)) {
    program.error(`Unsupported shell: '${shell}', supported shells: ${supportedShells}`, { exitCode: 1 });
  }
  await render(shell);
};
