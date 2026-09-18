// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from "node:os";
import { fileURLToPath } from "node:url";
import type { TuiTest } from "@microsoft/tui-test/test";
import { closeSession, expectPrompt, startSession } from "./helpers";

const shell = os.platform() === "win32" ? "cmd" : "bash";
const fixture = fileURLToPath(new URL("../fixtures/alternate-screen.cjs", import.meta.url));

describe("alternate-screen input", () => {
  let terminal: TuiTest;

  beforeEach(async () => {
    terminal = await startSession({ label: "alternate-screen-input", shell }, ["-T", "-s", shell]);
  });

  afterEach(async () => {
    await closeSession(terminal);
  });

  test("forwards Escape promptly and restores suggestion bindings after the TUI exits", async () => {
    await terminal.submit(`node "${fixture}"`);
    await terminal.expectText("ALTERNATE SCREEN READY");

    // The app times two bytes sent together, excluding test-driver and process-startup latency.
    await terminal.write("s\u001B");
    await terminal.expectText("ESCAPE RECEIVED \\d+ms", { regex: true });
    const latency = (await terminal.text()).match(/ESCAPE RECEIVED (\d+)ms/);
    expect(latency).not.toBeNull();
    expect(Number(latency![1])).toBeLessThan(250);

    await terminal.type("q");
    await expectPrompt(terminal);
    await terminal.type("git ");
    await terminal.expectText("archive", { strict: false, bg: "#7d56f4" });
    await terminal.waitIdle();
    await terminal.press("Down");
    await terminal.expectText("blame", { bg: "#7d56f4" });
    await terminal.press("Escape");
    await terminal.expectText("archive", { strict: false, not: true });
  });
});
