// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from "node:os";
import { Command } from "commander";
import { getSuggestions } from "../runtime/runtime.js";
import { Shell } from "../utils/shell.js";

const action = async (input: string) => {
  const suggestions = await getSuggestions(input, process.cwd(), os.platform() === "win32" ? Shell.Cmd : Shell.Bash);
  process.stdout.write(JSON.stringify(suggestions));
  process.exit(0);
};

const cmd = new Command("complete");
cmd.description(`generates a completion for the provided input`);
cmd.argument("<input>");
cmd.action(action);

export default cmd;
