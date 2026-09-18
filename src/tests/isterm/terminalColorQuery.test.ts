// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { getTerminalColorQuerySelectors } from "../../isterm/pty.js";

test("tracks successive terminal color queries", () => {
  expect(getTerminalColorQuerySelectors(10, "?;?;?")).toEqual([10, 11, 12]);
});

test("tracks only queried terminal color parameters", () => {
  expect(getTerminalColorQuerySelectors(10, "?;rgb:0000/0000/0000;?")).toEqual([10, 12]);
});

test("does not track selectors beyond the supported terminal colors", () => {
  expect(getTerminalColorQuerySelectors(11, "?;?;?")).toEqual([11, 12]);
});
