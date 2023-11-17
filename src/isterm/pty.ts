// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { EventEmitter } from "node:events";
import process from "node:process";
import fs from "node:fs";
import os from "node:os";

import pty, { IPty, IEvent } from "node-pty";
import { Shell } from "../utils/bindings.js";
import { IsTermOscPs, IstermOscPt } from "../utils/ansi.js";
import xterm from "xterm-headless";
import { CommandManager } from "./commandManager.js";
import { inputModifier } from "./input.js";

const ISTermOnDataEvent = "data";

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
  readonly #commandManager: CommandManager;

  constructor(shell: Shell, rows: number, cols: number) {
    this.#pty = pty.spawn(convertToPtyTarget(shell), [], {
      name: "xterm-256color",
      cols,
      rows,
      cwd: process.cwd(),
      env: process.env,
    });
    this.pid = this.#pty.pid;
    this.cols = this.#pty.cols;
    this.rows = this.#pty.rows;
    this.process = this.#pty.process;

    this.#term = new xterm.Terminal({ allowProposedApi: true });
    this.#term.parser.registerOscHandler(IsTermOscPs, (data) => this._handleIsSequence(data));
    this.#term.parser.registerCsiHandler({ final: "J" }, (params) => {
      if (params.at(0) == 3 || params.at(0) == 2) {
        this.#commandManager.handleClear();
      }
      return false;
    });
    this.#commandManager = new CommandManager(this.#term, shell);

    this.#ptyEmitter = new EventEmitter();
    this.#pty.onData((data) => {
      this.#term.write(data, () => {
        this.#commandManager.termSync();
        this.#ptyEmitter.emit(ISTermOnDataEvent, data);
      });
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

  _handleIsSequence(data: string): boolean {
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
  return new ISTerm(shell, rows, cols);
};

const convertToPtyTarget = (shell: Shell): string => {
  return os.platform() == "win32" ? `${shell}.exe` : shell;
};

const ptyProcess = spawn(Shell.Pwsh, 30, 80);
process.stdin.setRawMode(true);
ptyProcess.onData((data) => {
  process.stdout.write(data);
});
process.stdin.on("data", (d: Buffer) => {
  ptyProcess.write(inputModifier(d));
});

ptyProcess.onExit(({ exitCode }) => {
  process.exit(exitCode);
});
