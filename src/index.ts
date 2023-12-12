#!/usr/bin/env node

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable header/header */

import { Command } from "commander";

import complete from "./commands/complete.js";
import uninstall from "./commands/uninstall.js";
import { action, supportedShells } from "./commands/root.js";
import { getVersion } from "./utils/version.js";

const program = new Command();

program
  .name("inshellisense")
  .description("IDE style command line auto complete")
  .version(await getVersion(), "-v, --version", "output the current version")
  .action(action(program))
  .option("-s, --shell <shell>", `shell to use for command execution, supported shells: ${supportedShells}`)
  .showHelpAfterError("(add --help for additional information)");

program.addCommand(complete);
program.addCommand(uninstall);

program.parse();
