// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { parseCommand } from "../../runtime/parser.js";

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
  { command: `cmd "value'\\"\\"" ` },
  { command: `cmd1 | cmd2 ` },
  { command: `cmd1 -` },
];

describe(`parseCommand`, () => {
  testData.forEach(({ command }) => {
    test(command, () => {
      expect(parseCommand(command)).toMatchSnapshot();
    });
  });
});
