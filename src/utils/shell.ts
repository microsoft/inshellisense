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
import { KeyPressEvent } from "../ui/suggestionManager.js";
import log from "./log.js";

export enum Shell {
  Bash = "bash",
  Powershell = "powershell",
  Pwsh = "pwsh",
  Zsh = "zsh",
  Fish = "fish",
  Cmd = "cmd",
  Xonsh = "xonsh",
  Nushell = "nu",
}

export const supportedShells = [
  Shell.Bash,
  process.platform == "win32" ? Shell.Powershell : null,
  Shell.Pwsh,
  Shell.Zsh,
  Shell.Fish,
  process.platform == "win32" ? Shell.Cmd : null,
  Shell.Xonsh,
  Shell.Nushell,
].filter((shell) => shell != null) as Shell[];

export const initSupportedShells = supportedShells.filter((shell) => shell != Shell.Cmd);
export const aliasSupportedShells = [Shell.Bash, Shell.Zsh];

export const userZdotdir = process.env?.ZDOTDIR ?? os.homedir() ?? `~`;
export const zdotdir = path.join(os.tmpdir(), `is-zsh`);
const configFolder = ".inshellisense";

export const setupBashPreExec = async () => {
  const shellFolderPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..", "shell");
  const globalConfigPath = path.join(os.homedir(), configFolder);
  if (!fs.existsSync(globalConfigPath)) {
    await fsAsync.mkdir(globalConfigPath, { recursive: true });
  }
  await fsAsync.cp(path.join(shellFolderPath, "bash-preexec.sh"), path.join(globalConfigPath, "bash-preexec.sh"));
};

export const setupZshDotfiles = async () => {
  const shellFolderPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..", "shell");
  await fsAsync.cp(path.join(shellFolderPath, "shellIntegration-rc.zsh"), path.join(zdotdir, ".zshrc"));
  await fsAsync.cp(path.join(shellFolderPath, "shellIntegration-profile.zsh"), path.join(zdotdir, ".zprofile"));
  await fsAsync.cp(path.join(shellFolderPath, "shellIntegration-env.zsh"), path.join(zdotdir, ".zshenv"));
  await fsAsync.cp(path.join(shellFolderPath, "shellIntegration-login.zsh"), path.join(zdotdir, ".zlogin"));
};

const findPareentProcess = async () => {
  try {
    return (await find("pid", process.ppid)).at(0);
  } catch (e) {
    log.debug({ msg: `error finding parent process: ${e}` });
  }
};

export const inferShell = async () => {
  // try getting shell from shell specific env variables
  if (process.env.NU_VERSION != null) {
    return Shell.Nushell;
  } else if (process.env.XONSHRC != null) {
    return Shell.Xonsh;
  } else if (process.env.FISH_VERSION != null) {
    return Shell.Fish;
  } else if (process.env.ZSH_VERSION != null) {
    return Shell.Zsh;
  } else if (process.env.BASH_VERSION != null) {
    return Shell.Bash;
  }

  // try getting shell from env
  try {
    const name = path.parse(process.env.SHELL ?? "").name;
    const shellName = supportedShells.find((shell) => name.includes(shell));
    if (shellName) return shellName;
  } catch {
    /* empty */
  }

  // try getting shell from parent process
  const processResult = await findPareentProcess();
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

export const getBackspaceSequence = (press: KeyPressEvent, shell: Shell) =>
  shell === Shell.Pwsh || shell === Shell.Powershell || shell === Shell.Cmd || shell === Shell.Nushell ? "\u007F" : press[1].sequence;

export const getPathSeperator = (shell: Shell) => (shell == Shell.Bash || shell == Shell.Xonsh || shell == Shell.Nushell ? "/" : path.sep);

// nu fully re-writes the prompt every keystroke resulting in duplicate start/end sequences on the same line
export const getShellPromptRewrites = (shell: Shell) => shell == Shell.Nushell;

export const getShellConfig = (shell: Shell): string => {
  switch (shell) {
    case Shell.Zsh:
      return `if [[ -z "\${ISTERM}" && $- = *i* && $- != *c* ]]; then
  if [[ -o login ]]; then
    is -s zsh --login ; exit
  else
    is -s zsh ; exit
  fi
fi`;
    case Shell.Bash:
      return `if [[ -z "\${ISTERM}" && $- = *i* && $- != *c* ]]; then
  shopt -q login_shell
  login_shell=$?
  if [ $login_shell -eq 0 ]; then
    is -s bash --login ; exit
  else
    is -s bash ; exit
  fi 
fi`;
    case Shell.Powershell:
    case Shell.Pwsh:
      return `$__IsCommandFlag = ([Environment]::GetCommandLineArgs() | ForEach-Object { $_.contains("-Command") }) -contains $true
$__IsNoExitFlag = ([Environment]::GetCommandLineArgs() | ForEach-Object { $_.contains("-NoExit") }) -contains $true
$__IsInteractive = -not $__IsCommandFlag -or ($__IsCommandFlag -and $__IsNoExitFlag)
if ([string]::IsNullOrEmpty($env:ISTERM) -and [Environment]::UserInteractive -and $__IsInteractive) {
  is -s ${shell}
  Stop-Process -Id $pid
}`;
    case Shell.Fish:
      return `if test -z "$ISTERM" && status --is-interactive
  if status --is-login
    is -s fish --login ; kill %self
  else
    is -s fish ; kill %self
  end 
end`;
    case Shell.Xonsh:
      return `if 'ISTERM' not in \${...} and $XONSH_INTERACTIVE:
    if $XONSH_LOGIN:
        is -s xonsh --login ; exit
    else:
        is -s xonsh ; exit`;
    case Shell.Nushell:
      return `if "ISTERM" not-in $env and $nu.is-interactive {
    if $nu.is-login { is -s nu --login ; exit } else { is -s nu ; exit }
}`;
  }
  return "";
};
