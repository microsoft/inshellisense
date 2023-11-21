// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IBufferCell, IMarker, Terminal } from "xterm-headless";
import os from "node:os";
import { Shell } from "../utils/bindings.js";
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
  hasOutput?: boolean;
  cursorTerminated?: boolean;
};

export class CommandManager {
  #activeCommand: TerminalCommand;
  #previousCommandLines: Set<number>;
  #terminal: Terminal;
  #shell: Shell;
  readonly #supportsProperOscPlacements = os.platform() !== "win32";

  constructor(terminal: Terminal, shell: Shell) {
    this.#terminal = terminal;
    this.#shell = shell;
    this.#activeCommand = {};
    this.#previousCommandLines = new Set();
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

    // User defined prompt
    // TOOD: allow users to define their own prompt patterns per shell

    if (this.#shell == Shell.Bash) {
      const bashPrompt = lineText.match(/^(?<prompt>.*\$\s?)/)?.groups?.prompt;
      if (bashPrompt) {
        const adjustedPrompt = this._adjustPrompt(bashPrompt, lineText, "$");
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
      return lineText.match(/^(?<prompt>(\(.+\)\s)?(?:[A-Z]:\\.*>))/)?.groups?.prompt;
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

  private _isSuggestion(cell: IBufferCell | undefined): boolean {
    // log.debug({ msg: "suggestion detection", fgColor: cell?.getFgColor(), content: cell?.getChars() });
    const color = cell?.getFgColor();
    return color == 8 || (color ?? 0) > 235;
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

  termSync() {
    if (this.#activeCommand.promptEndMarker == null || this.#activeCommand.promptStartMarker == null) {
      return;
    }
    const promptEndMarker = this.#activeCommand.promptEndMarker;
    const promptStartMarker = this.#activeCommand.promptStartMarker;

    const globalCursorPosition = this.#terminal.buffer.active.baseY + this.#terminal.buffer.active.cursorY;
    const withinPollDistance = globalCursorPosition < this.#activeCommand.promptEndMarker.line + 5;

    if (globalCursorPosition < promptStartMarker.line) {
      this.handleClear();
    }

    // if we haven't fond the prompt yet, poll over the next 5 lines searching for it
    if (this.#activeCommand.promptText == null && withinPollDistance) {
      for (let i = globalCursorPosition; i < promptEndMarker.line + 5; i++) {
        if (this.#previousCommandLines.has(i)) continue;
        const promptResult = this._getWindowsPrompt(i);
        if (promptResult != null) {
          this.#activeCommand.promptEndMarker = this.#terminal.registerMarker(i - globalCursorPosition);
          this.#activeCommand.promptEndX = promptResult.length;
          this.#activeCommand.promptText = promptResult;
          this.#previousCommandLines.add(i);
        }
      }
    }

    // if the prompt is set, now parse out the values from the terminal
    if (this.#activeCommand.promptText != null) {
      let lineY = promptEndMarker.line;
      let line = this.#terminal.buffer.active.getLine(promptEndMarker.line);
      let command = "";
      let suggestions = "";
      for (;;) {
        for (let i = lineY == promptEndMarker.line ? this.#activeCommand.promptText.length : 0; i < this.#terminal.cols; i++) {
          const cell = line?.getCell(i);
          if (cell == null) continue;
          if (!this._isSuggestion(cell) && suggestions.length == 0) {
            command += cell.getChars();
          } else {
            suggestions += cell.getChars();
          }
        }
        lineY += 1;
        line = this.#terminal.buffer.active.getLine(lineY);
        if (!line?.isWrapped) {
          break;
        }
      }

      const cursorAtEndOfInput = (this.#activeCommand.promptText.length + command.trim().length) % this.#terminal.cols <= this.#terminal.buffer.active.cursorX;
      let hasOutput = false;

      for (let i = 0; i < this.#terminal.cols; i++) {
        const cell = line?.getCell(i);
        if (cell == null) continue;
        hasOutput = cell.getChars() != "";
        if (hasOutput) {
          break;
        }
      }

      this.#activeCommand.hasOutput = hasOutput;
      this.#activeCommand.suggestionsText = suggestions.trim();
      this.#activeCommand.commandText = command.trim();
      this.#activeCommand.cursorTerminated = cursorAtEndOfInput;
    }

    log.debug({
      msg: "cmd manager state",
      ...this.#activeCommand,
      promptEndMarker: this.#activeCommand.promptEndMarker?.line,
      promptStartMarker: this.#activeCommand.promptStartMarker?.line,
    });
  }
}
