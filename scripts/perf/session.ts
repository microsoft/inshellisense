// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import pty from "node-pty";

import { unpackResources } from "../../src/utils/node.js";
import { Shell } from "../../src/utils/shell.js";

const shell =
  (process.env.ISTERM_PERF_SHELL as Shell | undefined) ?? (process.platform === "win32" ? Shell.Cmd : process.platform === "darwin" ? Shell.Zsh : Shell.Bash);
const metricsPath = path.join(os.tmpdir(), `inshellisense-perf-${process.pid}.json`);
const enter = "\r";

await unpackResources();

const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
  const startedAt = performance.now();
  const terminal = pty.spawn(process.execPath, ["build/index.js", "-T", "-s", shell], {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: process.cwd(),
    env: {
      ...process.env,
      ISTERM_PERF: "1",
      ISTERM_PERF_OUTPUT: metricsPath,
    },
  });
  let stage: "prompt" | "suggestion" | "clear" | "command" | "exit" = "prompt";
  let stageStartedAt = startedAt;
  let buffer = "";
  let startupMilliseconds = 0;
  let suggestionMilliseconds = 0;
  let inputEchoMilliseconds = 0;
  const timeout = setTimeout(() => {
    terminal.kill();
    reject(new Error(`session benchmark timed out while waiting for ${stage}`));
  }, 30_000);

  terminal.onData((data) => {
    buffer = (buffer + data).slice(-100_000);
    if (stage === "prompt" && buffer.includes("> ")) {
      startupMilliseconds = performance.now() - startedAt;
      stage = "suggestion";
      stageStartedAt = performance.now();
      buffer = "";
      terminal.write("git ");
    } else if (stage === "suggestion" && buffer.includes("┌") && buffer.includes("┐")) {
      suggestionMilliseconds = performance.now() - stageStartedAt;
        stage = "clear";
      buffer = "";
      terminal.write("\u007F".repeat(4));
    } else if (stage === "clear" && buffer.length > 0) {
        stage = "command";
        buffer = "";
        stageStartedAt = performance.now();
        terminal.write(`echo ISTERM_PERF_MARKER${enter}`);
    } else if (stage === "command" && buffer.includes("ISTERM_PERF_MARKER")) {
      inputEchoMilliseconds = performance.now() - stageStartedAt;
      stage = "exit";
      terminal.write(`exit${enter}`);
    }
  });

  terminal.onExit(({ exitCode }) => {
    clearTimeout(timeout);
    if (exitCode !== 0) {
      reject(new Error(`session benchmark exited with code ${exitCode}`));
      return;
    }
    const runtimeMetrics = fs.existsSync(metricsPath) ? JSON.parse(fs.readFileSync(metricsPath, "utf8")) : undefined;
    resolve({
      shell,
      startupMilliseconds,
      suggestionMilliseconds,
      inputEchoMilliseconds,
      runtimeMetrics,
    });
  });
});

if (fs.existsSync(metricsPath)) fs.rmSync(metricsPath);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`, () => process.exit(0));
