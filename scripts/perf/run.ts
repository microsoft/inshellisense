// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { spawnSync } from "node:child_process";
import { monitorEventLoopDelay, performance } from "node:perf_hooks";
import os from "node:os";

import { unpackResources } from "../../src/utils/node.js";
import { Shell } from "../../src/utils/shell.js";

type BenchmarkResult = {
  name: string;
  iterations: number;
  firstMilliseconds: number;
  medianMilliseconds: number;
  p95Milliseconds: number;
  minMilliseconds: number;
  maxMilliseconds: number;
};

const iterations = Number.parseInt(process.env.ISTERM_PERF_ITERATIONS ?? "10", 10);

const percentile = (values: number[], value: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(Math.ceil(sorted.length * value) - 1, sorted.length - 1)] ?? 0;
};

const summarize = (name: string, samples: number[]): BenchmarkResult => ({
  name,
  iterations: samples.length,
  firstMilliseconds: samples[0] ?? 0,
  medianMilliseconds: percentile(samples, 0.5),
  p95Milliseconds: percentile(samples, 0.95),
  minMilliseconds: Math.min(...samples),
  maxMilliseconds: Math.max(...samples),
});

const benchmark = async (name: string, action: () => void | Promise<void>): Promise<BenchmarkResult> => {
  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await action();
    samples.push(performance.now() - start);
  }
  return summarize(name, samples);
};

const runCli = (args: string[]) => {
  const result = spawnSync(process.execPath, ["build/index.js", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, ISTERM_PERF: "0" },
  });
  if (result.status !== 0) {
    throw new Error(`CLI benchmark failed for '${args.join(" ")}': ${result.stderr || result.stdout}`);
  }
};

const main = async () => {
  await unpackResources();
  const shell = os.platform() === "win32" ? Shell.Cmd : Shell.Bash;
  const { initializeRuntime } = await import("../../src/runtime/initialize.js");
  const runtime = await initializeRuntime(shell);
  const loopDelay = monitorEventLoopDelay({ resolution: 10 });
  const initialCpu = process.cpuUsage();
  loopDelay.enable();

  const results = [
    await benchmark("startup.version", () => runCli(["--version"])),
    await benchmark("startup.check", () => runCli(["--check"])),
    await benchmark("suggestions.static", async () => void (await runtime.getSuggestions("git sta", process.cwd(), shell))),
    await benchmark("suggestions.filesystem", async () => void (await runtime.getSuggestions("source shell/", process.cwd(), shell))),
    await benchmark("suggestions.root-prefix", async () => void (await runtime.getSuggestions("gi", process.cwd(), shell))),
  ];

  loopDelay.disable();
  const cpu = process.cpuUsage(initialCpu);
  const memory = process.memoryUsage();
  process.stdout.write(
    `${JSON.stringify(
      {
        platform: process.platform,
        architecture: process.arch,
        node: process.version,
        results,
        cpuMilliseconds: {
          user: cpu.user / 1_000,
          system: cpu.system / 1_000,
        },
        eventLoopDelayMilliseconds: {
          mean: Number(loopDelay.mean) / 1_000_000,
          p95: Number(loopDelay.percentile(95)) / 1_000_000,
          max: Number(loopDelay.max) / 1_000_000,
        },
        memoryBytes: {
          heapUsed: memory.heapUsed,
          rss: memory.rss,
        },
      },
      null,
      2,
    )}\n`,
  );
};

await main();
