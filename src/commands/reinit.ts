// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Command } from "commander";
import { render } from "../ui/ui-reinit.js";

const action = async () => {
  await render();
};

const cmd = new Command("reinit");
cmd.description(`regenerates shell configurations`);
cmd.action(action);

export default cmd;
