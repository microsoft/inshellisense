// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { jest } from "@jest/globals";
import { setImmediate } from "node:timers/promises";
import * as shell from "../../utils/shell.js";

const mockCreateShellConfigs = jest.fn<typeof shell.createShellConfigs>();
const mockGetShellSourceCommand = jest.fn<typeof shell.getShellSourceCommand>();
const mockUnpackResources = jest.fn<() => Promise<void>>();
const mockRender = jest.fn<() => Promise<void>>();
const mockWriteError = jest.fn();

jest.unstable_mockModule("../../utils/shell.js", () => ({
  ...shell,
  createShellConfigs: mockCreateShellConfigs,
  getShellSourceCommand: mockGetShellSourceCommand,
}));

jest.unstable_mockModule("../../utils/node.js", () => ({
  unpackResources: mockUnpackResources,
}));

jest.unstable_mockModule("../../ui/ui-init.js", () => ({
  render: mockRender,
}));

const { default: init } = await import("../../commands/init.js");
init.exitOverride().configureOutput({ writeErr: mockWriteError });

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateShellConfigs.mockResolvedValue(undefined);
  mockGetShellSourceCommand.mockReturnValue("source init.zsh");
  mockUnpackResources.mockResolvedValue(undefined);
  mockRender.mockResolvedValue(undefined);
  jest.spyOn(process.stdout, "write").mockReturnValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test.each([
  { mode: "printing the source command", args: [shell.Shell.Zsh] },
  { mode: "starting the interactive UI", args: [] },
])("waits for resource extraction before $mode", async ({ args }) => {
  const extraction = deferred();
  mockUnpackResources.mockReturnValue(extraction.promise);

  const result = init.parseAsync(args, { from: "user" });
  await setImmediate();

  expect(mockCreateShellConfigs).toHaveBeenCalledTimes(1);
  expect(mockUnpackResources).toHaveBeenCalledTimes(1);
  expect(mockGetShellSourceCommand).not.toHaveBeenCalled();
  expect(process.stdout.write).not.toHaveBeenCalled();
  expect(mockRender).not.toHaveBeenCalled();

  extraction.resolve();
  await result;

  if (args.length > 0) {
    expect(mockGetShellSourceCommand).toHaveBeenCalledWith(shell.Shell.Zsh);
    expect(process.stdout.write).toHaveBeenCalledWith("\n\nsource init.zsh\n");
    expect(mockRender).not.toHaveBeenCalled();
  } else {
    expect(mockRender).toHaveBeenCalledTimes(1);
    expect(mockGetShellSourceCommand).not.toHaveBeenCalled();
    expect(process.stdout.write).not.toHaveBeenCalled();
  }
});

test("waits for resource extraction before reporting an unsupported shell", async () => {
  const extraction = deferred();
  mockUnpackResources.mockReturnValue(extraction.promise);

  const result = init.parseAsync(["unsupported"], { from: "user" });
  const failure = expect(result).rejects.toMatchObject({
    code: "commander.error",
    exitCode: 1,
    message: `Unsupported shell: 'unsupported', supported shells: ${shell.initSupportedShells.join(", ")}`,
  });
  await setImmediate();

  expect(mockUnpackResources).toHaveBeenCalledTimes(1);
  expect(mockWriteError).not.toHaveBeenCalled();

  extraction.resolve();
  await failure;

  expect(mockWriteError).toHaveBeenCalledTimes(1);
  expect(mockGetShellSourceCommand).not.toHaveBeenCalled();
  expect(process.stdout.write).not.toHaveBeenCalled();
  expect(mockRender).not.toHaveBeenCalled();
});

test.each([
  { mode: "a supported shell", args: [shell.Shell.Zsh] },
  { mode: "interactive initialization", args: [] },
  { mode: "an unsupported shell", args: ["unsupported"] },
])("reports extraction failures as CLI errors for $mode", async ({ args }) => {
  mockUnpackResources.mockRejectedValue(new Error("asset extraction failed"));

  await expect(init.parseAsync(args, { from: "user" })).rejects.toMatchObject({
    code: "commander.error",
    exitCode: 1,
    message: "Failed to unpack resources: asset extraction failed",
  });

  expect(mockWriteError).toHaveBeenCalledWith("Failed to unpack resources: asset extraction failed\n");
  expect(mockGetShellSourceCommand).not.toHaveBeenCalled();
  expect(process.stdout.write).not.toHaveBeenCalled();
  expect(mockRender).not.toHaveBeenCalled();
});
