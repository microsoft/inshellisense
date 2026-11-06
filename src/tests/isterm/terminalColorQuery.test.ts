// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { getTerminalColorQuerySelectors, trueColorSequence } from "../../isterm/pty.js";

test.each([
  [38, 0xfbf1c7, "\u001B[38;2;251;241;199m"],
  [48, 0xd65d0e, "\u001B[48;2;214;93;14m"],
] as const)("preserves 24-bit color for SGR layer %i", (layer, color, expected) => {
  expect(trueColorSequence(layer, color)).toBe(expected);
});

test("tracks successive terminal color queries", () => {
  expect(getTerminalColorQuerySelectors(10, "?;?;?")).toEqual([10, 11, 12]);
});

test("tracks only queried terminal color parameters", () => {
  expect(getTerminalColorQuerySelectors(10, "?;rgb:0000/0000/0000;?")).toEqual([10, 12]);
});

test("does not track selectors beyond the supported terminal colors", () => {
  expect(getTerminalColorQuerySelectors(11, "?;?;?")).toEqual([11, 12]);
});
