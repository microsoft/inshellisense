// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { jest } from "@jest/globals";
import { terminalSnapshot } from "@microsoft/tui-test/test";
import type { TuiTest } from "@microsoft/tui-test/test";
import { closeSession, configs, expectPrompt, returnChar, startSession } from "./helpers";

const accent = "#7d56f4";

jest.retryTimes(2, { logErrorsBeforeRetry: true });

describe("resize recovery", () => {
  let terminal: TuiTest;
  beforeEach(async () => {
    terminal = await startSession({ label: "bash-resize", shell: "bash", env: { BASH_SILENCE_DEPRECATION_WARNING: "1" } }, ["-T", "-s", "bash"]);
  });
  afterEach(async () => {
    await closeSession(terminal);
  });

  test("restores input and suggestions after becoming too narrow", async () => {
    await terminal.type("git st");
    await terminal.expectText("stage");
    await terminal.waitIdle();
    const initialView = terminalSnapshot(await terminal.text());
    expect(initialView).toMatchSnapshot("initial 80 column view");

    await terminal.resize(40, 30);
    await terminal.expectText("┘", { not: true });
    expect(terminalSnapshot(await terminal.text())).toMatchSnapshot("40 column view");

    await terminal.resize(21, 30);
    await terminal.expectText("┘", { not: true });
    expect(terminalSnapshot(await terminal.text())).toMatchSnapshot("21 column view");

    await terminal.resize(80, 30);
    await terminal.waitIdle();
    await terminal.expectText("stage");
    const restoredView = terminalSnapshot(await terminal.text());
    expect(restoredView).toMatchSnapshot("restored 80 column view");
    expect(restoredView).toBe(initialView);
  });
});

configs.map((config) => {
  const rc = returnChar(config.shell);
  const args = ["-V", "-T", "-s", config.shell];
  describe(`[${config.label}]`, () => {
    let terminal: TuiTest;
    beforeEach(async () => {
      terminal = await startSession(config, args);
    });
    afterEach(async () => {
      await closeSession(terminal);
    });

    test("basic git suggestions", async () => {
      await terminal.type("git ");

      await terminal.expectText("blame");
      await terminal.expectText("archive", { strict: false, bg: accent });
    });

    test("cursor up when at top of list", async () => {
      await terminal.type("git ");

      await terminal.expectText("archive", { strict: false, bg: accent });
      await terminal.press("Up");
      await terminal.expectText("archive", { strict: false, bg: accent });
    });

    test("move cursor backwards to hide suggestions", async () => {
      await terminal.type("git ");

      await terminal.expectText("archive", { strict: false });

      await terminal.press("Left");
      await terminal.expectText("archive", { strict: false, not: true });
    });

    test("cursor down when at top of list", async () => {
      await terminal.type("git ");

      await terminal.expectText("archive", { strict: false });
      await terminal.waitIdle();
      await terminal.press("Down", "Down");

      await terminal.expectText("repository");
      await terminal.expectText("commit", { bg: accent });
      await terminal.expectText("archive", { strict: false, bg: accent, not: true });
    });

    test("scroll down a full page when at top of list", async () => {
      await terminal.type("git ");

      await terminal.expectText("archive", { strict: false });
      await terminal.waitIdle();
      await terminal.press("Down", "Down", "Down", "Down", "Down");

      await terminal.expectText("archive", { strict: false, not: true });
      await terminal.expectText("add", { bg: accent });
    });

    // excluding cmd since it doesn't support CWD tracking
    (config.shell !== "cmd" ? test : test.skip)("generator results lead suggestions", async () => {
      await terminal.type("ls ");

      await terminal.expectText("📄", { strict: false });
    });

    test("tab completion", async () => {
      await terminal.type("git ");

      await terminal.expectText("archive", { strict: false });
      await terminal.press("Tab");

      await terminal.expectText("--format");
    });

    test("backspacing after accepting tab completion", async () => {
      await terminal.type("git  ");

      await terminal.expectText("archive", { strict: false });
      await terminal.press("Tab");

      await terminal.expectText("--format");
      await terminal.press("Backspace", "Backspace", "Backspace");

      await terminal.expectText("archive", { strict: false });
    });

    test("suggestion cursor resets between views", async () => {
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
      await terminal.resize(80, 10);
      await terminal.write(rc.repeat(10));
      await expectPrompt(terminal);

      await terminal.type("git  ");
      await terminal.expectText("archive", { strict: false });
    });

    test("command detection after command execution", async () => {
      await terminal.write(`echo "hello"${rc}`);
      await terminal.expectText("hello", { strict: false });
      await expectPrompt(terminal);

      await terminal.type("git ");
      await terminal.expectText("archive", { strict: false });
    });

    test("suggestions clear after command execution", async () => {
      await terminal.type("git ");
      await terminal.expectText("archive", { strict: false });

      await terminal.write(rc);
      await terminal.expectText("archive", { strict: false, not: true });
    });

    test("cursor-position reports are not treated as input", async () => {
      await terminal.write("\u001B[2;7R");
      await terminal.waitIdle();
      await terminal.expectText("[2;7R", { not: true });

      await terminal.type("git ");
      await terminal.expectText("archive", { strict: false });
    });

    test.skip("access history when no suggestions exist", async () => {
      await terminal.type("clear");
      await terminal.expectText("clear");

      await terminal.write(rc);
      await terminal.expectText("clear", { not: true });

      await terminal.press("Up");
      await terminal.expectText("clear");
    });

    test("proper overflow truncation in command", async () => {
      await terminal.type("dotnet add package Holoon.Newtonsoft");
      await terminal.expectText("CanBeUndefi…│");
    });

    test.skip("command detection with suggestions", async () => {
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
