// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Command } from "commander";
import { loadConfig } from "../../utils/config.js";
import { getSpecNames, loadLocalSpecsSet } from "../../runtime/runtime.js";
import { getAliasNames, loadAliases } from "../../runtime/alias.js";
import { aliasSupportedShells, Shell } from "../../utils/shell.js";

const supportedShells = aliasSupportedShells.join(", ");

type ListCommandOptions = {
  shell: Shell | undefined;
};

const action = (program: Command) => async (options: ListCommandOptions) => {
  await loadConfig(program);
  await loadLocalSpecsSet();

  const { shell } = options;
  if (shell && !aliasSupportedShells.map((s) => s.valueOf()).includes(shell)) {
    program.error(`Unsupported shell: '${shell}', supported shells: ${supportedShells}`, { exitCode: 1 });
  }
  if (shell) {
    await loadAliases(shell);
  }
  process.stdout.write(JSON.stringify([...getAliasNames(), ...getSpecNames()]));
  process.exit(0);
};

const cmd = new Command("list");
cmd.description(`list the names of all available specs`);
cmd.option("-s, --shell <shell>", `shell to use alias specs, supported shells: ${supportedShells}`);
cmd.action(action(cmd));

export default cmd;
