#!/usr/bin/env node

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable header/header */

import { Command } from "commander";

import bind from "./commands/bind.js";
import { action, supportedShells } from "./commands/root.js";

const program = new Command();

program
  .name("sa")
  .description("IDE style command line auto complete")
  .version("0.0.0", "-v, --version", "output the current version")
  .option("-s, --shell <shell>", `shell to use for command execution, supported shells: ${supportedShells}`)
  .option("-c, --command <commmand>", "command to use as initial input")
  .option("--history", "get the last command execute")
  .action(action);

program.addCommand(bind);

program.parse();
