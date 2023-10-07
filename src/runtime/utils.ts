import { exec } from "node:child_process";

export const buildExecuteShellCommand =
  (timeout: number) =>
  async (command: string, cwd?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      exec(command, { timeout }, (_, stdout, stderr) => {
        resolve(stdout || stderr);
      });
    });
  };
