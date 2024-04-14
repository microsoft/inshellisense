#!/usr/bin/env node

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable header/header */

import { Command, Option } from "commander";

import complete from "./commands/complete.js";
import uninstall from "./commands/uninstall.js";
import init from "./commands/init.js";
import { action, supportedShells } from "./commands/root.js";
import { getVersion } from "./utils/version.js";

const program = new Command();

const hiddenOption = (flags: string, description: string) => {
  const option = new Option(flags, description);
  option.hidden = true;
  return option;
};

program
  .name("inshellisense")
  .description("IDE style command line auto complete")
  .version(await getVersion(), "-v, --version", "output the current version")
  .action(action(program))
  .option("-l, --login", `start shell as a login shell`)
  .option("-s, --shell <shell>", `shell to use for command execution, supported shells: ${supportedShells}`)
  .option("-c, --check", `check if shell is in an inshellisense session`)
  .addOption(hiddenOption("-T, --test", "used to make e2e tests reproducible across machines"))
  .option("-V, --verbose", `enable verbose logging`)
  .showHelpAfterError("(add --help for additional information)");

program.addCommand(complete);
program.addCommand(uninstall);
program.addCommand(init);

program.parse();
