// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import readline from "node:readline";
import ansi from "ansi-escapes";
import chalk from "chalk";
import { Command } from "commander";

import log from "../utils/log.js";
import { getBackspaceSequence, Shell } from "../utils/shell.js";
import { enableWin32InputMode, resetToInitialState } from "../utils/ansi.js";
import { MAX_LINES, type KeyPressEvent, type SuggestionManager } from "./suggestionManager.js";
import type { ISTerm } from "../isterm/pty.js";
import { v4 as uuidV4 } from "uuid";

export const renderConfirmation = (live: boolean): string => {
  const statusMessage = live ? chalk.green("live") : chalk.red("not found");
  return `inshellisense session [${statusMessage}]\n`;
};

export const renderMissingResources = (): string => {
  return chalk.red(`inshellisense resources out of date, run "is reinit" to refresh\n`);
};

const writeOutput = (data: string) => {
  log.debug({ msg: "writing data", data });
  process.stdout.write(data);
};

const _render = (term: ISTerm, suggestionManager: SuggestionManager, data: string, handlingBackspace: boolean, handlingSuggestion: boolean): boolean => {
  const direction = _direction(term);
  const { hidden: cursorHidden, shift: cursorShift } = term.getCursorState();
  const linesOfInterest = MAX_LINES;

  const suggestion = suggestionManager.render(direction);
  const hasSuggestion = suggestion.length != 0;

  // there is no rendered suggestion and this will not render a suggestion
  if (!handlingSuggestion && !hasSuggestion) {
    writeOutput(data);
    return false;
  }

  const commandState = term.getCommandState();
  const cursorTerminated = handlingBackspace ? true : commandState.cursorTerminated ?? false;
  const showSuggestions = hasSuggestion && cursorTerminated && !commandState.hasOutput && !cursorShift;
  const patch = term.getPatch(linesOfInterest, showSuggestions ? suggestion : [], direction);

  const ansiCursorShow = cursorHidden ? "" : ansi.cursorShow;
  if (direction == "above") {
    writeOutput(
      data + ansi.cursorHide + ansi.cursorSavePosition + ansi.cursorPrevLine.repeat(linesOfInterest) + patch + ansi.cursorRestorePosition + ansiCursorShow,
    );
  } else {
    writeOutput(ansi.cursorHide + ansi.cursorSavePosition + ansi.cursorNextLine + patch + ansi.cursorRestorePosition + ansiCursorShow + data);
  }
  return showSuggestions;
};

const _clear = (term: ISTerm): void => {
  const clearDirection = _direction(term) == "above" ? "below" : "above"; // invert direction to clear what was previously rendered
  const { hidden: cursorHidden } = term.getCursorState();
  const patch = term.getPatch(MAX_LINES, [], clearDirection);

  const ansiCursorShow = cursorHidden ? "" : ansi.cursorShow;
  if (clearDirection == "above") {
    writeOutput(ansi.cursorHide + ansi.cursorSavePosition + ansi.cursorPrevLine.repeat(MAX_LINES) + patch + ansi.cursorRestorePosition + ansiCursorShow);
  } else {
    writeOutput(ansi.cursorHide + ansi.cursorSavePosition + ansi.cursorNextLine + patch + ansi.cursorRestorePosition + ansiCursorShow);
  }
};

const _direction = (term: ISTerm): "above" | "below" => {
  return term.getCursorState().remainingLines > MAX_LINES ? "below" : "above";
};

export const render = async (program: Command, shell: Shell, underTest: boolean, login: boolean) => {
  const [isterm, { SuggestionManager }] = await Promise.all([import("../isterm/index.js"), import("./suggestionManager.js")]);
  const term = await isterm.default.spawn(program, { shell, rows: process.stdout.rows, cols: process.stdout.columns, underTest, login });
  const suggestionManager = new SuggestionManager(term, shell);
  let hasSuggestion = false;
  let direction = _direction(term);
  let handlingBackspace = false; // backspace normally consistent of two data points (move back & delete), so on the first data point, we won't enforce the cursor terminated rule. this will help reduce flicker
  let renderId = uuidV4();
  const stdinStartedInRawMode = process.stdin.isRaw;
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  readline.emitKeypressEvents(process.stdin);

  const writeOutput = (data: string) => {
    log.debug({ msg: "writing data", data });
    process.stdout.write(data);
  };

  writeOutput(ansi.clearTerminal);

  term.onData(async (data) => {
    data = data.replace(enableWin32InputMode, ""); // remove win32-input-mode enable sequence if it comes through data

    const handlingDirectionChange = direction != _direction(term);
    // clear the previous suggestion if the direction has changed to avoid leftover suggestions
    if (handlingDirectionChange) {
      _clear(term);
    }

    hasSuggestion = _render(term, suggestionManager, data, handlingBackspace, hasSuggestion);

    const currentRenderId = uuidV4();
    renderId = currentRenderId;
    await suggestionManager.exec();

    // handle race conditions where a earlier render might override a later one
    if (currentRenderId == renderId) {
      hasSuggestion = _render(term, suggestionManager, "", handlingBackspace, hasSuggestion);
    }

    handlingBackspace = false;
    direction = _direction(term);
  });

  process.stdin.on("keypress", (...keyPress: KeyPressEvent) => {
    const press = keyPress[1];
    const inputHandled = suggestionManager.update(press);
    if (hasSuggestion && inputHandled) {
      term.noop();
    } else if (!inputHandled) {
      if (press.name == "backspace") {
        handlingBackspace = true;
        term.write(getBackspaceSequence(keyPress, shell));
      } else {
        term.write(press.sequence);
      }
    }
  });

  term.onExit(({ exitCode }) => {
    if (!stdinStartedInRawMode) process.stdin.setRawMode(false);
    process.stdout.write(resetToInitialState);
    process.exit(exitCode);
  });
  process.stdout.on("resize", () => {
    term.resize(process.stdout.columns, process.stdout.rows);
  });
};