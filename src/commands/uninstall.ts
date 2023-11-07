// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Command } from "commander";
import { render } from "../ui/ui-uninstall.js";

const action = async () => {
  await render();
};

const cmd = new Command("uninstall");
cmd.description(`removes all bindings and configuration for inshellisense`);
cmd.action(action);

export default cmd;
