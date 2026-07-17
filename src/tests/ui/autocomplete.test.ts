// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { jest } from "@jest/globals";
import { ShellUse } from "@microsoft/shell-use";
import { configs, returnChar, startSession } from "./helpers";

const accent = "#7d56f4";

if (process.platform === "win32") {
  jest.retryTimes(2);
}

configs.map((config) => {
  const rc = returnChar(config.shell);
  const args = ["-V", "-T", "-s", config.shell];
  describe(`[${config.label}]`, () => {
    let terminal: ShellUse;
    beforeEach(async () => {
      terminal = await startSession(config, args);
    });
    afterEach(async () => {
      await terminal.close();
    });

    test("basic git suggestions", async () => {
      await terminal.expectText(">  ");
      await terminal.type("git ");

      await terminal.expectText("blame");
      await terminal.expectText("archive", { strict: false, bg: accent });
    });

    test("cursor up when at top of list", async () => {
      await terminal.expectText(">  ");
      await terminal.type("git ");

      await terminal.expectText("archive", { strict: false, bg: accent });
      await terminal.press("Up");
      await terminal.expectText("archive", { strict: false, bg: accent });
    });

    test("move cursor backwards to hide suggestions", async () => {
      await terminal.expectText(">  ");
      await terminal.type("git ");

      await terminal.expectText("archive", { strict: false });

      await terminal.press("Left");
      await terminal.expectText("archive", { strict: false, not: true });
    }, 15_000);

    test("cursor down when at top of list", async () => {
      await terminal.expectText(">  ");
      await terminal.type("git ");

      await terminal.expectText("archive", { strict: false });
      await terminal.waitIdle();
      await terminal.press("Down", "Down");

      await terminal.expectText("repository");
      await terminal.expectText("commit", { bg: accent });
      await terminal.expectText("archive", { strict: false, bg: accent, not: true });
    });

    test("scroll down a full page when at top of list", async () => {
      await terminal.expectText(">  ");
      await terminal.type("git ");

      await terminal.expectText("archive", { strict: false });
      await terminal.waitIdle();
      await terminal.press("Down", "Down", "Down", "Down", "Down");

      await terminal.expectText("archive", { strict: false, not: true });
      await terminal.expectText("add", { bg: accent });
    });

    // excluding cmd since it doesn't support CWD tracking
    (config.shell !== "cmd" ? test : test.skip)("generator results lead suggestions", async () => {
      await terminal.expectText(">  ");
      await terminal.type("ls ");

      await terminal.expectText("📄", { strict: false });
    });

    test("tab completion", async () => {
      await terminal.expectText(">  ");
      await terminal.type("git ");

      await terminal.expectText("archive", { strict: false });
      await terminal.press("Tab");

      await terminal.expectText("--format");
    });

    test("backspacing after accepting tab completion", async () => {
      await terminal.expectText(">  ");
      await terminal.type("git  ");

      await terminal.expectText("archive", { strict: false });
      await terminal.press("Tab");

      await terminal.expectText("--format");
      await terminal.press("Backspace", "Backspace", "Backspace");

      await terminal.expectText("archive", { strict: false });
    });

    test("suggestion cursor resets between views", async () => {
      await terminal.expectText(">  ");
      await terminal.type("git ");

      await terminal.expectText("archive", { strict: false });
      await terminal.waitIdle();
      await terminal.press("Down", "Down");

      await terminal.expectText("repository");
      await terminal.expectText("commit", { bg: accent });

      await terminal.press("Backspace");
      await terminal.expectText("repository", { not: true });

      await terminal.type(" ");
      await terminal.expectText("archive", { strict: false, bg: accent });
    });

    test("ui on bottom of the screen", async () => {
      await terminal.expectText(">  ");
      await terminal.resize(80, 10);
      await terminal.write(rc.repeat(10));
      await terminal.expectText(">  ");

      await terminal.type("git  ");
      await terminal.expectText("archive", { strict: false });
    });

    test("command detection after command execution", async () => {
      await terminal.expectText(">  ");

      await terminal.write(`echo "hello"${rc}`);
      await terminal.expectText("hello", { strict: false });
      await terminal.expectText(">  ");

      await terminal.type("git ");
      await terminal.expectText("archive", { strict: false });
    });

    test("suggestions clear after command execution", async () => {
      await terminal.expectText(">  ");

      await terminal.type("git ");
      await terminal.expectText("archive", { strict: false });

      await terminal.write(rc);
      await terminal.expectText("archive", { strict: false, not: true });
    });

    test.skip("access history when no suggestions exist", async () => {
      await terminal.expectText(">  ");

      await terminal.type("clear");
      await terminal.expectText("clear");

      await terminal.write(rc);
      await terminal.expectText("clear", { not: true });

      await terminal.press("Up");
      await terminal.expectText("clear");
    });

    test("proper overflow truncation in command", async () => {
      await terminal.expectText(">  ");

      await terminal.type("dotnet add package Holoon.Newtonsoft");
      await terminal.expectText("CanBeUndefi…│");
    });

    test.skip("command detection with suggestions", async () => {
      await terminal.expectText(">  ");

      await terminal.write(`dotnet add item${rc}`);
      await terminal.expectText("dotnet", { strict: false });

      await terminal.write(`clear${rc}`);
      await terminal.expectText("dotnet", { strict: false, not: true });

      await terminal.type("dotnet add ");
      await terminal.expectText("item");
      await terminal.expectText("package", { strict: false });
    });
  });
});
