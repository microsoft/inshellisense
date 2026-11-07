// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import stripAnsi from "strip-ansi";
import { getExpandedBoxSize, renderBox, truncateMultilineText, truncateText } from "../../ui/utils";
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

  test.each(["美", "⭐⭐"])("fits wide text %s into a single-cell description", (description) => {
    const lines = truncateMultilineText(description, 1, 5);
    expect(lines.every((line) => wcswidth(line) === 1)).toBe(true);
    expect(lines.join("")).toContain("…");
  });

  test("respects maxHeight and marks the truncation", () => {
    const lines = truncateMultilineText("a".repeat(200), 20, 3);
    expect(lines).toHaveLength(3);
    expect(lines[2].endsWith("…")).toBe(true);
    expect(lines.every((line) => wcswidth(line) === 20)).toBe(true);
  });
});

describe("getExpandedBoxSize", () => {
  test("keeps the initial size when the text already fits", () => {
    expect(getExpandedBoxSize("short description", 30, 7, 100, 30)).toEqual({ width: 30, height: 7 });
  });

  test("grows both dimensions proportionally until the text fits", () => {
    const text = "x".repeat(500);
    const size = getExpandedBoxSize(text, 30, 7, 100, 30);

    expect(size.width).toBeGreaterThan(30);
    expect(size.width).toBeLessThan(100);
    expect(size.height).toBe(Math.ceil((size.width * 7) / 30));
    expect(truncateMultilineText(text, size.width - 2, size.height - 2).join("")).not.toContain("…");
  });

  test.each([
    [35, 30, { width: 35, height: 18 }],
    [120, 8, { width: 86, height: 8 }],
    [40, 10, { width: 40, height: 10 }],
  ])("continues along the remaining dimension within %i columns and %i rows", (maxWidth, maxHeight, expected) => {
    expect(getExpandedBoxSize("x".repeat(500), 30, 7, maxWidth, maxHeight)).toEqual(expected);
  });

  test("grows vertically when the initial width is already constrained", () => {
    expect(getExpandedBoxSize("x".repeat(100), 30, 7, 12, 20)).toEqual({ width: 12, height: 12 });
  });

  test("accounts for explicit newlines and terminal cell widths", () => {
    const text = "美\n\n🚀";
    const size = getExpandedBoxSize(text, 3, 3, 4, 10);

    expect(size).toEqual({ width: 4, height: 5 });
    expect(truncateMultilineText(text, size.width - 2, size.height - 2)).toEqual(["美", "  ", "🚀"]);
  });
});
