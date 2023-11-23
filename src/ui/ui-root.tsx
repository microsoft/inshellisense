// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { inputModifier } from "./input.js";
import log from "../utils/log.js";
import { Shell } from "../utils/bindings.js";
import isterm from "../isterm/index.js";
import { eraseLinesBelow, scrollDown } from "../utils/ansi.js";
import ansi from "ansi-escapes";
import { SuggestionManager } from "./suggestionManager.js";

export const render = async () => {
  await log.reset();
  const term = isterm.spawn({ shell: Shell.Bash, rows: process.stdout.rows, cols: process.stdout.columns });
  const suggestionManager = new SuggestionManager(term);
  let hasActiveSuggestions = false;
  let previousSuggestionsColumns = 0;
  process.stdin.setRawMode(true);

  const writeOutput = (data: string) => {
    log.debug({ msg: "writing data", data });
    process.stdout.write(data);
  };

  writeOutput(ansi.clearTerminal);

  term.onData(async (data) => {
    // note: when data is coming in, the cursor will be in the bottom left of the draw area
    const suggestion = await suggestionManager.render();
    const commandState = term.getCommandState();
    if (suggestion.data != "" && commandState.cursorTerminated) {
      if (hasActiveSuggestions) {
        log.debug({ msg: "origin", data });
        if (term.getCursorState().onLastLine) {
          // eslint-disable-next-line no-control-regex
          for (const match of data.matchAll(/\x1b\[([0-9]+);([0-9]+)H/g)) {
            const [cupSequence, _, cursorX] = match;
            data = data.replaceAll(cupSequence, ansi.cursorTo(parseInt(cursorX) - 1, term.rows - 1 - suggestion.columns));
          }
        }
        writeOutput(
          ansi.cursorHide +
            ansi.cursorSavePosition +
            eraseLinesBelow(suggestion.columns) +
            suggestion.data +
            ansi.cursorRestorePosition +
            data +
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
              data +
              ansi.cursorShow,
          );
        } else {
          writeOutput(
            ansi.cursorHide + ansi.cursorSavePosition + "\n".repeat(suggestion.columns) + suggestion.data + ansi.cursorRestorePosition + data + ansi.cursorShow,
          );
        }
      }
      hasActiveSuggestions = true;
    } else {
      if (hasActiveSuggestions) {
        if (term.getCursorState().onLastLine) {
          writeOutput(scrollDown(previousSuggestionsColumns) + ansi.cursorDown(previousSuggestionsColumns) + data);
        } else {
          writeOutput(
            ansi.cursorHide + ansi.cursorSavePosition + eraseLinesBelow(previousSuggestionsColumns) + ansi.cursorRestorePosition + data + ansi.cursorShow,
          );
        }
      } else {
        writeOutput(data);
      }
      hasActiveSuggestions = false;
    }
    previousSuggestionsColumns = suggestion.columns;
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
