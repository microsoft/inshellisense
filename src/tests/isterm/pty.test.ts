// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from "node:os";
import isterm from "../../isterm";
import { cursorBackward } from "../../utils/ansi";
import { Shell } from "../../utils/bindings";

const windowsTest = os.platform() == "win32" ? test : test.skip;

const runTerm = async (shell: Shell, input: string[], env?: { [key: string]: string | undefined }) => {
  const ptyProcess = isterm.spawn({ shell, rows: process.stdout.rows, cols: process.stdout.columns, env });
  await new Promise((r) => setTimeout(r, 1_000));
  for (const data of input) {
    ptyProcess.write(data);
    await new Promise((r) => setTimeout(r, 1_500));
  }
  const commandState = ptyProcess.getCommandState();
  const hasPromptText = commandState.promptText != null;
  delete commandState.promptText;
  return { ...commandState, hasPromptText };
};

windowsTest(
  "test cmd on initial simple command input",
  async () => {
    const r = await runTerm(Shell.Cmd, ["dir"]);
    expect(r).toMatchSnapshot();
  },
  10000,
);

windowsTest(
  "test cmd on initial simple command input with cursor movement backward",
  async () => {
    const r = await runTerm(Shell.Cmd, ["dir" + cursorBackward(1)]);
    expect(r).toMatchSnapshot();
  },
  10000,
);

windowsTest(
  "test cmd on multi line command input",
  async () => {
    const r = await runTerm(Shell.Cmd, ["dir\r", "cmd"]);
    expect(r).toMatchSnapshot();
  },
  10000,
);

windowsTest(
  "test powershell on suggestion detection",
  async () => {
    const r = await runTerm(Shell.Pwsh, ["ls -Force\r", "ls"]);
    expect(r).toMatchSnapshot();
  },
  10000,
);

windowsTest(
  "test powershell on command detection after failure",
  async () => {
    const r = await runTerm(Shell.Pwsh, ["tomato\r", "zsh"]);
    expect(r).toMatchSnapshot();
  },
  10000,
);
