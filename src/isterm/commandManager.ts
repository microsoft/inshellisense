// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import convert from "color-convert";
import { IBufferCell, IBufferLine, IMarker, Terminal } from "@xterm/headless";
import { getShellPromptRewrites, Shell } from "../utils/shell.js";
import log from "../utils/log.js";

type TerminalCommand = {
  promptStartMarker?: IMarker;
  promptEndMarker?: IMarker;
  promptEndX?: number;
} & CommandState;

export type CommandState = {
  promptText?: string;
  commandText?: string;
  suggestionsText?: string;
  persistentOutput?: boolean;
  hasOutput?: boolean;
  cursorTerminated?: boolean;
};

export class CommandManager {
  #activeCommand: TerminalCommand;
  #terminal: Terminal;
  #acceptedCommandLines: Set<number>;
  #maxCursorY: number;
  #shell: Shell;
  #promptRewrites: boolean;

  constructor(terminal: Terminal, shell: Shell) {
    this.#terminal = terminal;
    this.#shell = shell;
    this.#activeCommand = {};
    this.#maxCursorY = 0;
    this.#acceptedCommandLines = new Set();
    this.#promptRewrites = getShellPromptRewrites(shell);

    this.#terminal.parser.registerCsiHandler({ final: "J" }, (params) => {
      if (params.at(0) == 3 || params.at(0) == 2) {
        this.handleClear();
      }
      return false;
    });
  }
  handlePromptStart() {
    this.#activeCommand = { promptStartMarker: this.#terminal.registerMarker(0), hasOutput: false, cursorTerminated: false };
  }

  handlePromptEnd() {
    if (this.#activeCommand.promptEndMarker != null) return;
    if (this.#hasBeenAccepted()) {
      this.#activeCommand = {};
      return;
    }

    this.#activeCommand.promptEndMarker = this.#terminal.registerMarker(0);
    if (this.#activeCommand.promptEndMarker?.line === this.#terminal.buffer.active.cursorY) {
      this.#activeCommand.promptEndX = this.#terminal.buffer.active.cursorX;
    }

    this.#activeCommand.promptText = this.#terminal.buffer.active.getLine(this.#activeCommand.promptEndMarker?.line ?? 0)?.translateToString(true);
  }

  #hasBeenAccepted() {
    const commandLine = this.#activeCommand.promptStartMarker?.line ?? -1;
    const hasBeenAccepted = this.#acceptedCommandLines.has(commandLine) && commandLine != -1;;
    return this.#promptRewrites && hasBeenAccepted; // this is a prompt + command that was accepted and is now being re-written by the shell for display purposes (e.g. nu)
  }

  handleClear() {
    this.handlePromptStart();
    this.#maxCursorY = 0;
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
    return {
      promptText: this.#activeCommand.promptText,
      commandText: this.#activeCommand.commandText,
      suggestionsText: this.#activeCommand.suggestionsText,
      hasOutput: this.#activeCommand.hasOutput,
      cursorTerminated: this.#activeCommand.cursorTerminated,
    };
  }

  clearActiveCommand() {
    this.#acceptedCommandLines.add(this.#activeCommand.promptEndMarker?.line ?? -1)
    this.#activeCommand = {};
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
    for (const [y, line] of commandLines.entries()) {
      const startX = y == 0 ? this.#activeCommand.promptText?.length ?? 0 : 0;
      for (let x = startX; x < this.#terminal.cols; x++) {
        if (postCursorCommand.endsWith("    ")) break; // assume that a command that ends with 4 spaces is terminated, avoids capturing right prompts

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
    if (this.#activeCommand.promptEndMarker == null || this.#activeCommand.promptStartMarker == null) {
      return;
    }

    const globalCursorPosition = this.#terminal.buffer.active.baseY + this.#terminal.buffer.active.cursorY;
    this.#maxCursorY = Math.max(this.#maxCursorY, globalCursorPosition);

    if (globalCursorPosition < this.#activeCommand.promptStartMarker.line || globalCursorPosition < this.#maxCursorY) {
      this.handleClear();
      this.#activeCommand.promptEndMarker = this.#terminal.registerMarker(0);
      return;
    }

    if (this.#activeCommand.promptEndMarker == null) return;

    // if the prompt is set, now parse out the values from the terminal
    if (this.#activeCommand.promptText != null) {
      const commandLines = this._getCommandLines();
      const { suggestion, preCursorCommand, postCursorCommand } = this._getCommandText(commandLines);
      const command = preCursorCommand + postCursorCommand.trim();

      const cursorAtEndOfInput = postCursorCommand.trim() == "";
      const hasOutput = this._getCommandOutputStatus(commandLines.length);

      this.#activeCommand.persistentOutput = this.#activeCommand.hasOutput && hasOutput;
      this.#activeCommand.hasOutput = hasOutput;
      this.#activeCommand.suggestionsText = suggestion;
      this.#activeCommand.commandText = command;
      this.#activeCommand.cursorTerminated = cursorAtEndOfInput;
    }

    log.debug({
      msg: "cmd manager state",
      ...this.#activeCommand,
      promptEndMarker: this.#activeCommand.promptEndMarker?.line,
      promptStartMarker: this.#activeCommand.promptStartMarker?.line,
      cursorX: this.#terminal.buffer.active.cursorX,
      cursorY: globalCursorPosition,
    });
  }
}
