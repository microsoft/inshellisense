// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Command } from "commander";
import { getSuggestions } from "../runtime/runtime.js";

const action = async (input: string) => {
  const suggestions = await getSuggestions(input);
  process.stdout.write(JSON.stringify(suggestions));
};

const cmd = new Command("complete");
cmd.description(`generates a completion for the provided input`);
cmd.argument("<input>");
cmd.action(action);

export default cmd;
