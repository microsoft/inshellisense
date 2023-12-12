// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { EventEmitter } from "node:events";
import process from "node:process";
import os from "node:os";
import path from "node:path";
import url from "node:url";

import pty, { IPty, IEvent } from "node-pty";
import { Shell, userZdotdir, zdotdir } from "../utils/shell.js";
import { IsTermOscPs, IstermOscPt, IstermPromptStart, IstermPromptEnd } from "../utils/ansi.js";
import xterm from "xterm-headless";
import { CommandManager, CommandState } from "./commandManager.js";
import log from "../utils/log.js";
import { gitBashPath } from "../utils/shell.js";
import ansi from "ansi-escapes";
import styles from "ansi-styles";

const ISTermOnDataEvent = "data";

type ISTermOptions = {
  env?: { [key: string]: string | undefined };
  rows: number;
  cols: number;
  shell: Shell;
  shellArgs?: string[];
};

export class ISTerm implements IPty {
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
  readonly #commandManager: CommandManager;

  constructor({ shell, cols, rows, env, shellTarget, shellArgs }: ISTermOptions & { shellTarget: string }) {
    this.#pty = pty.spawn(shellTarget, shellArgs ?? [], {
      name: "xterm-256color",
      cols,
      rows,
      cwd: process.cwd(),
      env: { ...convertToPtyEnv(shell), ...env },
    });
    this.pid = this.#pty.pid;
    this.cols = this.#pty.cols;
    this.rows = this.#pty.rows;
    this.process = this.#pty.process;

    this.#term = new xterm.Terminal({ allowProposedApi: true, rows, cols });
    this.#term.parser.registerOscHandler(IsTermOscPs, (data) => this._handleIsSequence(data));
    this.#commandManager = new CommandManager(this.#term, shell);

    this.#ptyEmitter = new EventEmitter();
    this.#pty.onData((data) => {
      this.#term.write(data, () => {
        log.debug({ msg: "parsing data", data, bytes: Uint8Array.from([...data].map((c) => c.charCodeAt(0))) });
        this.#commandManager.termSync();
        this.#ptyEmitter.emit(ISTermOnDataEvent, data);
      });
    });

    this.onData = (listener) => {
      this.#ptyEmitter.on(ISTermOnDataEvent, listener);
      return {
        dispose: () => this.#ptyEmitter.removeListener(ISTermOnDataEvent, listener),
      };
    };
    this.onExit = this.#pty.onExit;
  }

  private _handleIsSequence(data: string): boolean {
    const argsIndex = data.indexOf(";");
    const sequence = argsIndex === -1 ? data : data.substring(0, argsIndex);
    switch (sequence) {
      case IstermOscPt.PromptStarted:
        this.#commandManager.handlePromptStart();
        break;
      case IstermOscPt.PromptEnded:
        this.#commandManager.handlePromptEnd();
        break;
      default:
        return false;
    }
    return true;
  }

  noop() {
    this.#ptyEmitter.emit(ISTermOnDataEvent, "");
  }

  resize(columns: number, rows: number) {
    this.cols = columns;
    this.rows = rows;
    this.#pty.resize(columns, rows);
    this.#term.resize(columns, rows);
  }

  clear() {
    this.#term.reset();
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
    log.debug({ msg: "reading data", data, bytes: Uint8Array.from([...data].map((c) => c.charCodeAt(0))) });
    this.#pty.write(data);
  }

  getCommandState(): CommandState {
    return this.#commandManager.getState();
  }

  getCursorState() {
    return {
      onLastLine: this.#term.buffer.active.cursorY >= this.#term.rows - 2,
      remainingLines: Math.max(this.#term.rows - 2 - this.#term.buffer.active.cursorY, 0),
      cursorX: this.#term.buffer.active.cursorX,
      cursorY: this.#term.buffer.active.cursorY,
    };
  }

  private _sameColor(baseCell: xterm.IBufferCell | undefined, targetCell: xterm.IBufferCell | undefined) {
    return (
      baseCell?.getBgColorMode() == targetCell?.getBgColorMode() &&
      baseCell?.getBgColor() == targetCell?.getBgColor() &&
      baseCell?.getFgColorMode() == targetCell?.getFgColorMode() &&
      baseCell?.getFgColor() == targetCell?.getFgColor()
    );
  }

  private _getAnsiColors(cell: xterm.IBufferCell | undefined): string {
    if (cell == null) return "";
    let bgAnsi = "";
    cell.getBgColor;
    cell.getFgColor;
    if (cell.isBgDefault()) {
      bgAnsi = "\x1b[49m";
    } else if (cell.isBgPalette()) {
      bgAnsi = `\x1b[48;5;${cell.getBgColor()}m`;
    } else {
      bgAnsi = `\x1b[48;5;${styles.hexToAnsi256(cell.getBgColor().toString(16))}m`;
    }

    let fgAnsi = "";
    if (cell.isFgDefault()) {
      fgAnsi = "\x1b[39m";
    } else if (cell.isFgPalette()) {
      fgAnsi = `\x1b[38;5;${cell.getFgColor()}m`;
    } else {
      fgAnsi = `\x1b[38;5;${styles.hexToAnsi256(cell.getFgColor().toString(16))}m`;
    }
    return bgAnsi + fgAnsi;
  }

  getCells(height: number, direction: "below" | "above") {
    const currentCursorPosition = this.#term.buffer.active.cursorY + this.#term.buffer.active.baseY;
    const writeLine = (y: number) => {
      const line = this.#term.buffer.active.getLine(y);
      const ansiLine = ["\x1b[0m"];
      if (line == null) return "";
      let prevCell: xterm.IBufferCell | undefined;
      for (let x = 0; x < line.length; x++) {
        const cell = line.getCell(x);
        const chars = cell?.getChars() ?? "";
        if (!this._sameColor(prevCell, cell)) {
          ansiLine.push(this._getAnsiColors(cell));
        }
        ansiLine.push(chars == "" ? " " : chars);
        prevCell = cell;
      }
      return ansiLine.join("");
    };

    const lines = [];
    if (direction == "above") {
      const startCursorPosition = currentCursorPosition - 1;
      const endCursorPosition = currentCursorPosition - 1 - height;
      for (let y = startCursorPosition; y > endCursorPosition; y--) {
        lines.push(writeLine(y));
      }
    } else {
      const startCursorPosition = currentCursorPosition + 1;
      const endCursorPosition = currentCursorPosition + 1 + height;
      for (let y = startCursorPosition; y < endCursorPosition; y++) {
        lines.push(writeLine(y));
      }
    }
    return lines.reverse().join(ansi.cursorNextLine);
  }
}

export const spawn = async (options: ISTermOptions): Promise<ISTerm> => {
  const { shellTarget, shellArgs } = await convertToPtyTarget(options.shell);
  return new ISTerm({ ...options, shellTarget, shellArgs });
};

const convertToPtyTarget = async (shell: Shell) => {
  const platform = os.platform();
  const shellTarget = shell == Shell.Bash && platform == "win32" ? await gitBashPath() : platform == "win32" ? `${shell}.exe` : shell;
  const shellFolderPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..", "shell");
  let shellArgs: string[] = [];

  switch (shell) {
    case Shell.Bash:
      shellArgs = ["--init-file", path.join(shellFolderPath, "shellIntegration.bash")];
      break;
    case (Shell.Powershell, Shell.Pwsh):
      shellArgs = ["-noexit", "-command", `try { . "${path.join(shellFolderPath, "shellIntegration.ps1")}" } catch {}`];
      break;
    case Shell.Fish:
      shellArgs = ["--init-command", `. ${path.join(shellFolderPath, "shellIntegration.fish").replace(/(\s+)/g, "\\$1")}`];
      break;
  }

  return { shellTarget, shellArgs };
};

const convertToPtyEnv = (shell: Shell) => {
  switch (shell) {
    case Shell.Cmd: {
      const prompt = process.env.PROMPT ? process.env.PROMPT : "$P$G";
      return { ...process.env, PROMPT: `${IstermPromptStart}${prompt}${IstermPromptEnd}` };
    }
    case Shell.Zsh: {
      return { ...process.env, ZDOTDIR: zdotdir, USER_ZDOTDIR: userZdotdir };
    }
  }
  return process.env;
};
