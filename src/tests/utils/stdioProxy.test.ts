// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { setTimeout as delay } from "node:timers/promises";
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

test("forwards standalone Escape synchronously without creating a keypress", () => {
  const { keypresses, proxy } = createRouter();
  const input: string[] = [];

  proxy.handleInput(Buffer.from("\u001B"), (data) => input.push(data));

  expect(input).toEqual(["\u001B"]);
  expect(keypresses).toEqual([]);
  proxy.dispose();
});

test("preserves batched input and control keys when bypassing readline", () => {
  const { keypresses, proxy } = createRouter();
  const input: string[] = [];
  const data = "text\u001B[A\u0008\u007F\u0003\u001B";

  proxy.handleInput(Buffer.from(data), (data) => input.push(data));

  expect(input).toEqual([data]);
  expect(keypresses).toEqual([]);
  proxy.dispose();
});

test("still consumes split cursor-position reports when bypassing readline", () => {
  const { keypresses, responses, proxy } = createRouter();
  const input: string[] = [];
  const forwardInput = (data: string) => input.push(data);

  proxy.handleInput(Buffer.from("a\u001B[2;"), forwardInput);
  proxy.handleInput(Buffer.from("7R\u001B[?3;4Rb"), forwardInput);

  expect(input).toEqual(["a", "b"]);
  expect(responses).toEqual(["\u001B[2;7R", "\u001B[?3;4R"]);
  expect(keypresses).toEqual([]);
  proxy.dispose();
});

test("preserves UTF-8 characters split across passthrough chunks", () => {
  const { keypresses, proxy } = createRouter();
  const input: string[] = [];
  const forwardInput = (data: string) => input.push(data);
  const character = "\u{1F600}";
  const bytes = Buffer.from(character);

  proxy.handleInput(bytes.subarray(0, 2), forwardInput);
  expect(input).toEqual([]);
  proxy.handleInput(bytes.subarray(2), forwardInput);

  expect(input).toEqual([character]);
  expect(keypresses).toEqual([]);
  proxy.dispose();
});

test("resumes normal key parsing after passthrough without treating the next key as Alt", () => {
  const { keypresses, proxy } = createRouter();
  const input: string[] = [];

  proxy.handleInput("a");
  proxy.handleInput("\u001B", (data) => input.push(data));
  proxy.handleInput("b\u001B[A");

  expect(input).toEqual(["\u001B"]);
  expect(keypresses).toEqual(["a", "b", "\u001B[A"]);
  proxy.dispose();
});

test("preserves a CSI prefix buffered before entering passthrough", () => {
  const { keypresses, proxy } = createRouter();
  const input: string[] = [];

  proxy.handleInput("\u001B[");
  proxy.handleInput("A", (data) => input.push(data));

  expect(input).toEqual(["\u001B[A"]);
  expect(keypresses).toEqual([]);
  proxy.dispose();
});

test("flushes an incomplete key before passthrough and suppresses its delayed keypress", async () => {
  const { keypresses, proxy } = createRouter();
  const input: string[] = [];
  try {
    proxy.handleInput("a\u001B");
    proxy.handleInput("b", (data) => input.push(data));

    expect(input).toEqual(["\u001Bb"]);
    expect(keypresses).toEqual(["a"]);

    proxy.handleInput("c");
    await delay(600);
    expect(input).toEqual(["\u001Bb"]);
    expect(keypresses).toEqual(["a", "c"]);
  } finally {
    proxy.dispose();
  }
});

test("keeps normal Escape parsing and split escape sequences unchanged", async () => {
  const { keypresses, proxy } = createRouter();
  try {
    proxy.handleInput("\u001B");
    expect(keypresses).toEqual([]);
    await delay(600);
    expect(keypresses).toEqual(["\u001B"]);

    proxy.handleInput("\u001B");
    proxy.handleInput("[A");
    expect(keypresses).toEqual(["\u001B", "\u001B[A"]);
  } finally {
    proxy.dispose();
  }
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
