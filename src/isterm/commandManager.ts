// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import convert from "color-convert";
import { IBufferCell, IMarker, Terminal } from "@xterm/headless";
import os from "node:os";
import { Shell } from "../utils/shell.js";
import log from "../utils/log.js";
import { getConfig } from "../utils/config.js";

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
    if (this.#activeCommand.promptStartMarker?.line == -1) {
      this.#previousCommandLines = new Set();
    }
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
    const inshellisenseConfig = getConfig();
    if (this.#shell == Shell.Bash) {
      if (inshellisenseConfig?.prompt?.bash != null) {
        for (const { regex, postfix } of inshellisenseConfig.prompt.bash) {
          const customPrompt = lineText.match(new RegExp(regex))?.groups?.prompt;
          const adjustedPrompt = this._adjustPrompt(customPrompt, lineText, postfix);
          if (adjustedPrompt) {
            return adjustedPrompt;
          }
        }
      }

      const bashPrompt = lineText.match(/^(?<prompt>.*\$\s?)/)?.groups?.prompt;
      if (bashPrompt) {
        const adjustedPrompt = this._adjustPrompt(bashPrompt, lineText, "$");
        if (adjustedPrompt) {
          return adjustedPrompt;
        }
      }
    }

    if (this.#shell == Shell.Xonsh) {
      if (inshellisenseConfig?.prompt?.xonsh != null) {
        for (const { regex, postfix } of inshellisenseConfig.prompt.xonsh) {
          const customPrompt = lineText.match(new RegExp(regex))?.groups?.prompt;
          const adjustedPrompt = this._adjustPrompt(customPrompt, lineText, postfix);
          if (adjustedPrompt) {
            return adjustedPrompt;
          }
        }
      }

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
      if (inshellisenseConfig?.prompt?.powershell != null) {
        for (const { regex, postfix } of inshellisenseConfig.prompt.powershell) {
          const customPrompt = lineText.match(new RegExp(regex))?.groups?.prompt;
          const adjustedPrompt = this._adjustPrompt(customPrompt, lineText, postfix);
          if (adjustedPrompt) {
            return adjustedPrompt;
          }
        }
      }

      if (inshellisenseConfig?.prompt?.pwsh != null) {
        for (const { regex, postfix } of inshellisenseConfig.prompt.pwsh) {
          const customPrompt = lineText.match(new RegExp(regex))?.groups?.prompt;
          const adjustedPrompt = this._adjustPrompt(customPrompt, lineText, postfix);
          if (adjustedPrompt) {
            return adjustedPrompt;
          }
        }
      }

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
    const dullItalic = (color ?? 0) > 235 || (dullColor && italic);
    if (this.#shell == Shell.Powershell) {
      return false;
    } else if (this.#shell == Shell.Pwsh) {
      return dullItalic;
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

  termSync() {
    if (this.#activeCommand.promptEndMarker == null || this.#activeCommand.promptStartMarker == null) {
      return;
    }

    const globalCursorPosition = this.#terminal.buffer.active.baseY + this.#terminal.buffer.active.cursorY;
    const withinPollDistance = globalCursorPosition < this.#activeCommand.promptEndMarker.line + 5;

    if (globalCursorPosition < this.#activeCommand.promptStartMarker.line) {
      this.handleClear();
      this.#activeCommand.promptEndMarker = this.#terminal.registerMarker(0);
    }

    // if we haven't fond the prompt yet, poll over the next 5 lines searching for it
    if (this.#activeCommand.promptText == null && withinPollDistance) {
      for (let i = globalCursorPosition; i < this.#activeCommand.promptEndMarker!.line + maxPromptPollDistance; i++) {
        if (this.#previousCommandLines.has(i)) continue;
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
      let lineY = this.#activeCommand.promptEndMarker!.line;
      let line = this.#terminal.buffer.active.getLine(this.#activeCommand.promptEndMarker!.line);
      let command = "";
      let suggestions = "";
      for (;;) {
        for (let i = lineY == this.#activeCommand.promptEndMarker!.line ? this.#activeCommand.promptText.length : 0; i < this.#terminal.cols; i++) {
          const cell = line?.getCell(i);
          if (cell == null) continue;
          const chars = cell.getChars();
          const cleanedChars = chars == "" ? " " : chars;
          if (!this._isSuggestion(cell) && suggestions.length == 0) {
            command += cleanedChars;
          } else {
            suggestions += cleanedChars;
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

      let cell = undefined;
      for (let i = 0; i < this.#terminal.cols; i++) {
        cell = line?.getCell(i, cell);
        if (cell == null) continue;
        hasOutput = cell.getChars() != "";
        if (hasOutput) {
          break;
        }
      }

      const commandPostfix = this.#activeCommand.promptText.length + command.trim().length < this.#terminal.buffer.active.cursorX ? " " : "";
      this.#activeCommand.persistentOutput = this.#activeCommand.hasOutput && hasOutput;
      this.#activeCommand.hasOutput = hasOutput;
      this.#activeCommand.suggestionsText = suggestions.trim();
      this.#activeCommand.commandText = command.trim() + commandPostfix;
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
