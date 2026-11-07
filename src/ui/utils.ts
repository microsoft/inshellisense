// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { resetColor } from "../utils/ansi.js";
import wrapAnsi from "wrap-ansi";
import chalk from "chalk";
import { wcswidth } from "../utils/unicode.js";
import { getConfig } from "../utils/config.js";

const borderCorners = {
  square: ["┌", "┐", "└", "┘"],
  rounded: ["╭", "╮", "╰", "╯"],
} as const;

export const renderBox = (rows: string[], width: number, borderColor?: string): string[] => {
  const result = [];
  const setColor = (text: string) => resetColor + (borderColor ? chalk.hex(borderColor).apply(text) : text);
  const [topLeft, topRight, bottomLeft, bottomRight] = borderCorners[getConfig().boxBorderStyle];
  result.push(setColor(topLeft + "─".repeat(width - 2) + topRight));
  rows.forEach((row) => {
    result.push(setColor("│") + row + setColor("│"));
  });
  result.push(setColor(bottomLeft + "─".repeat(width - 2) + bottomRight));
  return result;
};

const wrapText = (text: string, width: number) =>
  wrapAnsi(text, width, {
    trim: false,
    hard: true,
  }).split("\n");

export const getExpandedBoxSize = (text: string, width: number, height: number, maxWidth: number, maxHeight: number) => {
  let expandedWidth = Math.min(width, maxWidth);
  let expandedHeight = Math.min(height, maxHeight);
  while (expandedWidth <= maxWidth) {
    const lines = wrapText(text, expandedWidth - 2);
    if (lines.length <= expandedHeight - 2 && lines.every((line) => wcswidth(line) <= expandedWidth - 2)) {
      break;
    }
    if (expandedWidth === maxWidth) {
      expandedHeight = Math.min(maxHeight, Math.max(expandedHeight, lines.length + 2));
      break;
    }
    expandedWidth += 1;
    expandedHeight = Math.min(maxHeight, Math.max(expandedHeight, Math.ceil((expandedWidth * height) / width)));
  }
  return { width: expandedWidth, height: expandedHeight };
};

export const truncateMultilineText = (description: string, width: number, maxHeight: number) => {
  const lines = wrapText(description, width);
  const overflows = lines.length > maxHeight;
  return lines.slice(0, maxHeight).map((line, idx) => truncateText(overflows && idx === maxHeight - 1 ? line + "…" : line, width));
};

const wcPadEnd = (text: string, width: number, char = " "): string => text + char.repeat(Math.max(width - wcswidth(text), 0));

const wcPoints = (text: string, length: number): [string, boolean] => {
  const points = [...text];
  const accPoints = [];
  let accWidth = 0;
  for (const point of points) {
    const width = wcswidth(point);
    if (width + accWidth > length) {
      return wcswidth(accPoints.join("")) < length ? [accPoints.join(""), true] : [accPoints.slice(0, -1).join(""), true];
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
