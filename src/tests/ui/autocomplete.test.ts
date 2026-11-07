// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { jest } from "@jest/globals";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { terminalSnapshot } from "@microsoft/tui-test/test";
import type { TuiTest } from "@microsoft/tui-test/test";
import { closeSession, configs, expectPrompt, expectText, returnChar, startSession } from "./helpers";
import { unpackResources } from "../../utils/node.js";

const accent = "#7d56f4";

jest.retryTimes(2, { logErrorsBeforeRetry: true });

describe("configured description layout", () => {
  let home: string;
  let terminal: TuiTest | undefined;

  beforeAll(async () => {
    home = await fs.mkdtemp(path.join(os.tmpdir(), "inshellisense-popup-"));
    const resources = path.join(home, ".inshellisense");
    await unpackResources(resources);
    const spec = {
      name: "git",
      subcommands: Array.from({ length: 5 }, (_, index) => ({
        name: `choice-${index}`,
        description: index === 0 ? "More information about this suggestion. ".repeat(10) + "Description complete" : "Short description",
      })),
    };
    await fs.writeFile(path.join(resources, "spec", "git.js"), `export default ${JSON.stringify(spec)};`);
  });

  afterEach(async () => {
    await closeSession(terminal);
    terminal = undefined;
  });

  afterAll(async () => {
    await fs.rm(home, { recursive: true, force: true });
  });

  const start = async (truncate: boolean, { cols = 120, rows = 30, maxSuggestions = 2, descriptionWidth = 24, descriptionHeight = 2, above = false } = {}) => {
    await fs.writeFile(
      path.join(home, ".inshellisenserc"),
      `maxSuggestions = ${maxSuggestions}\ndescriptionWidth = ${descriptionWidth}\ndescriptionHeight = ${descriptionHeight}\ntruncateDescriptions = ${truncate}\n`,
    );
    terminal = await startSession(
      {
        label: "bash-popup",
        shell: "bash",
        env: { HOME: home, USERPROFILE: home, XDG_CONFIG_HOME: path.join(home, ".config"), BASH_SILENCE_DEPRECATION_WARNING: "1" },
      },
      ["-T", "-s", "bash"],
      cols,
      rows,
    );
    if (above) {
      await terminal.type(`printf '\\033[2J\\033[${rows};1H'`);
      await expectText(terminal, "printf", { strict: false });
      await terminal.press("Enter");
      await expectText(terminal, "printf", { not: true });
      await expectPrompt(terminal);
    }
    await terminal.type("git ");
    await expectText(terminal, "choice-0");
    return terminal;
  };

  const snapshot = async (terminal: TuiTest, name: string) => {
    await terminal.waitIdle();
    const view = terminalSnapshot(await terminal.text());
    expect(view).toMatchSnapshot(name);
    return view;
  };

  test("honors configured dimensions when truncation is enabled", async () => {
    const terminal = await start(true);
    await expectText(terminal, "…");
    await expectText(terminal, "choice-1");
    await expectText(terminal, "choice-2", { not: true });
    await expectText(terminal, "Description complete", { not: true });
    const rows = (await snapshot(terminal, "two suggestions and two description rows")).split("\n");
    expect(rows.filter((row) => row.includes("│"))).toHaveLength(2);
    expect(rows.find((row) => row.includes("┌"))?.trim()).toBe(`┌${"─".repeat(38)}┐┌${"─".repeat(22)}┐`);
  });

  test("honors larger configured suggestion and description heights", async () => {
    const terminal = await start(true, { maxSuggestions: 4, descriptionWidth: 45, descriptionHeight: 6 });
    await expectText(terminal, "choice-3");
    await expectText(terminal, "choice-4", { not: true });
    await expectText(terminal, "…");
    await expectText(terminal, "Description complete", { not: true });

    const rows = (await snapshot(terminal, "four suggestions and six description rows")).split("\n");
    expect(rows.filter((row) => row.includes("│"))).toHaveLength(6);
    expect(rows.find((row) => row.includes("┌"))?.trim()).toBe(`┌${"─".repeat(38)}┐┌${"─".repeat(43)}┐`);
  });

  test.each([
    { scenario: "width-limited side-by-side growth", cols: 80, rows: 30, truncated: false },
    { scenario: "height-limited side-by-side growth", cols: 120, rows: 10, truncated: false },
    { scenario: "width-limited stacked growth", cols: 60, rows: 30, truncated: false },
    { scenario: "truncation after exhausting both dimensions", cols: 80, rows: 8, truncated: true },
  ])("$scenario", async ({ cols, rows, truncated }) => {
    const terminal = await start(false, { cols, rows });
    await expectText(terminal, "Description complete", { not: truncated });
    await expectText(terminal, "…", { not: !truncated });
    await expectText(terminal, "choice-2", { not: true });
    const view = await snapshot(terminal, `${cols}x${rows} terminal`);
    const popupRows = view.split("\n").filter((row) => /[┌│└]/u.test(row));

    if (cols <= 80) expect(Math.max(...popupRows.map((row) => row.trimEnd().length))).toBe(cols);
    if (rows <= 10) expect(popupRows).toHaveLength(rows - 2);
    expect(popupRows.filter((row) => row.includes("┌"))).toHaveLength(cols < 64 ? 2 : 1);
  });

  test("expands above the cursor near the bottom of the terminal", async () => {
    const terminal = await start(false, { rows: 14, above: true });
    await expectText(terminal, "Description complete");
    await expectText(terminal, "…", { not: true });
    const view = await snapshot(terminal, "expanded description above the prompt");

    expect(view.indexOf("choice-0")).toBeLessThan(view.lastIndexOf("> git"));
    expect(view.indexOf("Description complete")).toBeLessThan(view.lastIndexOf("> git"));
  });

  test("expands, truncates on resize, and clears the expanded description on selection changes", async () => {
    const terminal = await start(false);
    await expectText(terminal, "Description complete");
    await expectText(terminal, "…", { not: true });
    await expectText(terminal, "choice-2", { not: true });
    const expanded = await snapshot(terminal, "proportional expansion at 120x30");

    await terminal.resize(21, 12);
    await expectText(terminal, "…");
    await expectText(terminal, "Description complete", { not: true });
    await snapshot(terminal, "stacked truncation at 21x12");
    await terminal.resize(120, 30);
    await expectText(terminal, "Description complete");
    await terminal.waitIdle();
    expect(terminalSnapshot(await terminal.text())).toBe(expanded);

    await terminal.press("Down");
    await expectText(terminal, "Short description");
    await expectText(terminal, "More information", { not: true });
    await expectText(terminal, "Description complete", { not: true });
    await snapshot(terminal, "short description after selection changes");
  });
});

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
    await expectText(terminal, "stage");
    await terminal.waitIdle();
    const initialView = terminalSnapshot(await terminal.text());
    expect(initialView).toMatchSnapshot("initial 80 column view");

    await terminal.resize(40, 30);
    await expectText(terminal, "stage");
    await expectText(terminal, "Add file contents");
    await terminal.waitIdle();
    expect(terminalSnapshot(await terminal.text())).toMatchSnapshot("40 column view");

    await terminal.resize(21, 30);
    await expectText(terminal, "stage");
    await expectText(terminal, "Add file contents");
    await terminal.waitIdle();
    expect(terminalSnapshot(await terminal.text())).toMatchSnapshot("21 column view");

    await terminal.resize(21, 10);
    await expectText(terminal, "stage");
    await expectText(terminal, "…");
    await terminal.waitIdle();
    expect(terminalSnapshot(await terminal.text())).toMatchSnapshot("21 columns with a truncated description");

    await terminal.resize(21, 9);
    await expectText(terminal, "stage");
    await expectText(terminal, "Add file contents", { not: true });
    await terminal.waitIdle();
    const threeSuggestions = terminalSnapshot(await terminal.text());
    expect(threeSuggestions).toMatchSnapshot("21 columns without room for a description");

    await terminal.resize(21, 6);
    await terminal.waitIdle();
    await expectText(terminal, "stage");
    await expectText(terminal, "status");
    await expectText(terminal, "stash", { not: true });
    expect(terminalSnapshot(await terminal.text())).toMatchSnapshot("21 columns with two suggestions");

    await terminal.resize(21, 9);
    await expectText(terminal, "stash");
    await terminal.waitIdle();
    expect(terminalSnapshot(await terminal.text())).toBe(threeSuggestions);

    await terminal.resize(80, 30);
    await terminal.waitIdle();
    await expectText(terminal, "stage");
    const restoredView = terminalSnapshot(await terminal.text());
    expect(restoredView).toMatchSnapshot("restored 80 column view");
    expect(restoredView).toBe(initialView);
  });

  test("keeps selection usable when a short menu appears above the cursor", async () => {
    await terminal.resize(21, 12);
    await terminal.write("\r".repeat(12));
    await expectPrompt(terminal);
    await terminal.type("git st");
    await expectText(terminal, "stash");
    await terminal.waitIdle();

    await terminal.resize(21, 7);
    await terminal.waitIdle();
    await expectText(terminal, "stage");
    await expectText(terminal, "status");
    const view = terminalSnapshot(await terminal.text());
    expect(view.indexOf("stage")).toBeLessThan(view.lastIndexOf("> git st"));

    await terminal.press("Down");
    await terminal.waitIdle();
    await terminal.press("Tab");
    await expectText(terminal, "> git status", { strict: false });
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

      await expectText(terminal, "blame");
      await expectText(terminal, "archive", { strict: false, bg: accent });
    });

    test("cursor up when at top of list", async () => {
      await terminal.type("git ");

      await expectText(terminal, "archive", { strict: false, bg: accent });
      await terminal.press("Up");
      await expectText(terminal, "archive", { strict: false, bg: accent });
    });

    test("move cursor backwards to hide suggestions", async () => {
      await terminal.type("git ");

      await expectText(terminal, "archive", { strict: false });

      await terminal.press("Left");
      await expectText(terminal, "archive", { strict: false, not: true });
    });

    test("cursor down when at top of list", async () => {
      await terminal.type("git ");

      await expectText(terminal, "archive", { strict: false });
      await terminal.waitIdle();
      await terminal.press("Down", "Down");

      await expectText(terminal, "repository");
      await expectText(terminal, "commit", { bg: accent });
      await expectText(terminal, "archive", { strict: false, bg: accent, not: true });
    });

    test("scroll down a full page when at top of list", async () => {
      await terminal.type("git ");

      await expectText(terminal, "archive", { strict: false });
      await terminal.waitIdle();
      await terminal.press("Down", "Down", "Down", "Down", "Down");

      await expectText(terminal, "archive", { strict: false, not: true });
      await expectText(terminal, "add", { bg: accent });
    });

    // excluding cmd since it doesn't support CWD tracking
    (config.shell !== "cmd" ? test : test.skip)("generator results lead suggestions", async () => {
      await terminal.type("ls ");

      await expectText(terminal, "📄", { strict: false });
    });

    test("tab completion", async () => {
      await terminal.type("git ");

      await expectText(terminal, "archive", { strict: false });
      await terminal.press("Tab");

      await expectText(terminal, "--format");
    });

    test("backspacing after accepting tab completion", async () => {
      await terminal.type("git  ");

      await expectText(terminal, "archive", { strict: false });
      await terminal.press("Tab");

      await expectText(terminal, "--format");
      await terminal.press("Backspace", "Backspace", "Backspace");

      await expectText(terminal, "archive", { strict: false });
    });

    test("suggestion cursor resets between views", async () => {
      await terminal.type("git ");

      await expectText(terminal, "archive", { strict: false });
      await terminal.waitIdle();
      await terminal.press("Down", "Down");

      await expectText(terminal, "repository");
      await expectText(terminal, "commit", { bg: accent });

      await terminal.press("Backspace");
      await expectText(terminal, "repository", { not: true });

      await terminal.type(" ");
      await expectText(terminal, "archive", { strict: false, bg: accent });
    });

    test("ui on bottom of the screen", async () => {
      await terminal.resize(80, 10);
      await terminal.write(rc.repeat(10));
      await expectPrompt(terminal);

      await terminal.type("git  ");
      await expectText(terminal, "archive", { strict: false });
    });

    test("command detection after command execution", async () => {
      await terminal.write(`echo "hello"${rc}`);
      await expectText(terminal, "hello", { strict: false });
      await expectPrompt(terminal);

      await terminal.type("git ");
      await expectText(terminal, "archive", { strict: false });
    });

    test("suggestions clear after command execution", async () => {
      await terminal.type("git ");
      await expectText(terminal, "archive", { strict: false });

      await terminal.write(rc);
      await expectText(terminal, "archive", { strict: false, not: true });
    });

    test("cursor-position reports are not treated as input", async () => {
      await terminal.write("\u001B[2;7R");
      await terminal.waitIdle();
      await expectText(terminal, "[2;7R", { not: true });

      await terminal.type("git ");
      await expectText(terminal, "archive", { strict: false });
    });

    test.skip("access history when no suggestions exist", async () => {
      await terminal.type("clear");
      await expectText(terminal, "clear");

      await terminal.write(rc);
      await expectText(terminal, "clear", { not: true });

      await terminal.press("Up");
      await expectText(terminal, "clear");
    });

    test("proper overflow truncation in command", async () => {
      await terminal.type("dotnet add package Holoon.Newtonsoft");
      await expectText(terminal, "CanBeUndefi…│");
    });

    test.skip("command detection with suggestions", async () => {
      await terminal.write(`dotnet add item${rc}`);
      await expectText(terminal, "dotnet", { strict: false });

      await terminal.write(`clear${rc}`);
      await expectText(terminal, "dotnet", { strict: false, not: true });

      await terminal.type("dotnet add ");
      await expectText(terminal, "item");
      await expectText(terminal, "package", { strict: false });
    });
  });
});
