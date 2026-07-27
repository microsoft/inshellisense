// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import url from "node:url";
import { ShellUse } from "@microsoft/shell-use";
import type { ExpectTextOptions, Shell, WaitTextOptions } from "@microsoft/shell-use";

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
const startupAttempts = 3;

class E2EShellUse extends ShellUse {
  override expectText(text: string, opts: ExpectTextOptions = {}): Promise<void> {
    return super.expectText(text, { timeout: expectTextTimeout, ...opts });
  }

  override waitText(text: string, opts: WaitTextOptions = {}): Promise<void> {
    return super.waitText(text, { timeout: expectTextTimeout, ...opts });
  }

  override waitIdle(opts: { timeout?: number } = {}): Promise<void> {
    return super.waitIdle({ timeout: idleTimeout, ...opts });
  }
}

export const expectPrompt = async (terminal: ShellUse, timeout = promptTimeout): Promise<void> => {
  await terminal.expectText(">  ", { timeout });
  await terminal.waitIdle();
};

export const closeSession = async (terminal: ShellUse | undefined): Promise<void> => {
  try {
    await terminal?.close();
  } catch {
    /*empty*/
  }
};

let counter = 0;
const nextSessionName = (label: string) => `is-e2e-${label}-${process.pid}-${counter++}`;
const baseEnv = { ISTERM: "0", ISTERM_TESTING: "0" };
const withStartupRetries = async (label: string, start: (terminal: ShellUse) => Promise<void>): Promise<ShellUse> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < startupAttempts; attempt++) {
    const terminal = new E2EShellUse(nextSessionName(label));
    try {
      await start(terminal);
      return terminal;
    } catch (e) {
      lastError = e;
      await closeSession(terminal);
    }
  }
  throw lastError;
};

export const startSession = (config: ShellConfig, args: string[], cols = 80, rows = 30): Promise<ShellUse> =>
  withStartupRetries(config.label, async (terminal) => {
    await terminal.run("node", [buildEntry, ...args], { cols, rows, env: { ...baseEnv, ...config.env } });
    await expectPrompt(terminal);
  });

export const startShell = (label: string, shell: Shell): Promise<ShellUse> =>
  withStartupRetries(label, async (terminal) => {
    await terminal.open({ shell, env: baseEnv });
  });
