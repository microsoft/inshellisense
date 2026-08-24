// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import url from "node:url";
import type { TuiTest } from "@microsoft/tui-test";
import { createTerminal, untrackTerminal } from "@microsoft/tui-test/test";
import type { Shell } from "@microsoft/tui-test";

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

const expectTextTimeout = 30_000;
const idleTimeout = 15_000;
const promptTimeout = 20_000;
const timeouts = { text: expectTextTimeout, idle: idleTimeout };

export const expectPrompt = async (terminal: TuiTest, timeout = promptTimeout): Promise<void> => {
  await terminal.expectText(">  ", { timeout });
  await terminal.waitIdle();
};

export const closeSession = async (terminal: TuiTest | undefined): Promise<void> => {
  if (terminal) {
    await terminal.closeQuiet();
    untrackTerminal(terminal);
  }
};

const baseEnv = { ISTERM: "0", ISTERM_TESTING: "0" };

export const startSession = async (config: ShellConfig, args: string[], cols = 80, rows = 30): Promise<TuiTest> => {
  const terminal = await createTerminal({
    program: ["node", buildEntry, ...args],
    cols,
    rows,
    env: { ...baseEnv, ...config.env },
    timeouts,
    retries: 2,
  });
  try {
    await expectPrompt(terminal);
    return terminal;
  } catch (error) {
    await closeSession(terminal);
    throw error;
  }
};

export const startShell = async (shell: Shell): Promise<TuiTest> => createTerminal({ shell, env: baseEnv, timeouts, retries: 2 });
