// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { inputModifier } from "./input.js";
import log from "../utils/log.js";
import { Shell } from "../utils/bindings.js";
import isterm from "../isterm/index.js";
import { eraseLinesBelow, scrollDown } from "../utils/ansi.js";
import ansi from "ansi-escapes";
import { SuggestionManager, MAX_LINES } from "./suggestionManager.js";

export const render = async () => {
  await log.reset();
  const term = isterm.spawn({ shell: Shell.Bash, rows: process.stdout.rows, cols: process.stdout.columns });
  const suggestionManager = new SuggestionManager(term);
  let hasActiveSuggestions = false;
  let previousSuggestionsColumns = 0;
  let addedLines = 0;
  process.stdin.setRawMode(true);

  const writeOutput = (data: string) => {
    log.debug({ msg: "writing data", data });
    process.stdout.write(data);
  };

  writeOutput(ansi.clearTerminal);

  term.onData((data) => {
    if (term.getCursorState().onLastLine) {
      // eslint-disable-next-line no-control-regex
      for (const match of data.matchAll(/\x1b\[([0-9]+);([0-9]+)H/g)) {
        const [cupSequence, _, cursorX] = match;
        data = data.replaceAll(cupSequence, ansi.cursorTo(parseInt(cursorX) - 1, term.rows - 1 - addedLines));
      }
    }
    writeOutput(data);

    setImmediate(async () => {
      const suggestion = await suggestionManager.render();
      addedLines = suggestion.columns;
      const commandState = term.getCommandState();

      log.debug({ msg: "debug d", columns: suggestion.columns });
      if (suggestion.data != "" && commandState.cursorTerminated) {
        if (hasActiveSuggestions) {
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
        } else {
          if (term.getCursorState().onLastLine) {
            writeOutput(
              ansi.cursorHide +
                ansi.cursorSavePosition +
                "\n".repeat(suggestion.columns) +
                suggestion.data +
                ansi.cursorRestorePosition +
                ansi.cursorUp(suggestion.columns) +
                ansi.cursorShow,
            );
          } else {
            writeOutput(
              ansi.cursorHide + ansi.cursorSavePosition + "\n".repeat(suggestion.columns) + suggestion.data + ansi.cursorRestorePosition + ansi.cursorShow,
            );
          }
        }
        hasActiveSuggestions = true;
      } else {
        if (hasActiveSuggestions) {
          if (term.getCursorState().onLastLine) {
            writeOutput(scrollDown(previousSuggestionsColumns) + ansi.cursorDown(previousSuggestionsColumns));
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
    const handled = suggestionManager.update(d);
    if (previousSuggestionsColumns > 0 && handled) {
      term.write("\u001B[m");
    } else {
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

await render();
