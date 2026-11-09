// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { jest } from "@jest/globals";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import childProcess from "node:child_process";

const shell = await import("../../utils/shell.js");
const gitBashPath = jest.fn<typeof shell.gitBashPath>();
const spawn = jest.fn<(command: string, args: readonly string[], options?: childProcess.SpawnOptions) => childProcess.ChildProcess>();
jest.unstable_mockModule("node:child_process", () => ({ ...childProcess, spawn }));
jest.unstable_mockModule("../../utils/shell.js", () => ({ ...shell, gitBashPath }));

const { buildExecuteShellCommand } = await import("../../runtime/utils.js");

const createChild = () => {
  const child = Object.assign(new EventEmitter(), {
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    kill: jest.fn(() => {
      child.emit("exit", null, "SIGKILL");
      return true;
    }),
  });
  spawn.mockImplementation((_command, _args, options) => {
    options?.signal?.addEventListener("abort", () => {
      child.kill();
      child.emit("error", new DOMException("The operation was aborted", "AbortError"));
    });
    return child as unknown as childProcess.ChildProcess;
  });
  return child;
};

beforeEach(() => {
  jest.useFakeTimers();
  gitBashPath.mockReset().mockResolvedValue("bash");
  spawn.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

test("preserves captured output and the exit status after pipes close normally", async () => {
  const child = createChild();
  const request = buildExecuteShellCommand(100)({ command: "git", args: ["help", "-a"] });
  await jest.advanceTimersByTimeAsync(0);
  child.stdout.write("commands");
  child.stderr.write("warning");
  child.emit("exit", 7);
  child.stdout.write(" complete");
  child.emit("close", 7);

  await expect(request).resolves.toEqual({ status: 7, stdout: "commands complete", stderr: "warning" });
  expect(child.kill).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});

test("settles cancellation even when a descendant keeps the pipes open", async () => {
  const child = createChild();
  const controller = new AbortController();
  let error: unknown;
  const request = buildExecuteShellCommand(
    100,
    controller.signal,
  )({ command: "git", args: ["help", "-a"] }).catch((value) => {
    error = value;
  });
  await jest.advanceTimersByTimeAsync(0);

  controller.abort();
  await jest.advanceTimersByTimeAsync(0);

  expect(error).toMatchObject({ name: "AbortError" });
  expect([child.stdin, child.stdout, child.stderr].every((stream) => stream.destroyed)).toBe(true);
  expect(jest.getTimerCount()).toBe(0);
  await request;
});

test("settles a timeout with a failure status even when killing the shell does not close its pipes", async () => {
  const child = createChild();
  let result: Fig.ExecuteCommandOutput | undefined;
  const request = buildExecuteShellCommand(100)({ command: "git", args: ["help", "-a"] }).then((value) => {
    result = value;
  });
  await jest.advanceTimersByTimeAsync(0);
  child.stdout.write("partial output");
  child.stderr.write("warning");

  await jest.advanceTimersByTimeAsync(100);

  expect(result).toEqual({ status: 1, stdout: "partial output", stderr: "warning" });
  expect(child.kill).toHaveBeenCalled();
  expect([child.stdin, child.stdout, child.stderr].every((stream) => stream.destroyed)).toBe(true);
  expect(jest.getTimerCount()).toBe(0);
  await request;
});

(process.platform === "win32" ? test : test.skip)("does not spawn a command aborted while resolving Git Bash", async () => {
  let resolve!: (path: string) => void;
  gitBashPath.mockImplementation(
    () =>
      new Promise((resolvePromise) => {
        resolve = resolvePromise;
      }),
  );
  createChild();
  const controller = new AbortController();
  let error: unknown;
  const request = buildExecuteShellCommand(
    100,
    controller.signal,
  )({ command: "git", args: ["help", "-a"] }).catch((value) => {
    error = value;
  });
  controller.abort();
  resolve("bash");
  await jest.advanceTimersByTimeAsync(0);

  expect(spawn).not.toHaveBeenCalled();
  expect(error).toMatchObject({ name: "AbortError" });
  await request;
});
