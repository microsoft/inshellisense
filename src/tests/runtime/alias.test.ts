// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { jest } from "@jest/globals";
import { Shell } from "../../utils/shell";

const mockExecuteShellCommand = jest.fn();

jest.unstable_mockModule("../../runtime/utils.js", () => ({
  buildExecuteShellCommand: () => mockExecuteShellCommand,
}));

const { aliasExpand, loadAliases } = await import("../../runtime/alias.js");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("aliasExpand", () => {
  test("expand on bash aliases", async () => {
    //@ts-expect-error - jest.fn() has no implementation
    mockExecuteShellCommand.mockResolvedValue({
      stdout: `alias glo='git log --oneline'
alias la='echo '\\''lo'\\'' '\\''la'\\'''
alias ls='ls --color=auto'`,
      status: 0,
    });

    await loadAliases(Shell.Bash);
    expect(aliasExpand([{ token: "glo", complete: false, isOption: false }])).toMatchSnapshot();
    expect(aliasExpand([{ token: "la", complete: true, isOption: false }])).toMatchSnapshot();
    expect(aliasExpand([{ token: "git", complete: true, isOption: false }])).toMatchSnapshot();
    expect(aliasExpand([{ token: "ls", complete: true, isOption: false }])).toMatchSnapshot();
  });

  test("expand on zsh aliases", async () => {
    //@ts-expect-error - jest.fn() has no implementation
    mockExecuteShellCommand.mockResolvedValue({
      stdout: `glo='git log --oneline'
la='echo '\\''lo'\\'' '\\''la'\\'''
ls='ls --color=auto'`,
      status: 0,
    });

    await loadAliases(Shell.Zsh);
    expect(aliasExpand([{ token: "glo", complete: false, isOption: false }])).toMatchSnapshot();
    expect(aliasExpand([{ token: "la", complete: true, isOption: false }])).toMatchSnapshot();
    expect(aliasExpand([{ token: "git", complete: true, isOption: false }])).toMatchSnapshot();
    expect(aliasExpand([{ token: "ls", complete: true, isOption: false }])).toMatchSnapshot();
  });
});
