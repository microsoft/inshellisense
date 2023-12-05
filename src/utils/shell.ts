// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import process from "node:process";
import find from "find-process";
import path from "node:path";
import which from "which";
import fs from "node:fs";
import url from "node:url";
import os from "node:os";
import fsAsync from "node:fs/promises";

export enum Shell {
  Bash = "bash",
  Powershell = "powershell",
  Pwsh = "pwsh",
  Zsh = "zsh",
  Fish = "fish",
  Cmd = "cmd",
}

export const supportedShells = [Shell.Bash, process.platform == "win32" ? Shell.Powershell : null, Shell.Pwsh, Shell.Zsh, Shell.Fish].filter(
  (shell) => shell != null,
) as Shell[];

export const userZdotdir = process.env?.ZDOTDIR ?? os.homedir() ?? `~`;
export const zdotdir = path.join(os.tmpdir(), `is-zsh`);

export const setupZshDotfiles = async () => {
  const shellFolderPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..", "shell");
  await fsAsync.cp(path.join(shellFolderPath, "shellIntegration-rc.zsh"), path.join(zdotdir, ".zshrc"));
  await fsAsync.cp(path.join(shellFolderPath, "shellIntegration-profile.zsh"), path.join(zdotdir, ".zprofile"));
  await fsAsync.cp(path.join(shellFolderPath, "shellIntegration-env.zsh"), path.join(zdotdir, ".zshenv"));
  await fsAsync.cp(path.join(shellFolderPath, "shellIntegration-login.zsh"), path.join(zdotdir, ".zlogin"));
};

export const inferShell = async () => {
  try {
    const name = path.parse(process.env.SHELL ?? "").name;
    const shellName = supportedShells.find((shell) => name.includes(shell));
    if (shellName) return shellName;
  } catch {
    /* empty */
  }
  const processResult = (await find("pid", process.ppid)).at(0);
  const name = processResult?.name;
  return name != null ? supportedShells.find((shell) => name.includes(shell)) : undefined;
};

export const gitBashPath = async (): Promise<string> => {
  const gitBashPaths = await getGitBashPaths();
  for (const gitBashPath of gitBashPaths) {
    if (fs.existsSync(gitBashPath)) {
      return gitBashPath;
    }
  }
  throw new Error("unable to find a git bash executable installed");
};

const getGitBashPaths = async (): Promise<string[]> => {
  const gitDirs: Set<string> = new Set();

  const gitExePath = await which("git.exe", { nothrow: true });
  if (gitExePath) {
    const gitExeDir = path.dirname(gitExePath);
    gitDirs.add(path.resolve(gitExeDir, "../.."));
  }

  const addValid = <T>(set: Set<T>, value: T | undefined) => {
    if (value) set.add(value);
  };

  // Add common git install locations
  addValid(gitDirs, process.env["ProgramW6432"]);
  addValid(gitDirs, process.env["ProgramFiles"]);
  addValid(gitDirs, process.env["ProgramFiles(X86)"]);
  addValid(gitDirs, `${process.env["LocalAppData"]}\\Program`);

  const gitBashPaths: string[] = [];
  for (const gitDir of gitDirs) {
    gitBashPaths.push(
      `${gitDir}\\Git\\bin\\bash.exe`,
      `${gitDir}\\Git\\usr\\bin\\bash.exe`,
      `${gitDir}\\usr\\bin\\bash.exe`, // using Git for Windows SDK
    );
  }

  // Add special installs that don't follow the standard directory structure
  gitBashPaths.push(`${process.env["UserProfile"]}\\scoop\\apps\\git\\current\\bin\\bash.exe`);
  gitBashPaths.push(`${process.env["UserProfile"]}\\scoop\\apps\\git-with-openssh\\current\\bin\\bash.exe`);

  return gitBashPaths;
};
