// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import log from "../utils/log.js";
import { gitBashPath, Shell } from "../utils/shell.js";
import { CommandToken, parseCommand } from "./parser.js";
import { buildExecuteShellCommand } from "./utils.js";
import os from "node:os";

const loadedAliases: { [key: string]: CommandToken[] | undefined } = {};
const platform = os.platform();
const executeShellCommand = buildExecuteShellCommand(5_000);

const loadBashAliases = async () => {
  const shellTarget = platform == "win32" ? await gitBashPath() : Shell.Bash;
  const { stdout, stderr, status } = await executeShellCommand({ command: shellTarget, args: ["-i", "-c", "alias"], cwd: process.cwd() });
  if (status !== 0) {
    log.debug({ msg: "failed to load bash aliases", stderr, status });
    return;
  }

  return stdout
    .trim()
    .split("\n")
    .forEach((line) => {
      const [alias, ...commandSegments] = line.replace("alias ", "").replaceAll("'\\''", "'").split("=");
      loadedAliases[alias] = parseCommand(commandSegments.join("=").slice(1, -1) + " ");
    });
};

const loadZshAliases = async () => {
  const { stdout, stderr, status } = await executeShellCommand({ command: Shell.Zsh, args: ["-i", "-c", "alias"], cwd: process.cwd() });
  if (status !== 0) {
    log.debug({ msg: "failed to load zsh aliases", stderr, status });
    return;
  }

  return stdout
    .trim()
    .split("\n")
    .forEach((line) => {
      const [alias, ...commandSegments] = line.replaceAll("'\\''", "'").split("=");
      loadedAliases[alias] = parseCommand(commandSegments.join("=").slice(1, -1) + " ");
    });
};

export const loadAliases = async (shell: Shell) => {
  switch (shell) {
    case Shell.Bash:
      await loadBashAliases();
      break;
    case Shell.Zsh:
      await loadZshAliases();
      break;
  }
  return [];
};

export const aliasExpand = (command: CommandToken[]): CommandToken[] => {
  if (!command.at(0)?.complete) return command;

  const alias = loadedAliases[command.at(0)?.token ?? ""];
  if (alias) {
    log.debug({ msg: "expanding alias", alias, command: command.slice(1) });
    return [...alias, ...command.slice(1)];
  }
  return command;
};
