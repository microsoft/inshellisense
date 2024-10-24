// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from "node:path";
import { spawn } from "node:child_process";
import fsAsync from "node:fs/promises";

import { CommandToken } from "./parser.js";
import { getPathSeparator, gitBashPath, Shell } from "../utils/shell.js";
import log from "../utils/log.js";

export type ExecuteShellCommandTTYResult = {
  code: number | null;
};

const getExecutionShell = async (): Promise<undefined | string> => {
  if (process.platform !== "win32") return;
  try {
    return await gitBashPath();
  } catch (e) {
    log.debug({ msg: "failed to load posix shell for windows child_process.spawn, some generators might fail", error: e });
  }
};

const bashSpecialCharacters = /[&|<>\s]/g;
// escape whitespace & special characters in an argument when not quoted
const shouldEscapeArg = (arg: string) => {
  const hasSpecialCharacter = bashSpecialCharacters.test(arg);
  const isSingleCharacter = arg.length === 1;
  return hasSpecialCharacter && !isSingleCharacter && !isQuoted(arg, `"`);
};

/* based on libuv process.c used by nodejs, only quotes are escaped for shells. if using git bash need to escape whitespace & special characters in an argument */
const escapeArgs = (shell: string | undefined, args: string[]) => {
  // only escape args for git bash
  if (process.platform !== "win32" || shell == undefined) return args;
  return args.map((arg) => (shouldEscapeArg(arg) ? `"${arg.replaceAll('"', '\\"')}"` : arg));
};

type QuoteChar = `"` | `'` | "`";

const isQuoted = (value: string | undefined, quoteChar: QuoteChar): boolean => (value?.startsWith(quoteChar) && value?.endsWith(quoteChar)) ?? false;

const quoteString = (value: string, quoteChar: QuoteChar): string => {
  if (isQuoted(value, quoteChar)) return value;
  const escapedValue = value.replaceAll(`\\${quoteChar}`, quoteChar).replaceAll(quoteChar, `\\${quoteChar}`);
  return `${quoteChar}${escapedValue}${quoteChar}`;
};

const needsQuoted = (value: string, quoteChar: QuoteChar): boolean => isQuoted(value, quoteChar) || value.includes(" ");

const getShellQuoteChar = (shell: Shell): QuoteChar => {
  switch (shell) {
    case Shell.Zsh:
    case Shell.Bash:
    case Shell.Fish:
      return `"`;
    case Shell.Xonsh:
      return `'`;
    case Shell.Nushell:
      return "`";
    case Shell.Pwsh:
    case Shell.Powershell:
      return `'`;
    case Shell.Cmd:
      return `"`;
  }
};

export const getShellWhitespaceEscapeChar = (shell: Shell): string => {
  switch (shell) {
    case Shell.Zsh:
    case Shell.Bash:
    case Shell.Fish:
    case Shell.Xonsh:
    case Shell.Nushell:
      return "\\";
    case Shell.Pwsh:
    case Shell.Powershell:
      return "`";
    case Shell.Cmd:
      return "^";
  }
};

export const escapePath = (value: string | undefined, shell: Shell): string | undefined =>
  value != null && needsQuoted(value, getShellQuoteChar(shell)) ? quoteString(value, getShellQuoteChar(shell)) : value;

export const buildExecuteShellCommand =
  async (timeout: number): Promise<Fig.ExecuteCommandFunction> =>
  async ({ command, env, args, cwd }: Fig.ExecuteCommandInput): Promise<Fig.ExecuteCommandOutput> => {
    const executionShell = await getExecutionShell();
    const escapedArgs = escapeArgs(executionShell, args);
    const child = spawn(command, escapedArgs, { cwd, env: { ...process.env, ...env, ISTERM: "1" }, shell: executionShell });
    setTimeout(() => child.kill("SIGKILL"), timeout);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => (stdout += data));
    child.stderr.on("data", (data) => (stderr += data));
    child.on("error", (err) => {
      log.debug({ msg: "shell command failed", command, args, e: err.message });
    });
    return new Promise((resolve) => {
      child.on("close", (code) => {
        resolve({
          status: code ?? 0,
          stderr,
          stdout,
        });
      });
    });
  };

export const resolveCwd = async (
  cmdToken: CommandToken | undefined,
  cwd: string,
  shell: Shell,
): Promise<{ cwd: string; pathy: boolean; complete: boolean }> => {
  if (cmdToken == null) return { cwd, pathy: false, complete: false };
  const { token: rawToken, isQuoted } = cmdToken;
  const escapedToken = !isQuoted ? rawToken.replaceAll(" ", "\\ ") : rawToken;
  const token = escapedToken;
  const sep = getPathSeparator(shell);
  if (!token.includes(sep)) return { cwd, pathy: false, complete: false };
  const resolvedCwd = path.isAbsolute(token) ? token : path.join(cwd, token);
  try {
    await fsAsync.access(resolvedCwd, fsAsync.constants.R_OK);
    return { cwd: resolvedCwd, pathy: true, complete: token.endsWith(sep) };
  } catch {
    // fallback to the parent folder if possible
    const baselessCwd = resolvedCwd.substring(0, resolvedCwd.length - path.basename(resolvedCwd).length);
    try {
      await fsAsync.access(baselessCwd, fsAsync.constants.R_OK);
      return { cwd: baselessCwd, pathy: true, complete: token.endsWith(sep) };
    } catch {
      /*empty*/
    }
    return { cwd, pathy: false, complete: false };
  }
};
