// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { EventEmitter } from "node:events";
import process from "node:process";
import os from "node:os";

import pty, { IPty, IEvent } from "node-pty";
import { Shell } from "../utils/bindings.js";
import { IsTermOscPs, IstermOscPt, IstermPromptStart, IstermPromptEnd } from "../utils/ansi.js";
import xterm from "xterm-headless";
import { CommandManager, CommandState } from "./commandManager.js";
import log from "../utils/log.js";
// import { inputModifier } from "./input.js";

const ISTermOnDataEvent = "data";

type ISTermOptions = {
  env?: { [key: string]: string | undefined };
  rows: number;
  cols: number;
  shell: Shell;
};

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

  constructor({ shell, cols, rows, env }: ISTermOptions) {
    this.#pty = pty.spawn(convertToPtyTarget(shell), [], {
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

    this.#term = new xterm.Terminal({ allowProposedApi: true });
    this.#term.parser.registerOscHandler(IsTermOscPs, (data) => this._handleIsSequence(data));
    this.#commandManager = new CommandManager(this.#term, shell);

    this.#ptyEmitter = new EventEmitter();
    this.#pty.onData((data) => {
      this.#term.write(data, () => {
        log.debug(JSON.stringify({ msg: "parsing data", data, bytes: Uint8Array.from([...data].map((c) => c.charCodeAt(0))) }));
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
    log.debug(JSON.stringify({ msg: "reading data", data, bytes: Uint8Array.from([...data].map((c) => c.charCodeAt(0))) }));
    this.#pty.write(data);
  }

  getCommandState(): CommandState {
    return this.#commandManager.getState();
  }
}

export const spawn = (options: ISTermOptions): ISTerm => {
  return new ISTerm(options);
};

const convertToPtyTarget = (shell: Shell): string => {
  return os.platform() == "win32" ? `${shell}.exe` : shell;
};

const convertToPtyEnv = (shell: Shell) => {
  switch (shell) {
    case Shell.Cmd: {
      const prompt = process.env.PROMPT ? process.env.PROMPT : "$P$G";
      return { ...process.env, PROMPT: `${IstermPromptStart}${prompt}${IstermPromptEnd}` };
    }
  }
  return process.env;
};

// TODO bring up to higher level outside isterm
// await log.reset();
// const ptyProcess = spawn(Shell.Pwsh, process.stdout.rows, process.stdout.columns);
// process.stdin.setRawMode(true);
// ptyProcess.onData((data) => {
//   process.stdout.write(data);
// });
// process.stdin.on("data", (d: Buffer) => {
//   ptyProcess.write(inputModifier(d));
// });

// ptyProcess.onExit(({ exitCode }) => {
//   process.exit(exitCode);
// });
// process.stdout.on("resize", () => {
//   ptyProcess.resize(process.stdout.columns, process.stdout.rows);
// });
