// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from "node:fs";

if (fs.existsSync("./build/commands/init.js")) {
  const init = (await import("../build/commands/init.js")).default;
  init.parse(["--generate-full-configs"], { from: "user" });
}
