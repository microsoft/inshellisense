// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Command } from "commander";
import { supportedShells } from "../utils/bindings.js";
import { render } from "../ui/ui-bind.js";

const action = async () => {
  await render();
};

const cmd = new Command("bind");
cmd.description(`adds keybindings to the selected shell: ${supportedShells.join(", ")}`);
cmd.action(action);

export default cmd;
