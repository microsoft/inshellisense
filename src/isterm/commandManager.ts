// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IMarker, Terminal } from "xterm-headless";
import os from "node:os";
import fs from "node:fs";
import { Shell } from "../utils/bindings.js";

type TerminalCommand = {
  promptStartMarker?: IMarker;
  promptEndMarker?: IMarker;
  promptEndX?: number;
  promptText?: string;
  commandText?: string;
  suggestionsText?: string;
  hasOutput?: boolean;
};

export class CommandManager {
  private _activeCommand: TerminalCommand;
  private _previousCommandLines: Set<number> = new Set();
  private readonly _supportsProperOscPlacements = os.platform() !== "win32";

  constructor(
    private readonly _terminal: Terminal,
    private readonly _shell: Shell,
  ) {
    this._activeCommand = {};
  }
  handlePromptStart() {
    this._activeCommand = { promptStartMarker: this._terminal.registerMarker(0), hasOutput: false };
  }

  handlePromptEnd() {
    this._activeCommand.promptEndMarker = this._terminal.registerMarker(0);
    if (this._activeCommand.promptEndMarker?.line === this._terminal.buffer.active.cursorY) {
      this._activeCommand.promptEndX = this._terminal.buffer.active.cursorX;
    }
    if (this._supportsProperOscPlacements) {
      this._activeCommand.promptText = this._terminal.buffer.active.getLine(this._activeCommand.promptEndMarker?.line ?? 0)?.translateToString(true);
      this._previousCommandLines.add(this._activeCommand.promptEndMarker?.line ?? -1);
    }
  }

  handleClear() {
    this._activeCommand = {};
    this._previousCommandLines = new Set();
  }

  private _getWindowsPrompt(y: number) {
    const line = this._terminal.buffer.active.getLine(y);
    if (!line) {
      return;
    }
    const lineText = line.translateToString(true);
    if (!lineText) {
      return;
    }

    // User defined prompt
    // TOOD: allow users to define their own prompt patterns per shell

    if (this._shell == Shell.Bash) {
      const gitBashPrompt = lineText.match(/^(?<prompt>\$\s?)/)?.groups?.prompt;
      if (gitBashPrompt) {
        const adjustedPrompt = this._adjustPrompt(gitBashPrompt, lineText, "$");
        if (adjustedPrompt) {
          return adjustedPrompt;
        }
      }

      const gitPrompt = lineText.match(/^(?<prompt>.*\$\s?)/)?.groups?.prompt;
      if (gitPrompt) {
        const adjustedPrompt = this._adjustPrompt(gitPrompt, lineText, "$");
        if (adjustedPrompt) {
          return adjustedPrompt;
        }
      }
    }

    if (this._shell == Shell.Powershell || this._shell == Shell.Pwsh) {
      const pwshPrompt = lineText.match(/(?<prompt>(\(.+\)\s)?(?:PS.+>\s?))/)?.groups?.prompt;
      if (pwshPrompt) {
        const adjustedPrompt = this._adjustPrompt(pwshPrompt, lineText, ">");
        if (adjustedPrompt) {
          return adjustedPrompt;
        }
      }
    }

    if (this._shell == Shell.Cmd) {
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

  termSync() {
    if (this._activeCommand.promptEndMarker == null || this._activeCommand.promptStartMarker == null) {
      return;
    }
    const promptEndMarker = this._activeCommand.promptEndMarker;
    const promptStartMarker = this._activeCommand.promptStartMarker;

    const globalCursorPosition = this._terminal.buffer.active.baseY + this._terminal.buffer.active.cursorY;
    const withinPollDistance = globalCursorPosition < this._activeCommand.promptEndMarker.line + 5;

    if (globalCursorPosition < promptStartMarker.line) {
      this.handleClear();
    }

    // if we haven't fond the prompt yet, poll over the next 5 lines searching for it
    if (this._activeCommand.promptText == null && withinPollDistance) {
      for (let i = globalCursorPosition; i < promptEndMarker.line + 5; i++) {
        if (this._previousCommandLines.has(i)) continue;
        const promptResult = this._getWindowsPrompt(i);
        if (promptResult != null) {
          this._activeCommand.promptEndMarker = this._terminal.registerMarker(i - globalCursorPosition);
          this._activeCommand.promptEndX = promptResult.length;
          this._activeCommand.promptText = promptResult;
          this._previousCommandLines.add(i);
        }
      }
    }

    // if the prompt is set, now parse out the values from the terminal
    if (this._activeCommand.promptText != null) {
      let lineY = promptEndMarker.line;
      let line = this._terminal.buffer.active.getLine(promptEndMarker.line);
      let command = "";
      let suggestions = "";
      for (;;) {
        for (let i = lineY == promptEndMarker.line ? this._activeCommand.promptText.length : 0; i < this._terminal.cols; i++) {
          const cell = line?.getCell(i);
          if (cell == null) continue;
          if (cell.getFgColor() != 238 && suggestions.length == 0) {
            command += cell.getChars();
          } else {
            suggestions += cell.getChars();
          }
        }
        lineY += 1;
        line = this._terminal.buffer.active.getLine(lineY);
        if (!line?.isWrapped) {
          break;
        }
      }

      let hasOutput = false;

      for (let i = 0; i < this._terminal.cols; i++) {
        const cell = line?.getCell(i);
        if (cell == null) continue;
        hasOutput = cell.getChars() != "";
        if (hasOutput) {
          break;
        }
      }

      this._activeCommand.hasOutput = hasOutput;
      this._activeCommand.suggestionsText = suggestions.trim();
      this._activeCommand.commandText = command.trim();
    }

    fs.appendFileSync(
      "log.txt",
      JSON.stringify({
        ...this._activeCommand,
        promptEndMarker: this._activeCommand.promptEndMarker?.line,
        promptStartMarker: this._activeCommand.promptStartMarker?.line,
      }) + "\n",
    );
  }
}
