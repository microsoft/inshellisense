// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from "node:os";
import { ShellUse } from "@microsoft/shell-use";
import { startSession } from "./helpers";

const shell = os.platform() == "darwin" ? "zsh" : os.platform() == "linux" ? "bash" : "powershell";

describe("status checks", () => {
  describe("inside inshellisense session", () => {
    let terminal: ShellUse;
    beforeEach(async () => {
      terminal = await startSession({ label: "status", shell }, ["-T", "-s", shell]);
    });
    afterEach(async () => {
      await terminal.close();
    });

    test("current status", async () => {
      await terminal.expectText(">  ", { timeout: 30_000 });

      await terminal.write("is -c\r");
      await terminal.expectText("live", { fg: "2" });
    });
  });

  describe("outside inshellisense session", () => {
    let terminal: ShellUse;
    beforeEach(async () => {
      terminal = new ShellUse(`is-e2e-status-outside-${process.pid}`);
      await terminal.open({ shell });
    });
    afterEach(async () => {
      await terminal.close();
    });

    test("current status", async () => {
      await terminal.write("is -c\r");
      await terminal.expectText("not found", { fg: "1" });
    });
  });
});
