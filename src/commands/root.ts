// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { initRender } from "../ui/ui-init.js";
import { render } from "../ui/ui-root.js";
import { executeShellCommandTTY, ExecuteShellCommandTTYResult } from "../runtime/utils.js";
import { saveCommand, loadCommand } from "../utils/cache.js";
import { supportedShells as shells } from "../utils/bindings.js";
import { inferShell } from "../utils/shell.js";
import { Command } from "commander";

export const supportedShells = shells.join(", ");

type RootCommandOptions = {
  shell: string | undefined;
  command: string | undefined;
  history: boolean | undefined;
  duration: string | undefined;
};

export const action = (program: Command) => async (options: RootCommandOptions) => {
  if (options.history) {
    process.stdout.write(await loadCommand());
    process.exit(0);
  }

  const shell = options.shell ?? (await inferShell()) ?? (await initRender()) ?? "";
  if (!shells.map((s) => s.valueOf()).includes(shell)) {
    program.error(`Unsupported shell: '${shell}', supported shells: ${supportedShells}`, { exitCode: 1 });
  }

  let executed = false;
  const commands = [];
  let result: ExecuteShellCommandTTYResult = { code: 0 };
  let startingCommand = options.command;
  while (options.duration === "session" || !executed) {
    const commandToExecute = await render(startingCommand);

    if (commandToExecute == null || commandToExecute.trim().toLowerCase() == "exit" || commandToExecute.trim().toLowerCase() == "logout") {
      result = { code: 0 };
      break;
    }

    commands.push(commandToExecute);
    result = await executeShellCommandTTY(shell, commandToExecute);
    executed = true;
    startingCommand = undefined;
  }
  await saveCommand(commands);

  if (result.code) {
    process.exit(result.code);
  } else {
    process.exit(0);
  }
};
