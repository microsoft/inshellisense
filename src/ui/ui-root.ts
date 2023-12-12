// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { inputModifier } from "./input.js";
import log from "../utils/log.js";
import { Shell } from "../utils/shell.js";
import isterm from "../isterm/index.js";
import { eraseLinesBelow } from "../utils/ansi.js";
import ansi from "ansi-escapes";
import { SuggestionManager, MAX_LINES } from "./suggestionManager.js";

export const render = async (shell: Shell) => {
  const term = await isterm.spawn({ shell, rows: process.stdout.rows, cols: process.stdout.columns });
  const suggestionManager = new SuggestionManager(term);
  let hasActiveSuggestions = false;
  let previousSuggestionsColumns = 0;
  process.stdin.setRawMode(true);

  const writeOutput = (data: string) => {
    log.debug({ msg: "writing data", data });
    process.stdout.write(data);
  };

  writeOutput(ansi.clearTerminal);

  term.onData((data) => {
    const commandState = term.getCommandState();
    if ((commandState.hasOutput || hasActiveSuggestions) && !commandState.persistentOutput) {
      if (term.getCursorState().remainingLines < previousSuggestionsColumns) {
        writeOutput(
          ansi.cursorHide +
            ansi.cursorSavePosition +
            ansi.cursorPrevLine.repeat(MAX_LINES) +
            term.getCells(MAX_LINES, "above") +
            ansi.cursorRestorePosition +
            ansi.cursorShow +
            data,
        );
      } else {
        writeOutput(ansi.cursorHide + ansi.cursorSavePosition + eraseLinesBelow(MAX_LINES + 1) + ansi.cursorRestorePosition + ansi.cursorShow + data);
      }
    } else {
      writeOutput(data);
    }

    setImmediate(async () => {
      const suggestion = await suggestionManager.render();
      const commandState = term.getCommandState();

      if (suggestion.data != "" && commandState.cursorTerminated && !commandState.hasOutput) {
        if (hasActiveSuggestions) {
          if (term.getCursorState().remainingLines < suggestion.columns) {
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
            const offset = MAX_LINES - suggestion.columns;
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
          if (term.getCursorState().remainingLines < suggestion.columns) {
            writeOutput(ansi.cursorHide + ansi.cursorSavePosition + ansi.cursorUp() + suggestion.data + ansi.cursorRestorePosition + ansi.cursorShow);
          } else {
            writeOutput(
              ansi.cursorHide +
                ansi.cursorSavePosition +
                ansi.cursorNextLine.repeat(suggestion.columns) +
                suggestion.data +
                ansi.cursorRestorePosition +
                ansi.cursorShow,
            );
          }
        }
        hasActiveSuggestions = true;
      } else {
        if (hasActiveSuggestions) {
          if (term.getCursorState().remainingLines < previousSuggestionsColumns) {
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
      previousSuggestionsColumns = suggestion.columns;
    });
  });
  process.stdin.on("data", (d: Buffer) => {
    const suggestionResult = suggestionManager.update(d);
    if (previousSuggestionsColumns > 0 && suggestionResult == "handled") {
      term.noop();
    } else if (suggestionResult != "fully-handled") {
      term.write(inputModifier(d));
    }
  });

  term.onExit(({ exitCode }) => {
    process.exit(exitCode);
  });
  process.stdout.on("resize", () => {
    term.resize(process.stdout.columns, process.stdout.rows);
  });
};
