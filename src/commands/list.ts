// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Command } from "commander";
import { getSpecs } from "../runtime/runtime.js";

const action = async () => {
  const specs = await getSpecs();
  process.stdout.write(JSON.stringify(specs));
};

const cmd = new Command("list");
cmd.description(`list specs`);
cmd.action(action);

export default cmd;
