#!/usr/bin/env node

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable header/header */

import { Command } from "commander";

import bind from "./commands/bind.js";
import uninstall from "./commands/uninstall.js";
import { action } from "./commands/root.js";
import { getVersion } from "./utils/version.js";

const program = new Command();

program
  .name("inshellisense")
  .description("IDE style command line auto complete")
  .version(await getVersion(), "-v, --version", "output the current version")
  .action(action(program))
  .showHelpAfterError("(add --help for additional information)");

program.addCommand(bind);
program.addCommand(uninstall);

program.parse();
