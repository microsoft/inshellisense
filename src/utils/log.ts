// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import fsAsync from "node:fs/promises";

const logTarget = path.join(os.homedir(), ".inshellisense", "inshellisense.log");
const logEnabled = false;

const reset = async () => {
  await fsAsync.writeFile(logTarget, "");
};

const debug = (content: object) => {
  if (!logEnabled) {
    return;
  }
  fs.appendFile(logTarget, JSON.stringify(content) + "\n", (err) => {
    if (err != null) {
      throw err;
    }
  });
};

export default { reset, debug };
