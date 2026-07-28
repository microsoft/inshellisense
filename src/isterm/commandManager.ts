// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import convert from "color-convert";
import { IBufferCell, IBufferLine, IMarker, Terminal } from "@xterm/headless";
import { getShellPromptRewrites, Shell } from "../utils/shell.js";
import log from "../utils/log.js";
import { endTiming, startTiming } from "../utils/performance.js";

const rightPromptLookbackWidth = 5;
const commandWhitespaceTerminationWidth = 4;

type TerminalCommand = {
  promptStartMarker?: IMarker;
  promptEndMarker?: IMarker;
  promptEndX?: number;
  persistentOutput?: boolean;
} & CommandState;

export type CommandState = {
  promptText?: string;
  commandText?: string;
  suggestionsText?: string;
  hasOutput?: boolean;
  cursorTerminated?: boolean;
};

export class CommandManager {
  #activeCommand: TerminalCommand;
  #terminal: Terminal;
  #acceptedCommandLines: Set<number>;
  #shell: Shell;
  #promptRewrites: boolean;
  #state: CommandState = {};
  #stateVersion = 0;
  #suspended = false;

  constructor(terminal: Terminal, shell: Shell) {
    this.#terminal = terminal;
    this.#shell = shell;
    this.#activeCommand = {};
    this.#acceptedCommandLines = new Set();
    this.#promptRewrites = getShellPromptRewrites(shell);
    this.#terminal.buffer.onBufferChange((buffer) => {
      this.#suspended = buffer.type === "alternate";
      this._syncStateSnapshot();
    });

    this.#terminal.parser.registerCsiHandler({ final: "J" }, (params) => {
      if (params.at(0) == 3 || params.at(0) == 2) {
        this.handleClear();
      }
      return false;
    });
  }
  handlePromptStart() {
    if (this.#suspended) return;
    this.#activeCommand = { promptStartMarker: this.#terminal.registerMarker(0), hasOutput: false, cursorTerminated: false };
    this._syncStateSnapshot();
  }

  handlePromptEnd() {
    if (this.#suspended) return;
    if (this.#hasBeenAccepted()) {
      this.#activeCommand = {};
      this._syncStateSnapshot();
      return;
    }

    this.#activeCommand.promptEndMarker = this.#terminal.registerMarker(0);
    if (this.#activeCommand.promptEndMarker?.line === this.#terminal.buffer.active.baseY + this.#terminal.buffer.active.cursorY) {
      this.#activeCommand.promptEndX = this.#terminal.buffer.active.cursorX;
    }

    const promptLine = this.#terminal.buffer.active.getLine(this.#activeCommand.promptEndMarker?.line ?? 0);

    if (promptLine == null) return;
    const promptLineText = promptLine?.translateToString(true);
    this.#activeCommand.promptText = promptLineText;

    const hasRightPrompt = Array.from({ length: rightPromptLookbackWidth })
      .map((_, i) => promptLine?.length - 1 - i)
      .some((x) => promptLine.getCell(x)?.getChars().trim() != "");
    if (hasRightPrompt) {
      const whitespace = " ".repeat(commandWhitespaceTerminationWidth);
      const whitespaceIdx = promptLineText.indexOf(whitespace);
      if (whitespaceIdx != -1) {
        this.#activeCommand.promptText = promptLineText.substring(0, whitespaceIdx + 1);
        this.#activeCommand.promptEndX = whitespaceIdx + 1;
      }
    }
    this._syncStateSnapshot();
  }

  #hasBeenAccepted() {
    const commandLine = this.#activeCommand.promptStartMarker?.line ?? -1;
    const hasBeenAccepted = this.#acceptedCommandLines.has(commandLine) && commandLine != -1;
    return this.#promptRewrites && hasBeenAccepted; // this is a prompt + command that was accepted and is now being re-written by the shell for display purposes (e.g. nu)
  }

  handleClear() {
    this.handlePromptStart();
    this.#acceptedCommandLines.clear();
  }

  private _getFgPaletteColor(cell: IBufferCell | undefined): number | undefined {
    if (cell?.isFgDefault()) return 0;
    if (cell?.isFgPalette()) return cell.getFgColor();
    if (cell?.isFgRGB()) return convert.hex.ansi256(cell.getFgColor().toString(16));
  }

  private _isSuggestion(cell: IBufferCell | undefined): boolean {
    const color = this._getFgPaletteColor(cell);
    const dim = (cell?.isDim() ?? 0) > 0;
    const italic = (cell?.isItalic() ?? 0) > 0;
    const dullColor = color == 8 || color == 7 || (color ?? 0) > 235 || (color == 15 && dim);
    const dimItalic = dim || italic;
    if (this.#shell == Shell.Pwsh || this.#shell == Shell.Powershell) {
      return dimItalic;
    }
    return dullColor;
  }

  getState(): CommandState {
    return this.#state;
  }

  getStateVersion(): number {
    return this.#stateVersion;
  }

  private _syncStateSnapshot(): void {
    const state = this.#suspended
      ? {}
      : {
          promptText: this.#activeCommand.promptText,
          commandText: this.#activeCommand.commandText,
          suggestionsText: this.#activeCommand.suggestionsText,
          hasOutput: this.#activeCommand.hasOutput,
          cursorTerminated: this.#activeCommand.cursorTerminated,
        };
    if (
      state.promptText !== this.#state.promptText ||
      state.commandText !== this.#state.commandText ||
      state.suggestionsText !== this.#state.suggestionsText ||
      state.hasOutput !== this.#state.hasOutput ||
      state.cursorTerminated !== this.#state.cursorTerminated
    ) {
      this.#state = state;
      this.#stateVersion += 1;
    }
  }

  clearActiveCommand() {
    if (this.#suspended) return;
    this.#acceptedCommandLines.add(this.#activeCommand.promptEndMarker?.line ?? -1);
    this.#activeCommand = {};
    this._syncStateSnapshot();
  }

  private _getCommandLines(): IBufferLine[] {
    const lines = [];
    let lineY = this.#activeCommand.promptEndMarker!.line;
    let line = this.#terminal.buffer.active.getLine(this.#activeCommand.promptEndMarker!.line);
    const absoluteY = this.#terminal.buffer.active.baseY + this.#terminal.buffer.active.cursorY;
    for (; lineY < this.#terminal.buffer.active.baseY + this.#terminal.rows; ) {
      if (line) lines.push(line);

      lineY += 1;
      line = this.#terminal.buffer.active.getLine(lineY);

      const lineWrapped = line?.isWrapped;
      const cursorWrapped = absoluteY > lineY - 1;
      const wrapped = lineWrapped || cursorWrapped;

      if (!wrapped) break;
    }

    return lines;
  }

  private _getCommandText(commandLines: IBufferLine[]): { suggestion: string; preCursorCommand: string; postCursorCommand: string } {
    const absoluteY = this.#terminal.buffer.active.baseY + this.#terminal.buffer.active.cursorY;
    const cursorLine = Math.max(absoluteY - this.#activeCommand.promptEndMarker!.line, 0);

    let preCursorCommand = "";
    let postCursorCommand = "";
    let suggestion = "";
    const whitespace = " ".repeat(commandWhitespaceTerminationWidth);
    for (const [y, line] of commandLines.entries()) {
      const startX = y == 0 ? this.#activeCommand.promptEndX ?? this.#activeCommand.promptText?.length ?? 0 : 0;
      for (let x = startX; x < this.#terminal.cols; x++) {
        if (postCursorCommand.endsWith(whitespace)) break; // assume that a command that ends with 4 spaces is terminated, avoids capturing right prompts

        const cell = line.getCell(x);
        if (cell == null) continue;
        const chars = cell.getChars() == "" ? " " : cell.getChars();

        const beforeCursor = y < cursorLine || (y == cursorLine && x < this.#terminal.buffer.active.cursorX);
        const isCommand = !this._isSuggestion(cell) && suggestion.length == 0;
        if (isCommand && beforeCursor) {
          preCursorCommand += chars;
        } else if (isCommand) {
          postCursorCommand += chars;
        } else {
          suggestion += chars;
        }
      }
    }

    log.debug({ msg: "command text", preCursorCommand, postCursorCommand, suggestion });
    return { suggestion, preCursorCommand, postCursorCommand };
  }

  private _getCommandOutputStatus(commandLines: number): boolean {
    const outputLineY = this.#activeCommand.promptEndMarker!.line + commandLines;
    const maxLineY = this.#terminal.buffer.active.baseY + this.#terminal.rows;
    if (outputLineY >= maxLineY) return false;

    const line = this.#terminal.buffer.active.getLine(outputLineY);
    let cell = undefined;
    for (let i = 0; i < this.#terminal.cols; i++) {
      cell = line?.getCell(i, cell);
      if (cell?.getChars() != "") {
        return true;
      }
    }
    return false;
  }

  termSync() {
    const syncTiming = startTiming();
    try {
      if (this.#suspended) {
        this._syncStateSnapshot();
        return;
      }
      if (this.#activeCommand.promptEndMarker == null || this.#activeCommand.promptStartMarker == null) {
        return;
      }

      const globalCursorPosition = this.#terminal.buffer.active.baseY + this.#terminal.buffer.active.cursorY;

      if (this.#activeCommand.promptStartMarker.isDisposed || this.#activeCommand.promptEndMarker.isDisposed) {
        log.debug({ msg: "markers disposed, re-registering" });
        this.#activeCommand.promptStartMarker = this.#terminal.registerMarker(0);
        this.#activeCommand.promptEndMarker = this.#terminal.registerMarker(0);
      }

      // if the prompt is set, now parse out the values from the terminal
      if (this.#activeCommand.promptText != null) {
        const commandLines = this._getCommandLines();
        const hasOutput = this._getCommandOutputStatus(commandLines.length);

        if (!this.#activeCommand.persistentOutput) {
          const { suggestion, preCursorCommand, postCursorCommand } = this._getCommandText(commandLines);
          this.#activeCommand.suggestionsText = suggestion;
          this.#activeCommand.commandText = preCursorCommand + postCursorCommand.trim();
          this.#activeCommand.cursorTerminated = postCursorCommand.trim() == "";
        }

        this.#activeCommand.persistentOutput = this.#activeCommand.hasOutput && hasOutput;
        this.#activeCommand.hasOutput = hasOutput;
      }

      this._syncStateSnapshot();
      log.debug({
        msg: "cmd manager state",
        ...this.#activeCommand,
        promptEndMarker: this.#activeCommand.promptEndMarker?.line,
        promptStartMarker: this.#activeCommand.promptStartMarker?.line,
        cursorX: this.#terminal.buffer.active.cursorX,
        cursorY: globalCursorPosition,
      });
    } finally {
      endTiming("commandManager.termSync", syncTiming);
    }
  }
}
