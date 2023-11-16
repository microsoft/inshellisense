// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from "node:os";
import pty from "node-pty";
import process from "node:process";
import ansiEscapes from "ansi-escapes";
import fs from "node:fs";

const shell = os.platform() === "win32" ? "pwsh.exe" : "bash";
// const CursorColor = "#FFFFFF";
const ptyProcess = pty.spawn(shell, [], {
  name: "xterm-color",
  cols: 80,
  rows: 30,
  cwd: process.env.HOME,
  env: process.env,
});

/*
How to tell what's in the current input buffer. 
- once a user inputs actionable item (arrow key, normal key press, tab, space), we consider the input buffer live. 
  we close the input buffer once ENTER, ^C, ^D have been entered
  evaluated the echoed text with escapes, respect backspaces, back clears, line clears, etc. we consider this to the be input buffer

  cases to test in Fig:
    - backsearch
    - starting a TUI app
    - starting a sub terminal
*/

process.stdin.setRawMode(true);
ptyProcess.onData((data) => {
  process.stdout.write(data);
});

setTimeout(() => {
  process.stdout.write(ansiEscapes.cursorBackward(10));
}, 5_000);

setTimeout(() => {
  process.stdout.write(ansiEscapes.cursorShow);
  ptyProcess.kill();
}, 10_000);

// let userInputBuff = "";
// let showingAssist = false;

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
// process.stdin.on("data", (d: Buffer) => {
//   userInputBuff += d.toString();
//   ptyProcess.write(d.toString());
// });

// setTimeout(() => {
//   process.stdout.write(ansiEscapes.cursorShow);
//   ptyProcess.kill();
// }, 10_000);
