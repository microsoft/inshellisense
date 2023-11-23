// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import ansi from "ansi-escapes";
import chalk from "chalk";

/**
 * Renders a box around the given rows
 * @param rows the text content to be included in the box, must be <= width - 2
 * @param width the max width of a row
 */
export const renderBox = (rows: string[], width: number, borderColor?: string) => {
  const result = [];
  const setColor = (text: string) => (borderColor ? chalk.hex(borderColor).apply(text) : text);
  result.push(setColor("┌" + "─".repeat(width - 2) + "┐") + ansi.cursorBackward(width));
  rows.forEach((row) => {
    result.push(ansi.cursorDown() + setColor("│") + row + setColor("│") + ansi.cursorBackward(width));
  });
  result.push(ansi.cursorDown() + setColor("└" + "─".repeat(width - 2) + "┘") + ansi.cursorBackward(width));
  return result.join("");
};

/**
 * Truncates the text to the given width
 */
export const truncateText = (text: string, width: number) => {
  const textPoints = [...text];
  const slicedText = textPoints.slice(0, width - 1);
  return slicedText.length == textPoints.length ? text : slicedText.join("") + "…";
};
