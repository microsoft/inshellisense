// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { disableWin32InputMode, enableWin32InputMode } from "../../utils/ansi.js";
import { StdioProxy } from "../../ui/stdioProxy.js";

const createRouter = () => {
  const responses: string[] = [];
  const keypresses: string[] = [];
  const toggles: boolean[] = [];
  const proxy = new StdioProxy({
    onCursorPositionReport: (data) => responses.push(data),
    onWin32InputMode: (enabled) => toggles.push(enabled),
  });
  proxy.onKeypress((_value, key) => keypresses.push(key.sequence));
  return { keypresses, proxy, responses, toggles };
};

test("consumes cursor-position reports without creating keypresses", () => {
  const { keypresses, responses, proxy } = createRouter();

  proxy.handleInput(Buffer.from("\u001B[2;7R"));

  expect(responses).toEqual(["\u001B[2;7R"]);
  expect(keypresses).toEqual([]);
});

test("handles cursor-position reports split across chunks", () => {
  const { keypresses, responses, proxy } = createRouter();

  proxy.handleInput(Buffer.from("\u001B[2;"));
  proxy.handleInput(Buffer.from("7R"));

  expect(responses).toEqual(["\u001B[2;7R"]);
  expect(keypresses).toEqual([]);
});

test("consumes private cursor-position reports", () => {
  const { keypresses, responses, proxy } = createRouter();

  proxy.handleInput(Buffer.from("\u001B[?2;7R"));

  expect(responses).toEqual(["\u001B[?2;7R"]);
  expect(keypresses).toEqual([]);
});

test("keeps regular CSI key sequences in readline", () => {
  const { keypresses, responses, proxy } = createRouter();

  proxy.handleInput(Buffer.from("\u001B[A"));

  expect(responses).toEqual([]);
  expect(keypresses).toEqual(["\u001B[A"]);
});

test("captures outbound Win32 input mode toggles", () => {
  const { proxy, toggles } = createRouter();

  expect(proxy.handleOutput(`before${disableWin32InputMode}middle${enableWin32InputMode}after`)).toBe("beforemiddleafter");
  expect(toggles).toEqual([false, true]);
});

test("handles outbound Win32 input mode toggles split across chunks", () => {
  const { proxy, toggles } = createRouter();

  expect(proxy.handleOutput("\u001B[?90")).toBe("");
  expect(proxy.handleOutput("01houtput")).toBe("output");
  expect(toggles).toEqual([true]);
});

test("keeps unrelated outbound CSI sequences", () => {
  const { proxy, toggles } = createRouter();

  expect(proxy.handleOutput("\u001B[?25loutput")).toBe("\u001B[?25loutput");
  expect(toggles).toEqual([]);
});
