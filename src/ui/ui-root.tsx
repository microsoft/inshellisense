// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { inputModifier } from "./input.js";
import log from "../utils/log.js";
import { Shell } from "../utils/bindings.js";
import isterm from "../isterm/index.js";
import { cursorTo } from "../utils/ansi.js";
import ansi from "ansi-escapes";

export const render = async () => {
  await log.reset();
  const term = isterm.spawn({ shell: Shell.Powershell, rows: process.stdout.rows, cols: process.stdout.columns });
  let hasActiveSuggestions = false;
  process.stdin.setRawMode(true);

  // TODO:
  /*
  flow:
    if on the end of a line in the terminal, request from the stdout the cursor position
    if the cursor position is at the bottom of the rows, add the scrolUp, cursorUp, else do nothing
    write the rest of the data from that callback


    each on data gets put into a resolve queue to be called in order, if an item gets marked as info requesting
  */

  term.onData((data) => {
    const commandState = term.getCommandState();
    log.debug({ msg: "ui state", term: commandState.cursorTerminated, text: commandState.commandText, hasActive: hasActiveSuggestions });
    if (commandState.cursorTerminated && commandState.commandText) {
      if (hasActiveSuggestions) {
        log.debug({ msg: "origin", data });
        if (term.getCursorState().onLastLine) {
          // eslint-disable-next-line no-control-regex
          for (const match of data.matchAll(/\x1b\[([0-9]+);([0-9]+)H/g)) {
            const [cupSequence, _, cursorX] = match;
            data = data.replaceAll(cupSequence, ansi.cursorTo(parseInt(cursorX) - 1, term.rows - 2));
          }
        }
        log.debug({
          msg: "has suggestions",
          last: term.getCursorState().onLastLine,
          res:
            ansi.cursorHide + ansi.cursorSavePosition + ansi.cursorNextLine + ansi.eraseLine + "tomato" + ansi.cursorRestorePosition + data + ansi.cursorShow,
        });
        process.stdout.write(
          ansi.cursorHide + ansi.cursorSavePosition + ansi.cursorNextLine + ansi.eraseLine + "tomato" + ansi.cursorRestorePosition + data + ansi.cursorShow,
        );
      } else {
        if (term.getCursorState().onLastLine) {
          process.stdout.write(ansi.cursorHide + ansi.cursorSavePosition + "\n" + "tomato" + ansi.cursorRestorePosition + ansi.cursorUp(1));
          log.debug({
            msg: "no suggestions, end of line",
            res: data + ansi.cursorShow,
          });
          process.stdout.write(data + ansi.cursorShow);
        } else {
          process.stdout.write(ansi.cursorHide + ansi.cursorSavePosition + "\n" + "tomato" + ansi.cursorRestorePosition);
          log.debug({
            msg: "no suggestions",
            res: ansi.cursorHide + ansi.cursorSavePosition + "\n" + "tomato" + ansi.cursorRestorePosition + data + ansi.cursorShow,
          });
          process.stdout.write(data + ansi.cursorShow);
        }
      }
      hasActiveSuggestions = true;
    } else {
      if (hasActiveSuggestions) {
        if (term.getCursorState().onLastLine) {
          process.stdout.write("\u001B[1T" + ansi.cursorDown() + data);
        } else {
          const resp = ansi.cursorHide + ansi.cursorSavePosition + ansi.cursorNextLine + ansi.eraseLine + ansi.cursorRestorePosition + data + ansi.cursorShow;
          log.debug({ msg: "ui return had active suggestion", resp });
          process.stdout.write(resp);
        }
      } else {
        log.debug({ msg: "ui return no active suggestion", resp: data });
        process.stdout.write(data);
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
