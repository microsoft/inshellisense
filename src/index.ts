#!/usr/bin/env node

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable header/header */

import { Command } from "commander";

import bind from "./commands/bind.js";
import uninstall from "./commands/uninstall.js";
import { action, supportedShells } from "./commands/root.js";
import { getVersion } from "./utils/version.js";

const program = new Command();

program
  .name("inshellisense")
  .description("IDE style command line auto complete")
  .version(await getVersion(), "-v, --version", "output the current version")
  .option("-s, --shell <shell>", `shell to use for command execution, supported shells: ${supportedShells}`)
  .option("-c, --command <commmand>", "command to use as initial input")
  .option("--history", "get the last command execute")
  .option("-d, --duration <duration>", "duration of the autocomplete session, supported durations: single, session", "session")
  .action(action);

program.addCommand(bind);
program.addCommand(uninstall);

program.parse();
