// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { jest } from "@jest/globals";
import { Shell } from "../../utils/shell";

const mockExecuteShellCommand = jest.fn();
const mockGetConfig = jest.fn();

jest.unstable_mockModule("../../runtime/utils.js", () => ({
  buildExecuteShellCommand: () => mockExecuteShellCommand,
  getShellWhitespaceEscapeChar: () => "\\",
}));

jest.unstable_mockModule("../../utils/config.js", () => ({
  getConfig: mockGetConfig,
}));

const { aliasExpand, loadAliases } = await import("../../runtime/alias.js");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("aliasExpand", () => {
  test("don't expand when aliases are disabled", async () => {
    mockGetConfig.mockReturnValue({ useAliases: false });
    mockExecuteShellCommand.mockReturnValue({
      stdout: `alias glo='git log --oneline'`,
      status: 0,
    });

    const { aliasExpand: aliasExpandDisabled, loadAliases: loadAliasesDisabled } = await import("../../runtime/alias.js");

    await loadAliasesDisabled(Shell.Bash);
    // Should return the original token unchanged since aliases are disabled
    expect(aliasExpandDisabled([{ token: "glo", complete: true, isOption: false, tokenLength: 3 }])).toMatchSnapshot();
  });

  test("expand on bash aliases", async () => {
    mockGetConfig.mockReturnValue({ useAliases: true });
    mockExecuteShellCommand.mockReturnValue({
      stdout: `alias glo='git log --oneline'
alias la='echo '\\''lo'\\'' '\\''la'\\'''
alias ls='ls --color=auto'`,
      status: 0,
    });

    await loadAliases(Shell.Bash);
    expect(aliasExpand([{ token: "glo", complete: false, isOption: false, tokenLength: 3 }])).toMatchSnapshot();
    expect(aliasExpand([{ token: "la", complete: true, isOption: false, tokenLength: 2 }])).toMatchSnapshot();
    expect(aliasExpand([{ token: "git", complete: true, isOption: false, tokenLength: 3 }])).toMatchSnapshot();
    expect(aliasExpand([{ token: "ls", complete: true, isOption: false, tokenLength: 2 }])).toMatchSnapshot();
  });

  test("expand on zsh aliases", async () => {
    mockGetConfig.mockReturnValue({ useAliases: true });
    mockExecuteShellCommand.mockReturnValue({
      stdout: `glo='git log --oneline'
la='echo '\\''lo'\\'' '\\''la'\\'''
ls='ls --color=auto'`,
      status: 0,
    });

    await loadAliases(Shell.Zsh);
    expect(aliasExpand([{ token: "glo", complete: false, isOption: false, tokenLength: 3 }])).toMatchSnapshot();
    expect(aliasExpand([{ token: "la", complete: true, isOption: false, tokenLength: 2 }])).toMatchSnapshot();
    expect(aliasExpand([{ token: "git", complete: true, isOption: false, tokenLength: 3 }])).toMatchSnapshot();
    expect(aliasExpand([{ token: "ls", complete: true, isOption: false, tokenLength: 2 }])).toMatchSnapshot();
  });
});
