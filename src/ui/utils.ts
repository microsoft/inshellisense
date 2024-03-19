// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import ansi from "ansi-escapes";
import wrapAnsi from "wrap-ansi";
import chalk from "chalk";
import wcwidth from "wcwidth";

/**
 * Renders a box around the given rows
 * @param rows the text content to be included in the box, must be <= width - 2
 * @param width the max width of a row
 * @param x the column to start the box at
 */
export const renderBox = (rows: string[], width: number, x: number, borderColor?: string) => {
  const result = [];
  const setColor = (text: string) => (borderColor ? chalk.hex(borderColor).apply(text) : text);
  result.push(ansi.cursorTo(x) + setColor("┌" + "─".repeat(width - 2) + "┐") + ansi.cursorTo(x));
  rows.forEach((row) => {
    result.push(ansi.cursorDown() + setColor("│") + row + setColor("│") + ansi.cursorTo(x));
  });
  result.push(ansi.cursorDown() + setColor("└" + "─".repeat(width - 2) + "┘") + ansi.cursorTo(x));
  return result.join("") + ansi.cursorUp(rows.length + 1);
};

export const truncateMultilineText = (description: string, width: number, maxHeight: number) => {
  const wrappedText = wrapAnsi(description, width, {
    trim: false,
    hard: true,
  });
  const lines = wrappedText.split("\n");
  const truncatedLines = lines.slice(0, maxHeight);
  if (lines.length > maxHeight) {
    truncatedLines[maxHeight - 1] = [...truncatedLines[maxHeight - 1]].slice(0, -1).join("") + "…";
  }
  return truncatedLines.map((line) => line.padEnd(width));
};

const wcPadEnd = (text: string, width: number, char = " "): string => text + char.repeat(Math.max(width - wcwidth(text), 0));

const wcPoints = (text: string, length: number): [string, boolean] => {
  const points = [...text];
  const accPoints = [];
  let accWidth = 0;
  for (const point of points) {
    const width = wcwidth(point);
    if (width + accWidth > length) {
      return wcwidth(accPoints.join("")) < length ? [accPoints.join(""), true] : [accPoints.slice(0, -1).join(""), true];
    }
    accPoints.push(point);
    accWidth += width;
  }
  return [accPoints.join(""), false];
};

/**
 * Truncates the text to the given width
 */
export const truncateText = (text: string, width: number) => {
  const [points, truncated] = wcPoints(text, width);
  return !truncated ? wcPadEnd(text, width) : wcPadEnd(points + "…", width);
};
