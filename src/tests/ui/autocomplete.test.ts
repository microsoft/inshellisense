// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { test, expect, Shell } from "@microsoft/tui-test";
import os from "node:os";

const windowsShells = [Shell.Cmd, Shell.Powershell, Shell.WindowsPowershell, Shell.Xonsh];
const unixShells = [Shell.Bash, Shell.Fish, Shell.Zsh];
const shells = os.platform() == "win32" ? windowsShells : unixShells;

shells.map((activeShell) => {
  const returnChar = activeShell == "xonsh" ? "\n" : "\r";
  test.describe(`[${activeShell}]`, () => {
    test.use({ program: { file: "is", args: ["-V", "-T", "-s", activeShell] } });

    test("basic git suggestions", async ({ terminal }) => {
      await expect(terminal.getByText(">  ")).toBeVisible();
      terminal.write("git ");

      await expect(terminal.getByText("blame")).toBeVisible();
      await expect(terminal.getByText("archive", { strict: false })).toHaveBgColor("7d56f4");
    });

    test("cursor up when at top of list", async ({ terminal }) => {
      await expect(terminal.getByText(">  ")).toBeVisible();
      terminal.write("git ");

      await expect(terminal.getByText("archive", { strict: false })).toHaveBgColor("7d56f4");
      terminal.keyUp();
      await expect(terminal.getByText("archive", { strict: false })).toHaveBgColor("7d56f4");
    });

    test("move cursor backwards to hide suggestions", async ({ terminal }) => {
      await expect(terminal.getByText(">  ")).toBeVisible();
      terminal.write("git ");

      await expect(terminal.getByText("archive", { strict: false })).toBeVisible();

      terminal.keyLeft();
      await expect(terminal.getByText("archive", { strict: false })).not.toBeVisible();
    });

    test("cursor down when at top of list", async ({ terminal }) => {
      await expect(terminal.getByText(">  ")).toBeVisible();
      terminal.write("git ");

      await expect(terminal.getByText("archive", { strict: false })).toBeVisible();
      terminal.keyDown(2);

      await expect(terminal.getByText("repository")).toBeVisible();
      await expect(terminal.getByText("commit")).toHaveBgColor("7d56f4");
      await expect(terminal.getByText("archive", { strict: false })).not.toHaveBgColor("7d56f4");
    });

    test("scroll down a full page when at top of list", async ({ terminal }) => {
      await expect(terminal.getByText(">  ")).toBeVisible();
      terminal.write("git ");

      await expect(terminal.getByText("archive", { strict: false })).toBeVisible();
      terminal.keyDown(5);

      await expect(terminal.getByText("archive", { strict: false })).not.toBeVisible();
      await expect(terminal.getByText("add")).toHaveBgColor("7d56f4");
    });

    // excluding cmd since it doesn't support CWD tracking
    test.when(activeShell !== Shell.Cmd, "generator results lead suggestions", async ({ terminal }) => {
      await expect(terminal.getByText(">  ")).toBeVisible();
      terminal.write("ls ");

      await expect(terminal.getByText("📄", { strict: false })).toBeVisible();
    });

    test("tab completion", async ({ terminal }) => {
      await expect(terminal.getByText(">  ")).toBeVisible();
      terminal.write("git ");

      await expect(terminal.getByText("archive", { strict: false })).toBeVisible();
      terminal.write("\t");

      await expect(terminal.getByText("--format")).toBeVisible();
    });

    test("backspacing after accepting tab completion", async ({ terminal }) => {
      await expect(terminal.getByText(">  ")).toBeVisible();
      terminal.write("git  ");

      await expect(terminal.getByText("archive", { strict: false })).toBeVisible();
      terminal.write("\t");

      await expect(terminal.getByText("--format")).toBeVisible();
      terminal.keyBackspace(3);

      await expect(terminal.getByText("archive", { strict: false })).toBeVisible();
    });

    test("suggestion cursor resets between views", async ({ terminal }) => {
      await expect(terminal.getByText(">  ")).toBeVisible();
      terminal.write("git ");

      await expect(terminal.getByText("archive", { strict: false })).toBeVisible();
      terminal.keyDown(2);

      await expect(terminal.getByText("repository")).toBeVisible();
      await expect(terminal.getByText("commit")).toHaveBgColor("7d56f4");

      terminal.keyBackspace(1);
      await expect(terminal.getByText("repository")).not.toBeVisible();

      terminal.write(" ");
      await expect(terminal.getByText("archive", { strict: false })).toHaveBgColor("7d56f4");
    });

    test("ui on bottom of the screen", async ({ terminal }) => {
      await expect(terminal.getByText(">  ")).toBeVisible();
      terminal.resize(80, 10);
      terminal.write(returnChar.repeat(10));

      terminal.write("git  ");
      await expect(terminal.getByText("archive", { strict: false })).toBeVisible();
    });

    test("command detection after command execution", async ({ terminal }) => {
      await expect(terminal.getByText(">  ")).toBeVisible();

      terminal.write(`echo "hello"${returnChar}`);
      await expect(terminal.getByText("hello", { strict: false })).toBeVisible();

      terminal.write("git ");
      await expect(terminal.getByText("archive", { strict: false })).toBeVisible();
    });

    test("suggestions clear after command execution", async ({ terminal }) => {
      await expect(terminal.getByText(">  ")).toBeVisible();

      terminal.write("git ");
      await expect(terminal.getByText("archive", { strict: false })).toBeVisible();

      terminal.write(returnChar);
      await expect(terminal.getByText("archive", { strict: false })).not.toBeVisible();
    });

    test("access history when no suggestions exist", async ({ terminal }) => {
      await expect(terminal.getByText(">  ")).toBeVisible();

      terminal.write("clear");
      await expect(terminal.getByText("clear")).toBeVisible();

      terminal.write(returnChar);
      await expect(terminal.getByText("clear")).not.toBeVisible();

      terminal.keyUp();
      await expect(terminal.getByText("clear")).toBeVisible();
    });

    test("proper overflow truncation in command", async ({ terminal }) => {
      await expect(terminal.getByText(">  ")).toBeVisible();

      terminal.write("dotnet add package Holoon.Newtonsoft");
      await expect(terminal.getByText("CanBeUndefi…│")).toBeVisible();
    });

    test.skip("command detection with suggestions", async ({ terminal }) => {
      await expect(terminal.getByText(">  ")).toBeVisible();

      terminal.write(`dotnet add item${returnChar}`);
      await expect(terminal.getByText("dotnet", { strict: false })).toBeVisible();

      terminal.write(`clear${returnChar}`);
      await expect(terminal.getByText("dotnet", { strict: false })).not.toBeVisible();

      terminal.write("dotnet add ");
      await expect(terminal.getByText("item")).toBeVisible();
      await expect(terminal.getByText("package", { strict: false })).toBeVisible();
    });
  });
});
