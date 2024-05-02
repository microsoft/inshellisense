// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import convert from "color-convert";
import { IBufferCell, IBufferLine, IMarker, Terminal } from "@xterm/headless";
import os from "node:os";
import { getShellPromptRewrites, Shell } from "../utils/shell.js";
import log from "../utils/log.js";

const maxPromptPollDistance = 10;

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
  #previousCommandLines: Set<number>;
  #maxCursorY: number;
  #shell: Shell;
  #promptRewrites: boolean;
  readonly #supportsProperOscPlacements = os.platform() !== "win32";
  promptTerminator: string = "";

  constructor(terminal: Terminal, shell: Shell) {
    this.#terminal = terminal;
    this.#shell = shell;
    this.#activeCommand = {};
    this.#maxCursorY = 0;
    this.#previousCommandLines = new Set();
    this.#promptRewrites = getShellPromptRewrites(shell);

    if (this.#supportsProperOscPlacements) {
      this.#terminal.parser.registerCsiHandler({ final: "J" }, (params) => {
        if (params.at(0) == 3 || params.at(0) == 2) {
          this.handleClear();
        }
        return false;
      });
    }
  }
  handlePromptStart() {
    this.#activeCommand = { promptStartMarker: this.#terminal.registerMarker(0), hasOutput: false, cursorTerminated: false };
  }

  handlePromptEnd() {
    if (this.#activeCommand.promptEndMarker != null) return;

    this.#activeCommand.promptEndMarker = this.#terminal.registerMarker(0);
    if (this.#activeCommand.promptEndMarker?.line === this.#terminal.buffer.active.cursorY) {
      this.#activeCommand.promptEndX = this.#terminal.buffer.active.cursorX;
    }
    if (this.#supportsProperOscPlacements) {
      this.#activeCommand.promptText = this.#terminal.buffer.active.getLine(this.#activeCommand.promptEndMarker?.line ?? 0)?.translateToString(true);
      this.#previousCommandLines.add(this.#activeCommand.promptEndMarker?.line ?? -1);
    }
  }

  handleClear() {
    this.handlePromptStart();
    this.#maxCursorY = 0;
    this.#previousCommandLines = new Set();
  }

  private _getWindowsPrompt(y: number) {
    const line = this.#terminal.buffer.active.getLine(y);
    if (!line) {
      return;
    }
    const lineText = line.translateToString(true);
    if (!lineText) {
      return;
    }

    // dynamic prompt terminator
    if (this.promptTerminator && lineText.trim().endsWith(this.promptTerminator)) {
      const adjustedPrompt = this._adjustPrompt(lineText, lineText, this.promptTerminator);
      if (adjustedPrompt) {
        return adjustedPrompt;
      }
    }

    // User defined prompt
    if (this.#shell == Shell.Bash) {
      const bashPrompt = lineText.match(/^(?<prompt>\$\s?)/)?.groups?.prompt;
      if (bashPrompt) {
        const adjustedPrompt = this._adjustPrompt(bashPrompt, lineText, "$");
        if (adjustedPrompt) {
          return adjustedPrompt;
        }
      }
    }

    if (this.#shell == Shell.Fish) {
      const fishPrompt = lineText.match(/(?<prompt>.*>\s?)/)?.groups?.prompt;
      if (fishPrompt) {
        const adjustedPrompt = this._adjustPrompt(fishPrompt, lineText, ">");
        if (adjustedPrompt) {
          return adjustedPrompt;
        }
      }
    }

    if (this.#shell == Shell.Nushell) {
      const nushellPrompt = lineText.match(/(?<prompt>.*>\s?)/)?.groups?.prompt;
      if (nushellPrompt) {
        const adjustedPrompt = this._adjustPrompt(nushellPrompt, lineText, ">");
        if (adjustedPrompt) {
          return adjustedPrompt;
        }
      }
    }

    if (this.#shell == Shell.Xonsh) {
      let xonshPrompt = lineText.match(/(?<prompt>.*@\s?)/)?.groups?.prompt;
      if (xonshPrompt) {
        const adjustedPrompt = this._adjustPrompt(xonshPrompt, lineText, "@");
        if (adjustedPrompt) {
          return adjustedPrompt;
        }
      }

      xonshPrompt = lineText.match(/(?<prompt>.*>\s?)/)?.groups?.prompt;
      if (xonshPrompt) {
        const adjustedPrompt = this._adjustPrompt(xonshPrompt, lineText, ">");
        if (adjustedPrompt) {
          return adjustedPrompt;
        }
      }
    }

    if (this.#shell == Shell.Powershell || this.#shell == Shell.Pwsh) {
      const pwshPrompt = lineText.match(/(?<prompt>(\(.+\)\s)?(?:PS.+>\s?))/)?.groups?.prompt;
      if (pwshPrompt) {
        const adjustedPrompt = this._adjustPrompt(pwshPrompt, lineText, ">");
        if (adjustedPrompt) {
          return adjustedPrompt;
        }
      }
    }

    if (this.#shell == Shell.Cmd) {
      return lineText.match(/^(?<prompt>(\(.+\)\s)?(?:[A-Z]:\\.*>)|(> ))/)?.groups?.prompt;
    }

    // Custom prompts like starship end in the common \u276f character
    const customPrompt = lineText.match(/.*\u276f(?=[^\u276f]*$)/g)?.[0];
    if (customPrompt) {
      const adjustedPrompt = this._adjustPrompt(customPrompt, lineText, "\u276f");
      if (adjustedPrompt) {
        return adjustedPrompt;
      }
    }
  }

  private _adjustPrompt(prompt: string | undefined, lineText: string, char: string): string | undefined {
    if (!prompt) {
      return;
    }
    // Conpty may not 'render' the space at the end of the prompt
    if (lineText === prompt && prompt.endsWith(char)) {
      prompt += " ";
    }
    return prompt;
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
    if (this.#shell == Shell.Powershell) {
      return false;
    } else if (this.#shell == Shell.Pwsh) {
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
    const withinPollDistance = globalCursorPosition < this.#activeCommand.promptEndMarker.line + 5;
    this.#maxCursorY = Math.max(this.#maxCursorY, globalCursorPosition);

    if (globalCursorPosition < this.#activeCommand.promptStartMarker.line || globalCursorPosition < this.#maxCursorY) {
      this.handleClear();
      this.#activeCommand.promptEndMarker = this.#terminal.registerMarker(0);
      return;
    }

    if (this.#activeCommand.promptEndMarker == null) return;

    // if we haven't fond the prompt yet, poll over the next 5 lines searching for it
    if (this.#activeCommand.promptText == null && withinPollDistance) {
      for (let i = globalCursorPosition; i < this.#activeCommand.promptEndMarker.line + maxPromptPollDistance; i++) {
        if (this.#previousCommandLines.has(i) && !this.#promptRewrites) continue;
        const promptResult = this._getWindowsPrompt(i);
        if (promptResult != null) {
          this.#activeCommand.promptEndMarker = this.#terminal.registerMarker(i - globalCursorPosition);
          this.#activeCommand.promptEndX = promptResult.length;
          this.#activeCommand.promptText = promptResult;
          this.#previousCommandLines.add(i);
          break;
        }
      }
    }

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
