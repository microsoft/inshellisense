// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { render } from "../ui/ui-root.js";
import { executeShellCommandTTY } from "../runtime/utils.js";
import { saveCommand, loadCommand } from "../utils/cache.js";
import { supportedShells as shells } from "../utils/bindings.js";

export const supportedShells = shells.join(", ");

type RootCommandOptions = {
  shell: string | undefined;
  command: string | undefined;
  history: boolean | undefined;
};

export const action = async (options: RootCommandOptions) => {
  if (options.history) {
    process.stdout.write(await loadCommand());
    process.exit(0);
  }

  const shell = options.shell ?? "";
  if (!shells.map((s) => s.valueOf()).includes(shell)) {
    console.error(`Unsupported shell: '${shell}', supported shells: ${supportedShells}`);
    process.exit(1);
  }

  const commandToExecute = await render(options.command);
  await saveCommand(commandToExecute);

  const result = await executeShellCommandTTY(shell, commandToExecute);
  if (result.code) {
    process.exit(result.code);
  } else {
    process.exit(0);
  }
};
