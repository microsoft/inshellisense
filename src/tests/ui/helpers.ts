// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import url from "node:url";
import { ShellUse } from "@microsoft/shell-use";

export type ShellConfig = {
  label: string;
  shell: string;
  env?: Record<string, string>;
};

const ohmyzshFixtureDir = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "fixtures", "ohmyzsh");
const hasOhMyZsh = os.platform() !== "win32" && fs.existsSync(path.join(os.homedir(), ".oh-my-zsh"));

const windowsConfigs: ShellConfig[] = [
  { label: "cmd", shell: "cmd" },
  { label: "pwsh", shell: "pwsh" },
  { label: "powershell", shell: "powershell" },
  { label: "xonsh", shell: "xonsh" },
];
const unixConfigs: ShellConfig[] = [
  { label: "bash", shell: "bash" },
  { label: "fish", shell: "fish" },
  { label: "zsh", shell: "zsh" },
  ...(hasOhMyZsh ? [{ label: "zsh-ohmyzsh", shell: "zsh", env: { USER_ZDOTDIR: ohmyzshFixtureDir } }] : []),
];
export const configs = os.platform() == "win32" ? windowsConfigs : unixConfigs;
export const returnChar = (shell: string) => (shell == "xonsh" ? "\n" : "\r");

const buildEntry = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..", "..", "build", "index.js");

let counter = 0;
export const startSession = async (config: ShellConfig, args: string[], cols = 80, rows = 30): Promise<ShellUse> => {
  const su = new ShellUse(`is-e2e-${config.label}-${process.pid}-${counter++}`);
  await su.run("node", [buildEntry, ...args], { cols, rows, ...(config.env ? { env: config.env } : {}) });
  return su;
};
