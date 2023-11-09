// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import process from "node:process";
import find from "find-process";
import { supportedShells } from "./bindings.js";

export const inferShell = async () => {
  const processResult = (await find("pid", process.ppid)).at(0);
  const name = processResult?.name;
  return name != null ? supportedShells.find((shell) => name.includes(shell)) : undefined;
};
