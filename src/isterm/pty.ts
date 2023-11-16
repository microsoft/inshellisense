// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { EventEmitter } from "node:events";
import process from "node:process";
import fs from "node:fs";

import pty, { IPty, IEvent } from "node-pty";
import { Shell } from "../utils/bindings.js";
import escape from "../utils/escape.js";
import xterm from "xterm-headless";

const ISTermOnDataEvent = "data";

//ESC ]
//  Operating System Command (OSC  is 0x9d).
//OSC Ps ; Pt BEL

/*
  On unix, the OSC symbols will be in the correct place, so we can just parse them where they lay (start prompt, end prompt)
  On windows, the OSC symbols will come during the parsing phase so we know that the incoming line will contain the prompt, once it's found,
    extract the data from the cells using the heurisitcs
*/

// these combined with a way of providing a custom match for a specific host

// git bash default prompt
// .*MINGW64.*\n$

// const pwshPrompt = lineText.match(/(?<prompt>(\(.+\)\s)?(?:PS.+>\s?))/)?.groups?.prompt;

// Custom prompts like starship end in the common \u276f character
// const customPrompt = lineText.match(/.*\u276f(?=[^\u276f]*$)/g)?.[0];

// const cmdMatch = lineText.match(/^(?<prompt>(\(.+\)\s)?(?:[A-Z]:\\.*>))/)?.groups?.prompt;

class ISTerm implements IPty {
  readonly pid: number;
  cols: number;
  rows: number;
  readonly process: string;
  readonly handleFlowControl = false;
  readonly onData: IEvent<string>;
  readonly onExit: IEvent<{ exitCode: number; signal?: number }>;
  shellBuffer?: string;

  readonly #pty: IPty;
  readonly #ptyEmitter: EventEmitter;
  readonly #term: xterm.Terminal;

  constructor(shell: string, rows: number, cols: number) {
    this.#pty = pty.spawn(shell, [], {
      name: "inshelliterm",
      cols,
      rows,
      cwd: process.cwd(),
      env: process.env,
    });
    this.pid = this.#pty.pid;
    this.cols = this.#pty.cols;
    this.rows = this.#pty.rows;
    this.process = this.#pty.process;

    // let currentLine = 0;
    // let promptLine = -1;
    // let prompt: string | undefined = undefined;

    this.#term = new xterm.Terminal({ allowProposedApi: true });

    // this.#term.onLineFeed(() => {
    //   currentLine += 1;
    // });

    this.#ptyEmitter = new EventEmitter();
    this.#pty.onData((data) => {
      // if (data.includes("__is-prompt-start__")) {
      //   promptLine = currentLine + data.slice(data.indexOf("__is-prompt-start__"), data.indexOf("__is-prompt-end__")).split("\n").length - 1;
      //   prompt = data
      //     .slice(data.indexOf("__is-prompt-start__") + "__is-prompt-start__".length, data.indexOf("__is-prompt-end__"))
      //     .split("\n")
      //     .at(-1);
      // }
      // if (promptLine != null && !promptLine.prompt) {
      //   promptLine.prompt = this.#term.buffer.active.getLine(promptLine.lineNumber)?.translateToString(true) ?? "";
      // }
      // if (promptLine != -1) {
      //   const line = this.#term.buffer.active.getLine(promptLine);
      //   let activeBuff = "";
      //   let suggestionBuff = "";
      //   for (let i = 0; i < this.#term.cols; i++) {
      //     const cell = line?.getCell(i);
      //     if (cell == null) continue;
      //     if (cell.getFgColor() != 238) {
      //       activeBuff += cell.getChars();
      //     } else {
      //       suggestionBuff += cell.getChars();
      //     }
      //   }
      //   const cleanedActiveBuff = activeBuff.slice(prompt?.length ?? 0);
      //   fs.appendFileSync("log.txt", JSON.stringify({ activeBuff: cleanedActiveBuff, suggestionBuff, prompt }) + "\n");
      // }

      // fs.appendFileSync("log.txt", data);
      // const cleanedData = data.replaceAll("__is-prompt-start__", "").replaceAll("__is-prompt-end__", "");

      // LOGGING
      // if (promptLine != null) {
      //   fs.appendFileSync("log.txt", JSON.stringify({ prompt: promptLine }) + "\n");
      // }
      // END LOGGING

      this.#term.write(data, () => this.#ptyEmitter.emit(ISTermOnDataEvent, data));
    });

    this.onData = (listener) => {
      this.#ptyEmitter.on(ISTermOnDataEvent, listener);
      this.#ptyEmitter.on(ISTermOnDataEvent, (data) => {
        fs.appendFileSync("log.txt", JSON.stringify({ data }) + "\n");
      });
      return {
        dispose: () => this.#ptyEmitter.removeListener(ISTermOnDataEvent, listener),
      };
    };
    this.onExit = this.#pty.onExit;
  }

  resize(columns: number, rows: number) {
    this.cols = columns;
    this.rows = rows;
    this.#pty.resize(columns, rows);
  }

  clear() {
    this.#pty.clear();
  }

  kill(signal?: string) {
    this.#pty.kill(signal);
  }

  pause(): void {
    this.#pty.pause();
  }

  resume(): void {
    this.#pty.resume();
  }

  write(data: string): void {
    this.#pty.write(data);
  }
}

export const spawn = (shell: Shell, rows: number, cols: number): IPty => {
  const resolvedShell = shell == Shell.Pwsh ? "pwsh.exe" : "bash";
  return new ISTerm(resolvedShell, rows, cols);
};

const ptyProcess = spawn(Shell.Pwsh, 30, 300);
process.stdin.setRawMode(true);
ptyProcess.onData((data) => {
  process.stdout.write(data);
});
process.stdin.on("data", (d: Buffer) => {
  ptyProcess.write(d.toString());
});

ptyProcess.onExit(({ exitCode }) => {
  process.exit(exitCode);
});

setTimeout(() => {
  process.stdout.write(escape.cursorShow);
  ptyProcess.kill();
}, 30_000);

// ptyProcess.onData((data) => {
//   fs.appendFileSync("log.txt", "$$data: " + data + "\n");
//   let output = "";
//   if (showingAssist) {
//     output += ansiEscapes.eraseLine;
//   }
//   output += data;
//   if (userInputBuff.startsWith("git")) {
//     showingAssist = true;
//     output += "\ntomato";
//   } else {
//     showingAssist = false;
//   }
//   output += ansiEscapes.cursorHide;
//   fs.appendFileSync("log.txt", "$$output: " + output + "\n");
//   if (data == "\x1b[m") {
//     process.stdout.write(data);
//   } else {
//     process.stdout.write(output);
//   }
// });
