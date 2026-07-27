// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from "node:fs";
import path from "node:path";

type Metric = {
  count: number;
  totalMilliseconds: number;
  maxMilliseconds: number;
};

const enabled = process.env.ISTERM_PERF === "1";
const outputPath = process.env.ISTERM_PERF_OUTPUT;
const startedAt = enabled ? process.hrtime.bigint() : undefined;
const initialCpuUsage = enabled ? process.cpuUsage() : undefined;
const metrics = new Map<string, Metric>();
const counters = new Map<string, number>();
let peakHeapUsed = 0;
let peakRss = 0;
let flushed = false;

const sampleMemory = () => {
  if (!enabled) return;
  const usage = process.memoryUsage();
  peakHeapUsed = Math.max(peakHeapUsed, usage.heapUsed);
  peakRss = Math.max(peakRss, usage.rss);
};

export const startTiming = (): bigint | undefined => (enabled ? process.hrtime.bigint() : undefined);

export const endTiming = (name: string, start: bigint | undefined): void => {
  if (start == null) return;
  const duration = Number(process.hrtime.bigint() - start) / 1_000_000;
  const metric = metrics.get(name) ?? { count: 0, totalMilliseconds: 0, maxMilliseconds: 0 };
  metric.count += 1;
  metric.totalMilliseconds += duration;
  metric.maxMilliseconds = Math.max(metric.maxMilliseconds, duration);
  metrics.set(name, metric);
  sampleMemory();
};

export const incrementMetric = (name: string, amount = 1): void => {
  if (!enabled) return;
  counters.set(name, (counters.get(name) ?? 0) + amount);
};

export const flushPerformanceMetrics = (): void => {
  if (!enabled || flushed || startedAt == null || initialCpuUsage == null) return;
  flushed = true;
  sampleMemory();

  const elapsedMilliseconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
  const cpuUsage = process.cpuUsage(initialCpuUsage);
  const report = {
    elapsedMilliseconds,
    cpuMilliseconds: {
      user: cpuUsage.user / 1_000,
      system: cpuUsage.system / 1_000,
    },
    peakMemoryBytes: {
      heapUsed: peakHeapUsed,
      rss: peakRss,
    },
    counters: Object.fromEntries(counters),
    metrics: Object.fromEntries(
      [...metrics.entries()].map(([name, metric]) => [
        name,
        {
          ...metric,
          averageMilliseconds: metric.count === 0 ? 0 : metric.totalMilliseconds / metric.count,
        },
      ]),
    ),
  };
  const output = JSON.stringify(report, null, 2);

  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output);
  } else {
    process.stderr.write(`${output}\n`);
  }
};

if (enabled) {
  process.once("exit", flushPerformanceMetrics);
}
