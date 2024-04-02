// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { EventEmitter } from "node:events";
import process from "node:process";
import os from "node:os";
import path from "node:path";
import url from "node:url";
import fs from "node:fs";

import pty, { IPty, IEvent } from "@homebridge/node-pty-prebuilt-multiarch";
import { Shell, userZdotdir, zdotdir } from "../utils/shell.js";
import { IsTermOscPs, IstermOscPt, IstermPromptStart, IstermPromptEnd } from "../utils/ansi.js";
import xterm from "@xterm/headless";
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
  underTest: boolean;
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
  cwd: string = "";

  readonly #pty: IPty;
  readonly #ptyEmitter: EventEmitter;
  readonly #term: xterm.Terminal;
  readonly #commandManager: CommandManager;
  readonly #shell: Shell;

  constructor({ shell, cols, rows, env, shellTarget, shellArgs, underTest }: ISTermOptions & { shellTarget: string }) {
    this.#pty = pty.spawn(shellTarget, shellArgs ?? [], {
      name: "xterm-256color",
      cols,
      rows,
      cwd: process.cwd(),
      env: { ...convertToPtyEnv(shell, underTest), ...env },
    });
    this.pid = this.#pty.pid;
    this.cols = this.#pty.cols;
    this.rows = this.#pty.rows;
    this.process = this.#pty.process;

    this.#term = new xterm.Terminal({ allowProposedApi: true, rows, cols });
    this.#term.parser.registerOscHandler(IsTermOscPs, (data) => this._handleIsSequence(data));
    this.#commandManager = new CommandManager(this.#term, shell);
    this.#shell = shell;

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
  on(event: "data", listener: (data: string) => void): void;
  on(event: "exit", listener: (exitCode: number, signal?: number | undefined) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  on(_event: unknown, _listener: unknown): void {
    throw new Error("Method not implemented as deprecated in node-pty.");
  }

  private _deserializeIsMessage(message: string): string {
    return message.replaceAll(/\\(\\|x([0-9a-f]{2}))/gi, (_match: string, op: string, hex?: string) => (hex ? String.fromCharCode(parseInt(hex, 16)) : op));
  }

  private _sanitizedCwd(cwd: string): string {
    if (cwd.match(/^['"].*['"]$/)) {
      cwd = cwd.substring(1, cwd.length - 1);
    }
    // Convert a drive prefix to windows style when using Git Bash
    if (os.platform() === "win32" && this.#shell == Shell.Bash && cwd && cwd.match(/^\/[A-z]{1}\//)) {
      cwd = `${cwd[1]}:\\` + cwd.substring(3, cwd.length);
    }
    // Make the drive letter uppercase on Windows (see vscode #9448)
    if (os.platform() === "win32" && cwd && cwd[1] === ":") {
      return cwd[0].toUpperCase() + cwd.substring(1);
    }
    return cwd;
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
      case IstermOscPt.CurrentWorkingDirectory: {
        const cwd = data.split(";").at(1);
        if (cwd != null) {
          this.cwd = path.resolve(this._sanitizedCwd(this._deserializeIsMessage(cwd)));
        }
        break;
      }
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

  private _sameAccent(baseCell: xterm.IBufferCell | undefined, targetCell: xterm.IBufferCell | undefined) {
    return baseCell?.isBold() == targetCell?.isBold() && baseCell?.isItalic() == targetCell?.isItalic() && baseCell?.isUnderline() == targetCell?.isUnderline();
  }

  private _getAnsiAccents(cell: xterm.IBufferCell | undefined): string {
    if (cell == null) return "";
    let boldAnsi = "";
    if (cell.isBold()) {
      boldAnsi = "\x1b[1m";
    }
    let italicAnsi = "";
    if (cell.isItalic()) {
      italicAnsi = "\x1b[3m";
    }
    let underlineAnsi = "";
    if (cell.isUnderline()) {
      underlineAnsi = "\x1b[4m";
    }
    return boldAnsi + italicAnsi + underlineAnsi;
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
        if (!this._sameAccent(prevCell, cell)) {
          ansiLine.push(this._getAnsiAccents(cell));
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
  const { shellTarget, shellArgs } = await convertToPtyTarget(options.shell, options.underTest);
  return new ISTerm({ ...options, shellTarget, shellArgs });
};

const convertToPtyTarget = async (shell: Shell, underTest: boolean) => {
  const platform = os.platform();
  const shellTarget = shell == Shell.Bash && platform == "win32" ? await gitBashPath() : platform == "win32" ? `${shell}.exe` : shell;
  const shellFolderPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..", "shell");
  let shellArgs: string[] = [];

  switch (shell) {
    case Shell.Bash:
      shellArgs = ["--init-file", path.join(shellFolderPath, "shellIntegration.bash")];
      break;
    case Shell.Powershell:
    case Shell.Pwsh:
      shellArgs = ["-noexit", "-command", `try { . "${path.join(shellFolderPath, "shellIntegration.ps1")}" } catch {}`];
      break;
    case Shell.Fish:
      shellArgs = ["--init-command", `. ${path.join(shellFolderPath, "shellIntegration.fish").replace(/(\s+)/g, "\\$1")}`];
      break;
    case Shell.Xonsh: {
      const sharedConfig = os.platform() == "win32" ? path.join("C:\\ProgramData", "xonsh", "xonshrc") : path.join("etc", "xonsh", "xonshrc");
      const userConfigs = [
        path.join(os.homedir(), ".xonshrc"),
        path.join(os.homedir(), ".config", "xonsh", "rc.xsh"),
        path.join(os.homedir(), ".config", "xonsh", "rc.d"),
      ];
      const configs = [sharedConfig, ...userConfigs].filter((config) => fs.existsSync(config));
      shellArgs = ["--rc", ...configs, path.join(shellFolderPath, "shellIntegration.xsh")];
      break;
    }
    case Shell.Nushell:
      shellArgs = ["-e", `source \`${path.join(shellFolderPath, "shellIntegration.nu")}\``];
      if (underTest) shellArgs.push("-n");
      break;
  }

  return { shellTarget, shellArgs };
};

const convertToPtyEnv = (shell: Shell, underTest: boolean) => {
  const env: Record<string, string> = {
    ...process.env,
    ISTERM: "1",
  };
  if (underTest) env.ISTERM_TESTING = "1";

  switch (shell) {
    case Shell.Cmd: {
      if (underTest) {
        return { ...env, PROMPT: `${IstermPromptStart}$G ${IstermPromptEnd}` };
      }
      const prompt = process.env.PROMPT ? process.env.PROMPT : "$P$G";
      return { ...env, PROMPT: `${IstermPromptStart}${prompt}${IstermPromptEnd}` };
    }
    case Shell.Zsh: {
      return { ...env, ZDOTDIR: zdotdir, USER_ZDOTDIR: userZdotdir };
    }
  }

  return env;
};
