// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { initRender } from "../ui/ui-init.js";
import { render } from "../ui/ui-root.js";
import { Shell, supportedShells as shells } from "../utils/bindings.js";
import { inferShell } from "../utils/shell.js";
import { Command } from "commander";

export const supportedShells = shells.join(", ");

export const action = (program: Command) => async () => {
  //@ts-ignore
  const shell: Shell = (await inferShell()) ?? (await initRender()) ?? "";
  if (!shells.map((s) => s.valueOf()).includes(shell)) {
    program.error(`Unsupported shell: '${shell}', supported shells: ${supportedShells}`, { exitCode: 1 });
  }
  await render(shell);
};
