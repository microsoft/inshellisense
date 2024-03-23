// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import readline from "node:readline";
import ansi from "ansi-escapes";
import chalk from "chalk";

import log from "../utils/log.js";
import { getBackspaceSequence, Shell } from "../utils/shell.js";
import isterm from "../isterm/index.js";
import { eraseLinesBelow } from "../utils/ansi.js";
import { SuggestionManager, MAX_LINES, KeyPressEvent } from "./suggestionManager.js";

export const renderConfirmation = (live: boolean): string => {
  const statusMessage = live ? chalk.green("live") : chalk.red("not found");
  return `inshellisense session [${statusMessage}]\n`;
};

export const render = async (shell: Shell, underTest: boolean, parentTermExit: boolean) => {
  const term = await isterm.spawn({ shell, rows: process.stdout.rows, cols: process.stdout.columns, underTest });
  const suggestionManager = new SuggestionManager(term, shell);
  let hasActiveSuggestions = false;
  let previousSuggestionsRows = 0;
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  readline.emitKeypressEvents(process.stdin);

  const writeOutput = (data: string) => {
    log.debug({ msg: "writing data", data });
    process.stdout.write(data);
  };

  writeOutput(ansi.clearTerminal);

  term.onData((data) => {
    if (hasActiveSuggestions) {
      // Considers when data includes newlines which have shifted the cursor position downwards
      const newlines = Math.max((data.match(/\r/g) || []).length, (data.match(/\n/g) || []).length);
      const linesOfInterest = MAX_LINES + newlines;
      if (term.getCursorState().remainingLines <= MAX_LINES) {
        // handles when suggestions get loaded before shell output so you need to always clear below output as a precaution
        if (term.getCursorState().remainingLines != 0) {
          writeOutput(ansi.cursorHide + ansi.cursorSavePosition + eraseLinesBelow(linesOfInterest + 1) + ansi.cursorRestorePosition);
        }
        writeOutput(
          data +
            ansi.cursorHide +
            ansi.cursorSavePosition +
            ansi.cursorPrevLine.repeat(linesOfInterest) +
            term.getCells(linesOfInterest, "above") +
            ansi.cursorRestorePosition +
            ansi.cursorShow,
        );
      } else {
        writeOutput(ansi.cursorHide + ansi.cursorSavePosition + eraseLinesBelow(linesOfInterest + 1) + ansi.cursorRestorePosition + ansi.cursorShow + data);
      }
    } else {
      writeOutput(data);
    }

    process.nextTick(async () => {
      // validate result to prevent stale suggestion being provided
      const suggestion = suggestionManager.validate(await suggestionManager.render(term.getCursorState().remainingLines));
      const commandState = term.getCommandState();

      if (suggestion.data != "" && commandState.cursorTerminated && !commandState.hasOutput) {
        if (hasActiveSuggestions) {
          if (term.getCursorState().remainingLines < MAX_LINES) {
            writeOutput(
              ansi.cursorHide +
                ansi.cursorSavePosition +
                ansi.cursorPrevLine.repeat(MAX_LINES) +
                term.getCells(MAX_LINES, "above") +
                ansi.cursorRestorePosition +
                ansi.cursorSavePosition +
                ansi.cursorUp() +
                suggestion.data +
                ansi.cursorRestorePosition +
                ansi.cursorShow,
            );
          } else {
            const offset = MAX_LINES - suggestion.rows;
            writeOutput(
              ansi.cursorHide +
                ansi.cursorSavePosition +
                eraseLinesBelow(MAX_LINES) +
                (offset > 0 ? ansi.cursorUp(offset) : "") +
                suggestion.data +
                ansi.cursorRestorePosition +
                ansi.cursorShow,
            );
          }
        } else {
          if (term.getCursorState().remainingLines < MAX_LINES) {
            writeOutput(ansi.cursorHide + ansi.cursorSavePosition + ansi.cursorUp() + suggestion.data + ansi.cursorRestorePosition + ansi.cursorShow);
          } else {
            writeOutput(
              ansi.cursorHide +
                ansi.cursorSavePosition +
                ansi.cursorNextLine.repeat(suggestion.rows) +
                suggestion.data +
                ansi.cursorRestorePosition +
                ansi.cursorShow,
            );
          }
        }
        hasActiveSuggestions = true;
      } else {
        if (hasActiveSuggestions) {
          if (term.getCursorState().remainingLines <= MAX_LINES) {
            writeOutput(
              ansi.cursorHide +
                ansi.cursorSavePosition +
                ansi.cursorPrevLine.repeat(MAX_LINES) +
                term.getCells(MAX_LINES, "above") +
                ansi.cursorRestorePosition +
                ansi.cursorShow,
            );
          } else {
            writeOutput(ansi.cursorHide + ansi.cursorSavePosition + eraseLinesBelow(MAX_LINES) + ansi.cursorRestorePosition + ansi.cursorShow);
          }
        }
        hasActiveSuggestions = false;
      }
      previousSuggestionsRows = suggestion.rows;
    });
  });

  process.stdin.on("keypress", (...keyPress: KeyPressEvent) => {
    const press = keyPress[1];
    const inputHandled = suggestionManager.update(press);
    if (previousSuggestionsRows > 0 && inputHandled) {
      term.noop();
    } else if (!inputHandled) {
      if (press.name == "backspace") {
        term.write(getBackspaceSequence(keyPress, shell));
      } else {
        term.write(press.sequence);
      }
    }
  });

  term.onExit(({ exitCode }) => {
    if (parentTermExit && process.ppid) {
      process.kill(process.ppid);
    }
    process.exit(exitCode);
  });
  process.stdout.on("resize", () => {
    term.resize(process.stdout.columns, process.stdout.rows);
  });
};
