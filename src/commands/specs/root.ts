// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Command } from "commander";
import list from "./list.js";

const cmd = new Command("specs");
cmd.description(`manage specs`);
cmd.addCommand(list);

export default cmd;
