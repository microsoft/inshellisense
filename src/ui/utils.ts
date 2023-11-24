// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import ansi from "ansi-escapes";
import chalk from "chalk";

/**
 * Renders a box around the given rows
 * @param rows the text content to be included in the box, must be <= width - 2
 * @param width the max width of a row
 * @param x the column to start the box at
 */
export const renderBox = (rows: string[], width: number, x: number, borderColor?: string) => {
  const result = [];
  const setColor = (text: string) => (borderColor ? chalk.hex(borderColor).apply(text) : text);
  result.push(setColor("┌" + "─".repeat(width - 2) + "┐") + ansi.cursorTo(x));
  rows.forEach((row) => {
    result.push(ansi.cursorDown() + setColor("│") + row + setColor("│") + ansi.cursorTo(x));
  });
  result.push(ansi.cursorDown() + setColor("└" + "─".repeat(width - 2) + "┘") + ansi.cursorTo(x));
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
