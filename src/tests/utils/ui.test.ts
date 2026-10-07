// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import stripAnsi from "strip-ansi";
import { renderBox, truncateMultilineText, truncateText } from "../../ui/utils";
import { wcswidth } from "../../utils/unicode";
import { getConfig } from "../../utils/config";

describe("renderBox", () => {
  let previousBoxBorderStyle: ReturnType<typeof getConfig>["boxBorderStyle"];

  beforeEach(() => {
    previousBoxBorderStyle = getConfig().boxBorderStyle;
  });

  afterEach(() => {
    getConfig().boxBorderStyle = previousBoxBorderStyle;
  });

  test("uses square corners by default", () => {
    expect(renderBox(["ab"], 4).map(stripAnsi)).toEqual(["┌──┐", "│ab│", "└──┘"]);
  });

  test("uses rounded corners when configured", () => {
    getConfig().boxBorderStyle = "rounded";

    expect(renderBox(["ab"], 4).map(stripAnsi)).toEqual(["╭──╮", "│ab│", "╰──╯"]);
  });
});

describe("truncateText", () => {
  test("handling chinese wide characters", () => {
    expect(truncateText("美国人", 10)).toBe("美国人    ");
  });

  test("truncates too long wide characters when exact", () => {
    expect(truncateText("美国人 人人", 10)).toBe("美国人 人…");
  });

  test("truncates too long wide characters when split", () => {
    expect(truncateText("美国人美国人", 10)).toBe("美国人美… ");
  });
});

describe("truncateMultilineText", () => {
  test("keeps ascii lines padded to the requested width", () => {
    const lines = truncateMultilineText("Run OpenCode with a message", 28, 5);
    expect(lines).toEqual(["Run OpenCode with a message "]);
  });

  test("pads wide characters by display width, not by code units", () => {
    const lines = truncateMultilineText("以一条消息运行 OpenCode", 28, 5);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every((line) => wcswidth(line) === 28)).toBe(true);
  });

  test("pads emoji by display width", () => {
    const cases = ["⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐", "🚀🚀🚀🚀🚀🚀🚀🚀", "👨👩👧👨👩👧👨👩👧"];
    for (const text of cases) {
      const lines = truncateMultilineText(text, 28, 5);
      expect(lines.every((line) => wcswidth(line) === 28)).toBe(true);
    }
  });

  test("keeps box borders aligned for wide characters", () => {
    const rows = truncateMultilineText("以一条消息运行 OpenCode", 28, 5);
    const box = renderBox(rows, 30).map(stripAnsi);
    expect(box.every((line) => wcswidth(line) === 30)).toBe(true);
  });

  test("respects maxHeight and marks the truncation", () => {
    const lines = truncateMultilineText("a".repeat(200), 20, 3);
    expect(lines).toHaveLength(3);
    expect(lines[2].endsWith("…")).toBe(true);
    expect(lines.every((line) => wcswidth(line) === 20)).toBe(true);
  });
});
