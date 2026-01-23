// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import process from "node:process";
import find from "find-process";
import path from "node:path";
import which from "which";
import fs from "node:fs";
import os from "node:os";
import fsAsync from "node:fs/promises";
import util from "node:util";
import { shellResourcesPath, initResourcesPath } from "./constants.js";
import childProcess from "node:child_process";
import { KeyPressEvent } from "../ui/suggestionManager.js";
import log from "./log.js";

const exec = util.promisify(childProcess.exec);
const safeExec = async (command: string, options?: childProcess.ExecOptions) => {
  const defaultOptions: childProcess.ExecOptions = { timeout: 500, env: { ISTERM: "1" } };
  try {
    const { stdout, stderr } = await exec(command, { ...defaultOptions, ...options });
    return { stdout, stderr };
  } catch (e) {
    log.debug({ msg: `error executing exec command: ${e}` });
    return { stdout: undefined, stderr: undefined };
  }
};

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

export const checkShellConfigs = (): Shell[] => {
  const shellsWithoutConfigs: Shell[] = [];
  for (const shell of supportedShells) {
    const shellConfigName = getShellConfigName(shell);
    if (shellConfigName == null) continue;
    if (!fs.existsSync(path.join(initResourcesPath, shell, shellConfigName))) {
      shellsWithoutConfigs.push(shell);
    }
  }
  return shellsWithoutConfigs;
};

export const checkLegacyConfigs = async (): Promise<Shell[]> => {
  const shellsWithLegacyConfig: Shell[] = [];
  for (const shell of supportedShells) {
    const profilePath = await getProfilePath(shell);
    if (profilePath != null && fs.existsSync(profilePath)) {
      const profile = await fsAsync.readFile(profilePath, "utf8");
      if (profile.includes("inshellisense shell plugin")) {
        shellsWithLegacyConfig.push(shell);
      }
      if (profile.includes(`~/.inshellisense/${shell}/init.`)) {
        shellsWithLegacyConfig.push(shell);
      }
    }
  }
  return shellsWithLegacyConfig;
};

export const checkShellConfigPlugin = async () => {
  const shellsWithoutPlugin: Shell[] = [];
  const shellsWithBadPlugin: Shell[] = [];
  for (const shell of supportedShells) {
    const profilePath = await getProfilePath(shell);
    if (profilePath != null && fs.existsSync(profilePath)) {
      const profile = await fsAsync.readFile(profilePath, "utf8");

      const shellSourceCommand = getShellSourceCommand(shell).trim();
      const profileContainsSource = profile.includes(shellSourceCommand);
      const profileEndsWithSource = profile.trimEnd().endsWith(shellSourceCommand);

      if (!profileContainsSource) {
        shellsWithoutPlugin.push(shell);
      } else if (!profileEndsWithSource) {
        shellsWithBadPlugin.push(shell);
      }
    }
  }
  return { shellsWithoutPlugin, shellsWithBadPlugin };
};

const getProfilePath = async (shell: Shell): Promise<string | undefined> => {
  switch (shell) {
    case Shell.Bash:
      return path.join(os.homedir(), ".bashrc");
    case Shell.Powershell:
      return (await safeExec(`echo $profile`, { shell, timeout: 5_000 })).stdout?.toString()?.trim();
    case Shell.Pwsh:
      return (await safeExec(`echo $profile`, { shell, timeout: 5_000 })).stdout?.toString()?.trim();
    case Shell.Zsh:
      return path.join(os.homedir(), ".zshrc");
    case Shell.Fish:
      return path.join(os.homedir(), ".config", "fish", "config.fish");
    case Shell.Xonsh:
      return path.join(os.homedir(), ".xonshrc");
    case Shell.Nushell:
      return (await safeExec(`echo $nu.env-path`, { shell, timeout: 5_000 })).stdout?.toString()?.trim();
  }
};

export const createShellConfigs = async () => {
  for (const shell of supportedShells) {
    const shellConfigName = getShellConfigName(shell);
    if (shellConfigName == null) continue;
    await fsAsync.mkdir(path.join(initResourcesPath, shell), { recursive: true });
    await fsAsync.writeFile(path.join(initResourcesPath, shell, shellConfigName), getShellConfig(shell));
  }
};

const getShellConfigName = (shell: Shell) => {
  switch (shell) {
    case Shell.Bash:
      return "init.sh";
    case Shell.Powershell:
    case Shell.Pwsh:
      return "init.ps1";
    case Shell.Zsh:
      return "init.zsh";
    case Shell.Fish:
      return "init.fish";
    case Shell.Xonsh:
      return "init.xsh";
    case Shell.Nushell:
      return "init.nu";
    default:
      return undefined;
  }
};

export const setupZshDotfiles = async () => {
  await fsAsync.cp(path.join(shellResourcesPath, "shellIntegration-rc.zsh"), path.join(zdotdir, ".zshrc"));
  await fsAsync.cp(path.join(shellResourcesPath, "shellIntegration-profile.zsh"), path.join(zdotdir, ".zprofile"));
  await fsAsync.cp(path.join(shellResourcesPath, "shellIntegration-env.zsh"), path.join(zdotdir, ".zshenv"));
  await fsAsync.cp(path.join(shellResourcesPath, "shellIntegration-login.zsh"), path.join(zdotdir, ".zlogin"));
};

const findParentProcess = async () => {
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
  const processResult = await findParentProcess();
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

export const getPathSeparator = (shell: Shell) => (shell == Shell.Bash || shell == Shell.Xonsh || shell == Shell.Nushell ? "/" : path.sep);

export const removePathSeparator = (dir: string) => {
  return dir.endsWith("/") || dir.endsWith("\\") ? dir.slice(0, -1) : dir;
};

export const addPathSeparator = (dir: string, shell: Shell) => {
  const pathSep = getPathSeparator(shell);
  return dir.endsWith(pathSep) ? dir : dir + pathSep;
};

export const getPathDirname = (dir: string, shell: Shell) => {
  const pathSep = getPathSeparator(shell);
  return dir.endsWith(pathSep) || path.dirname(dir) == "." ? dir : addPathSeparator(path.dirname(dir), shell);
};

export const endsWithPathSeparator = (dir: string, shell: Shell) => {
  const pathSep = getPathSeparator(shell);
  return dir.endsWith(pathSep);
};

// nu fully re-writes the prompt every keystroke resulting in duplicate start/end sequences on the same line & re-writes the prompt after accepting a command
// xonsh re-writes the prompt after accepting a command
export const getShellPromptRewrites = (shell: Shell) => shell == Shell.Nushell || shell == Shell.Xonsh;

export const getShellSourceCommand = (shell: Shell): string => {
  switch (shell) {
    case Shell.Bash:
      return `[ -f ~/.inshellisense/init/bash/init.sh ] && source ~/.inshellisense/init/bash/init.sh`;
    case Shell.Powershell:
      return `if ( Test-Path '~/.inshellisense/init/powershell/init.ps1' -PathType Leaf ) { . ~/.inshellisense/init/powershell/init.ps1 }`;
    case Shell.Pwsh:
      return `if ( Test-Path '~/.inshellisense/init/pwsh/init.ps1' -PathType Leaf ) { . ~/.inshellisense/init/pwsh/init.ps1 }`;
    case Shell.Zsh:
      return `[[ -f ~/.inshellisense/init/zsh/init.zsh ]] && source ~/.inshellisense/init/zsh/init.zsh`;
    case Shell.Fish:
      return `test -f ~/.inshellisense/init/fish/init.fish && source ~/.inshellisense/init/fish/init.fish`;
    case Shell.Xonsh:
      return `p"~/.inshellisense/init/xonsh/init.xsh".exists() && source "~/.inshellisense/init/xonsh/init.xsh"`;
    case Shell.Nushell:
      return `if ( '~/.inshellisense/init/nu/init.nu' | path exists ) { source ~/.inshellisense/init/nu/init.nu }`;
  }
  return "";
};

export const getShellConfig = (shell: Shell): string => {
  switch (shell) {
    case Shell.Zsh:
      return `if [[ -z "\${ISTERM}" && $- = *i* && $- != *c* && -z "\${VSCODE_RESOLVING_ENVIRONMENT}" ]]; then
  if [[ -o login ]]; then
    is -s zsh --login ; exit
  else
    is -s zsh ; exit
  fi
fi`;
    case Shell.Bash:
      return `if [[ -z "\${ISTERM}" && $- = *i* && $- != *c* && -z "\${VSCODE_RESOLVING_ENVIRONMENT}" ]]; then
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
      return `$__IsCommandFlag = ([Environment]::GetCommandLineArgs() | Where-Object { $_ -ieq "-Command" -or $_ -ieq "-c" }).Count -gt 0
$__IsNoExitFlag = ([Environment]::GetCommandLineArgs() | Where-Object { $_ -ieq "-NoExit" }).Count -gt 0
$__IsInteractive = -not $__IsCommandFlag -or ($__IsCommandFlag -and $__IsNoExitFlag)
if ([string]::IsNullOrEmpty($env:ISTERM) -and [Environment]::UserInteractive -and $__IsInteractive -and [string]::IsNullOrEmpty($env:VSCODE_RESOLVING_ENVIRONMENT)) {
  is -s ${shell}
  Stop-Process -Id $pid
}`;
    case Shell.Fish:
      return `if test -z "$ISTERM" && status --is-interactive && test -z "$VSCODE_RESOLVING_ENVIRONMENT"
  if status --is-login
    is -s fish --login ; kill %self
  else
    is -s fish ; kill %self
  end 
end`;
    case Shell.Xonsh:
      return `if 'ISTERM' not in \${...} and $XONSH_INTERACTIVE and 'VSCODE_RESOLVING_ENVIRONMENT' not in \${...}:
    if $XONSH_LOGIN:
        is -s xonsh --login ; exit
    else:
        is -s xonsh ; exit`;
    case Shell.Nushell:
      return `if "ISTERM" not-in $env and $nu.is-interactive and "VSCODE_RESOLVING_ENVIRONMENT" not-in $env {
    if $nu.is-login { is -s nu --login ; exit } else { is -s nu ; exit }
}`;
  }
  return "";
};
