
import { Command } from "commander";

import bind from "./commands/bind.js";
import { action } from "./commands/root.js";

const program = new Command();

program.name("clac")
.description('IDE style command line auto complete')
.version("0.0.0", "-v, --version", "output the current version")
.action(action)

program.addCommand(bind);

program.parse();