// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Command } from "commander";
import { render } from "../ui/ui-install.js";


const action = async () => {
  await render();
};

const cmd = new Command("install");
cmd.description(`creates cache resources for inshellisense`);
cmd.action(action);

export default cmd;
