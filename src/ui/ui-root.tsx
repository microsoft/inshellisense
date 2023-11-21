// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { inputModifier } from "./input.js";
import log from "../utils/log.js";
import { Shell } from "../utils/bindings.js";
import isterm from "../isterm/index.js";
import { eraseLinesBelow, scrollDown } from "../utils/ansi.js";
import ansi from "ansi-escapes";

export const render = async () => {
  await log.reset();
  const term = isterm.spawn({ shell: Shell.Bash, rows: process.stdout.rows, cols: process.stdout.columns });
  let hasActiveSuggestions = false;
  process.stdin.setRawMode(true);

  const writeOutput = (data: string) => {
    log.debug({ msg: "writing data", data });
    process.stdout.write(data);
  };

  term.onData((data) => {
    // note: when data is coming in, the cursor will be in the bottom left of the draw area
    const suggestion = { data: "\u001b[m" + ansi.cursorPrevLine + "tomato 1" + ansi.cursorNextLine + "tomato 2", columns: 2 };
    const commandState = term.getCommandState();
    log.debug({ msg: "ui state", term: commandState.cursorTerminated, text: commandState.commandText, hasActive: hasActiveSuggestions });
    if (commandState.cursorTerminated && commandState.commandText) {
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
          writeOutput(scrollDown(suggestion.columns) + ansi.cursorDown(suggestion.columns) + data);
        } else {
          writeOutput(ansi.cursorHide + ansi.cursorSavePosition + eraseLinesBelow(suggestion.columns) + ansi.cursorRestorePosition + data + ansi.cursorShow);
        }
      } else {
        writeOutput(data);
      }
      hasActiveSuggestions = false;
    }
  });
  process.stdin.on("data", (d: Buffer) => {
    term.write(inputModifier(d));
  });

  term.onExit(({ exitCode }) => {
    process.exit(exitCode);
  });
  process.stdout.on("resize", () => {
    term.resize(process.stdout.columns, process.stdout.rows);
  });
};

await render();
