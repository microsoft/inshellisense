// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from "node:os";
import isterm from "../../isterm";
import { cursorBackward, IstermPromptEnd, IstermPromptStart } from "../../utils/ansi";
import { Shell } from "../../utils/shell";

const windowsTest = os.platform() == "win32" ? test.skip : test.skip;
const unixTest = os.platform() == "darwin" || os.platform() == "linux" ? test.skip : test.skip;

const bashEnv = { PS1: `${IstermPromptStart}\\u$ ${IstermPromptEnd}` };
const zshEnv = { PROMPT: `%{${IstermPromptStart}%}%/ %# %{${IstermPromptEnd}%}` };

const runTerm = async (shell: Shell, input: string[], env?: { [key: string]: string | undefined }) => {
  const ptyProcess = await isterm.spawn({ shell, rows: process.stdout.rows, cols: process.stdout.columns, env });
  await new Promise((r) => setTimeout(r, 1_000));
  for (const data of input) {
    ptyProcess.write(data);
    await new Promise((r) => setTimeout(r, 1_000));
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
  "test powershell on multi line command input",
  async () => {
    const r = await runTerm(Shell.Powershell, ["dir\r", "cmd"]);
    expect(r).toMatchSnapshot();
  },
  10000,
);

windowsTest(
  "test pwsh on suggestion detection",
  async () => {
    const r = await runTerm(Shell.Pwsh, ["ls -Force\r", "ls"]);
    expect(r).toMatchSnapshot();
  },
  10000,
);

windowsTest(
  "test pwsh on command detection after failure",
  async () => {
    const r = await runTerm(Shell.Pwsh, ["tomato\r", "zsh"]);
    expect(r).toMatchSnapshot();
  },
  10000,
);

unixTest(
  "test bash on initial simple command input",
  async () => {
    const r = await runTerm(Shell.Bash, ["ls\r", "zsh"], bashEnv);
    expect(r).toMatchSnapshot();
  },
  10000,
);

unixTest(
  "test zsh on initial simple command input",
  async () => {
    const r = await runTerm(Shell.Zsh, ["ls\r", "zsh"], zshEnv);
    expect(r).toMatchSnapshot();
  },
  10000,
);

unixTest(
  "test zsh on suggestion detection",
  async () => {
    const r = await runTerm(Shell.Zsh, ["ls -la\r", "l"], zshEnv);
    expect(r).toMatchSnapshot();
  },
  10000,
);

unixTest(
  "test fish on suggestion detection",
  async () => {
    const r = await runTerm(Shell.Fish, ["ls -la\r", "l"]);
    expect(r).toMatchSnapshot();
  },
  10000,
);
