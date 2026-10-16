// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { jest } from "@jest/globals";

import { disableWin32InputMode, enableWin32InputMode, index } from "../../utils/ansi.js";
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

test("forwards raw Escape immediately without creating a keypress", () => {
  const { keypresses, proxy } = createRouter();
  const forwarded: string[] = [];

  proxy.handleInput("\u001B", (data) => forwarded.push(data));

  expect(forwarded).toEqual(["\u001B"]);
  expect(keypresses).toEqual([]);
  proxy.dispose();
});

test("transfers an incomplete key to the raw route without a delayed duplicate", async () => {
  jest.useFakeTimers();
  const { keypresses, proxy } = createRouter();
  const forwarded: string[] = [];
  try {
    proxy.handleInput("a\u001B");
    proxy.handleInput("[A", (data) => forwarded.push(data));
    await jest.advanceTimersByTimeAsync(1_000);
    proxy.handleInput("\u001B[D");

    expect(forwarded).toEqual(["\u001B[A"]);
    expect(keypresses).toEqual(["a", "\u001B[D"]);
  } finally {
    proxy.dispose();
    jest.useRealTimers();
  }
});

test("keeps cursor reports separate from raw input across chunks", () => {
  const { keypresses, proxy, responses } = createRouter();
  const forwarded: string[] = [];
  const forward = (data: string) => forwarded.push(data);

  proxy.handleInput("a\u001B[2;", forward);
  proxy.handleInput("7Rb", forward);

  expect(forwarded).toEqual(["a", "b"]);
  expect(responses).toEqual(["\u001B[2;7R"]);
  expect(keypresses).toEqual([]);
  proxy.dispose();
});

test("preserves split UTF-8 input on the raw route", () => {
  const { keypresses, proxy } = createRouter();
  const forwarded: string[] = [];
  const input = Buffer.from("\u{1F680}");
  const forward = (data: string) => forwarded.push(data);

  proxy.handleInput(input.subarray(0, 2), forward);
  proxy.handleInput(input.subarray(2), forward);

  expect(forwarded).toEqual(["\u{1F680}"]);
  expect(keypresses).toEqual([]);
  proxy.dispose();
});

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

test.each([
  ["kitty keyboard query", "\u001B[?u"],
  ["kitty keyboard set", "\u001B[=1;1u"],
  ["kitty keyboard reset", "\u001B[=0;1u"],
  ["kitty keyboard push", "\u001B[>1u"],
  ["kitty keyboard pop", "\u001B[<1u"],
  ["modify other keys", "\u001B[>4;2m"],
  ["modify other keys reset", "\u001B[>4m"],
])("strips outbound %s", (_name, sequence) => {
  const { proxy } = createRouter();

  expect(proxy.handleOutput(`before${sequence}after`)).toBe("beforeafter");
});

test("handles outbound keyboard protocol upgrades split across chunks", () => {
  const { proxy } = createRouter();

  expect(proxy.handleOutput("before\u001B[>4;")).toBe("before");
  expect(proxy.handleOutput("2mafter")).toBe("after");
});

test.each([
  ["restore cursor", "\u001B[u"],
  ["secondary device attributes", "\u001B[>c"],
  ["bracketed paste", "\u001B[?2004h"],
  ["alternate buffer", "\u001B[?1049h"],
  ["truecolor", "\u001B[38;2;219;177;49m"],
])("keeps outbound %s", (_name, sequence) => {
  const { proxy } = createRouter();

  expect(proxy.handleOutput(sequence)).toBe(sequence);
});

test("rewrites bare line feeds so the column survives newline auto-return", () => {
  const { proxy } = createRouter();

  expect(proxy.handleOutput("\u001B[H\u001B[2J\n\u001B[5C▄▀▀▄\n\u001B[5D▀▀▀▀▀▀")).toBe(`\u001B[H\u001B[2J${index}\u001B[5C▄▀▀▄${index}\u001B[5D▀▀▀▀▀▀`);
});

test("keeps carriage return line feed pairs intact", () => {
  const { proxy } = createRouter();

  expect(proxy.handleOutput("first\r\nsecond\r\n")).toBe("first\r\nsecond\r\n");
});

test("rewrites consecutive bare line feeds", () => {
  const { proxy } = createRouter();

  expect(proxy.handleOutput("\r\n\n\n line")).toBe(`\r\n${index}${index} line`);
});

test("rewrites a line feed split from its carriage return, which lands in the same column", () => {
  const { proxy } = createRouter();

  expect(proxy.handleOutput("first\r")).toBe("first\r");
  expect(proxy.handleOutput("\nsecond")).toBe(`${index}second`);
});
