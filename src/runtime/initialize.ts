// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { setupZshDotfiles, Shell } from "../utils/shell.js";

type RuntimeModule = typeof import("./runtime.js");

let runtimeInitialization: Promise<RuntimeModule> | undefined;

export const initializeRuntime = (shell: Shell, underTest = false): Promise<RuntimeModule> => {
  runtimeInitialization ??= (async () => {
    const zshSetup = shell == Shell.Zsh ? setupZshDotfiles(underTest) : Promise.resolve();
    const [runtime, alias] = await Promise.all([import("./runtime.js"), import("./alias.js")]);
    await Promise.all([runtime.loadLocalSpecsSet(), alias.loadAliases(shell), zshSetup]);
    return runtime;
  })();
  return runtimeInitialization;
};
