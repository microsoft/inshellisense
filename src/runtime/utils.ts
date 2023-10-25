// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { exec, spawn } from "node:child_process";

export type ExecuteShellCommandTTYResult = {
  code: number | null;
};

export const buildExecuteShellCommand =
  (timeout: number) =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO: use cwd in the future
  async (command: string, cwd?: string): Promise<string> => {
    return new Promise((resolve) => {
      exec(command, { timeout }, (_, stdout, stderr) => {
        resolve(stdout || stderr);
      });
    });
  };

export const executeShellCommandTTY = async (shell: string, command: string): Promise<ExecuteShellCommandTTYResult> => {
  const child = spawn(shell, ["-c", command.trim()], { stdio: "inherit" });
  return new Promise((resolve) => {
    child.on("close", (code) => {
      resolve({
        code,
      });
    });
  });
};
