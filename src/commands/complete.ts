// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Command } from "commander";
import { getSuggestionsForWords } from "../runtime/runtime.js";

const action = async (words: string[]) => {
  if (words.length < 2) {
    process.stderr.write("needs at least two arguments\n");
    process.exit(1);
  }

  getSuggestionsForWords(words).then((suggestions) => {
    process.stdout.write(JSON.stringify(suggestions));
  });
};

const cmd = new Command("complete");
cmd.description(`completes given words`);
cmd.argument('<words...>')
cmd.action(action);

export default cmd;
