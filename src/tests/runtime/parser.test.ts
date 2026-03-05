// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { parseCommand } from "../../runtime/parser.js";
import { Shell } from "../../utils/shell.js";

const testData = [
  { command: `cmd --flag value` },
  { command: `cmd --flag=value` },
  { command: `cmd --flag='value' ` },
  { command: `cmd --flag="value" ` },
  { command: `cmd 'value' ` },
  { command: `cmd value ` },
  { command: `cmd -f` },
  { command: `cmd -f=value ` },
  { command: `cmd -f value ` },
  { command: `cmd -f 'value' ` },
  { command: `cmd -f="value" ` },
  { command: `cmd -f='val` },
  { command: `cmd -f` },
  { command: `cmd -f=` },
  { command: `cmd -f ` },
  { command: `cmd` },
  { command: `cmd ` },
  { command: `cmd "value' ` },
  { command: `cmd "value" ` },
  { command: `cmd "value'\\"\\"" ` },
  { command: `cmd1 | cmd2 ` },
  { command: `cmd1 -` },
  { command: `cmd dir\\ 1/dir\\ 2/item1` },
  { command: `cmd1 "item1"item2` },
  { command: `cmd1 "item1"item2 item3` },
  { command: `cmd1 "item1"item2 "item3"` },
  { command: "`cmd1`" },
  { command: "cmd 'item1\\item2\\'item3 ", shell: Shell.Powershell },
  { command: "cmd 'item1\\item2\\'item3", shell: Shell.Powershell },
  { command: "😁" },
  { command: `` },
  { command: `   ` },
  { command: `cmd   ` },
  { command: `cmd1 | cmd2 && cmd3 ; cmd4` },
  { command: `cmd1 || cmd2 | cmd3` },
  { command: "cmd\targ" },
  { command: `cmd '' ` },
  { command: `cmd "" ` },
  { command: `cmd 'incomplete` },
  { command: `cmd "incomplete` },
  { command: `cmd --flag=` },
  { command: `cmd --flag=''` },
  { command: `cmd --flag=""` },
  { command: `cmd -f=''` },
  { command: `cmd 'hello' "world" ` },
  { command: `cmd "it's" ` },
  { command: `cmd "a"b "c"d` },
  { command: "cmd C:\\Users\\dir\\file", shell: Shell.Powershell },
  { command: "cmd dir\\ name/file", shell: Shell.Bash },
  { command: "cmd dir` name/file", shell: Shell.Pwsh },
  { command: "cmd dir^ name/file", shell: Shell.Cmd },
  { command: "cmd --flag value", shell: Shell.Nushell },
  { command: "cmd --flag value", shell: Shell.Fish },
  { command: "cmd --flag value", shell: Shell.Xonsh },
  { command: "cmd `n`t arg", shell: Shell.Powershell },
];

describe(`parseCommand`, () => {
  testData.forEach(({ command, shell }) => {
    test(`[${shell ?? "bash"}] ${command}`, () => {
      expect(parseCommand(command, shell ?? Shell.Bash)).toMatchSnapshot();
    });
  });
});

describe(`multi-shell whitespace escaping`, () => {
  const shellEscapeData: { shell: Shell; command: string }[] = [
    { shell: Shell.Bash, command: `cmd dir\\ name` },
    { shell: Shell.Zsh, command: `cmd dir\\ name` },
    { shell: Shell.Pwsh, command: "cmd dir` name" },
    { shell: Shell.Powershell, command: "cmd dir` name" },
    { shell: Shell.Cmd, command: `cmd dir^ name` },
    { shell: Shell.Fish, command: `cmd dir\\ name` },
    { shell: Shell.Xonsh, command: `cmd dir\\ name` },
    { shell: Shell.Nushell, command: `cmd dir\\ name` },
  ];

  shellEscapeData.forEach(({ shell, command }) => {
    test(`[${shell}] escaped space: ${command}`, () => {
      const tokens = parseCommand(command, shell);
      expect(tokens).toMatchSnapshot();
      expect(tokens.at(-1)?.token).toContain(" ");
    });
  });
});
