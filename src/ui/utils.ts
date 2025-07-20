// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { resetColor } from "../utils/ansi.js";
import wrapAnsi from "wrap-ansi";
import chalk from "chalk";
import wcwidth from "wcwidth";

export const renderBox = (rows: string[], width: number, borderColor?: string): string[] => {
  const result = [];
  const setColor = (text: string) => resetColor + (borderColor ? chalk.hex(borderColor).apply(text) : text);
  result.push(setColor("┌" + "─".repeat(width - 2) + "┐"));
  rows.forEach((row) => {
    result.push(setColor("│") + row + setColor("│"));
  });
  result.push(setColor("└" + "─".repeat(width - 2) + "┘"));
  return result;
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
