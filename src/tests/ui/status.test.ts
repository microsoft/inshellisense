// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from "node:os";
import { jest } from "@jest/globals";
import type { TuiTest } from "@microsoft/tui-test/test";
import type { Shell } from "@microsoft/tui-test";
import { closeSession, startSession, startShell } from "./helpers";

const shell: Shell = os.platform() == "darwin" ? "zsh" : os.platform() == "linux" ? "bash" : "powershell";

jest.retryTimes(2, { logErrorsBeforeRetry: true });

describe("status checks", () => {
  describe("inside inshellisense session", () => {
    let terminal: TuiTest;
    beforeEach(async () => {
      terminal = await startSession({ label: "status", shell }, ["-T", "-s", shell]);
    });
    afterEach(async () => {
      await closeSession(terminal);
    });

    test("current status", async () => {
      await terminal.write("is -c\r");
      await terminal.expectText("live", { fg: "2" });
    });
  });

  describe("outside inshellisense session", () => {
    let terminal: TuiTest;
    beforeEach(async () => {
      terminal = await startShell(shell);
    });
    afterEach(async () => {
      await closeSession(terminal);
    });

    test("current status", async () => {
      await terminal.write("is -c\r");
      await terminal.expectText("not found", { fg: "1" });
    });
  });
});
