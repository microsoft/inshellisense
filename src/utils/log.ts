// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable @typescript-eslint/no-explicit-any */

import path from "node:path";
import fs from "node:fs";
import fsAsync from "node:fs/promises";
import { loggingResourcesPath } from "./constants.js";


const logTarget = path.join(loggingResourcesPath, "inshellisense.log");
let logEnabled = false;

const reset = async () => {
  if (!fs.existsSync(logTarget)) {
    await fsAsync.mkdir(loggingResourcesPath, { recursive: true });
  }
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

const getLogFunction =
  (level: "error" | "log") =>
  (...data: any[]) =>
    debug({ msg: `console.${level}`, data: data.toString() });

const logConsole = {
  ...console,
  log: getLogFunction("log"),
  error: getLogFunction("error"),
};

// eslint-disable-next-line no-global-assign
const overrideConsole = () => (console = logConsole);

export const enable = async () => {
  await reset();
  logEnabled = true;
};

export default { reset, debug, enable, overrideConsole };
