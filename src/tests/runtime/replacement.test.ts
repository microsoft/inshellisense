// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { calculateReplacement, applyReplacement } from "../../runtime/replacement.js";
import { Suggestion } from "../../runtime/model.js";
import { CommandToken } from "../../runtime/parser.js";

const makeSuggestion = (overrides: Partial<Suggestion> & { name: string }): Suggestion => ({
  allNames: [overrides.name],
  icon: "📦",
  priority: 50,
  ...overrides,
});

const makeToken = (overrides: Partial<CommandToken> & { token: string }): CommandToken => ({
  tokenLength: overrides.token.length,
  complete: false,
  isOption: false,
  ...overrides,
});

describe("calculateReplacement", () => {
  test("partial prefix appends remaining suffix", () => {
    expect(calculateReplacement(makeToken({ token: "sta" }), makeSuggestion({ name: "status" }))).toEqual({ backspaceCount: 0, insertText: "tus " });
  });
  test("full match returns undefined", () => {
    expect(calculateReplacement(makeToken({ token: "status" }), makeSuggestion({ name: "status" }))).toBeUndefined();
  });
  test("no token inserts full suggestion", () => {
    expect(calculateReplacement(undefined, makeSuggestion({ name: "status" }))).toEqual({ backspaceCount: 0, insertText: "status " });
  });
  test("complete token inserts full suggestion", () => {
    expect(calculateReplacement(makeToken({ token: "add", complete: true }), makeSuggestion({ name: "status" }))).toEqual({
      backspaceCount: 0,
      insertText: "status ",
    });
  });
  test("insertValue backspaces token and inserts custom value", () => {
    expect(calculateReplacement(makeToken({ token: "sta" }), makeSuggestion({ name: "status", insertValue: "status --short" }))).toEqual({
      backspaceCount: 3,
      insertText: "status --short",
    });
  });
  test("divergent text backspaces entire token", () => {
    expect(calculateReplacement(makeToken({ token: "comit", tokenLength: 5 }), makeSuggestion({ name: "commit" }))).toEqual({
      backspaceCount: 5,
      insertText: "commit ",
    });
  });
  test("unrelated text backspaces entire token", () => {
    expect(calculateReplacement(makeToken({ token: "xyz" }), makeSuggestion({ name: "status" }))).toEqual({ backspaceCount: 3, insertText: "status " });
  });
  test("path with insertValue backspaces token", () => {
    expect(
      calculateReplacement(makeToken({ token: "src/run", tokenLength: 7 }), makeSuggestion({ name: "runtime", insertValue: "src/runtime/", type: "folder" })),
    ).toEqual({ backspaceCount: 7, insertText: "src/runtime/" });
  });
  test("empty suggestion returns undefined", () => {
    expect(calculateReplacement(undefined, makeSuggestion({ name: "" }))).toBeUndefined();
  });
  test("wide-char prefix appends remainder", () => {
    expect(calculateReplacement(makeToken({ token: "你", tokenLength: 2 }), makeSuggestion({ name: "你好" }))).toEqual({
      backspaceCount: 0,
      insertText: "好 ",
    });
  });
  test("wide-char divergent uses display width for backspace", () => {
    expect(calculateReplacement(makeToken({ token: "你", tokenLength: 2 }), makeSuggestion({ name: "世界" }))).toEqual({
      backspaceCount: 2,
      insertText: "世界 ",
    });
  });
  test("option prefix appends remaining", () => {
    expect(calculateReplacement(makeToken({ token: "--ver", isOption: true }), makeSuggestion({ name: "--version" }))).toEqual({
      backspaceCount: 0,
      insertText: "sion ",
    });
  });
});

describe("applyReplacement", () => {
  test("append-only", () => {
    expect(applyReplacement({ backspaceCount: 0, insertText: "tus " })).toBe("tus ");
  });
  test("backspace + insert", () => {
    expect(applyReplacement({ backspaceCount: 3, insertText: "status --short" })).toBe("\u007F\u007F\u007Fstatus --short");
  });
});
