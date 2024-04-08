// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import convert from "color-convert";
import { IBufferCell, IMarker, Terminal } from "@xterm/headless";
import os from "node:os";
import { getShellPromptRewrites, Shell } from "../utils/shell.js";
import log from "../utils/log.js";
import { getConfig, PromptPattern } from "../utils/config.js";

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
  #shell: Shell;
  #promptRewrites: boolean;
  readonly #supportsProperOscPlacements = os.platform() !== "win32";

  constructor(terminal: Terminal, shell: Shell) {
    this.#terminal = terminal;
    this.#shell = shell;
    this.#activeCommand = {};
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
    this.#previousCommandLines = new Set();
  }

  private _extractPrompt(lineText: string, patterns: PromptPattern[]): string | undefined {
    for (const { regex, postfix } of patterns) {
      const customPrompt = lineText.match(new RegExp(regex))?.groups?.prompt;
      const adjustedPrompt = this._adjustPrompt(customPrompt, lineText, postfix);
      if (adjustedPrompt) {
        return adjustedPrompt;
      }
    }
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
        const extractedPrompt = this._extractPrompt(lineText, inshellisenseConfig.prompt.bash);
        if (extractedPrompt) return extractedPrompt;
      }

      const bashPrompt = lineText.match(/^(?<prompt>.*\$\s?)/)?.groups?.prompt;
      if (bashPrompt) {
        const adjustedPrompt = this._adjustPrompt(bashPrompt, lineText, "$");
        if (adjustedPrompt) {
          return adjustedPrompt;
        }
      }
    }

    if (this.#shell == Shell.Nushell) {
      if (inshellisenseConfig?.prompt?.nu != null) {
        const extractedPrompt = this._extractPrompt(lineText, inshellisenseConfig.prompt.nu);
        if (extractedPrompt) return extractedPrompt;
      }

      const nushellPrompt = lineText.match(/(?<prompt>.*>\s?)/)?.groups?.prompt;
      if (nushellPrompt) {
        const adjustedPrompt = this._adjustPrompt(nushellPrompt, lineText, ">");
        if (adjustedPrompt) {
          return adjustedPrompt;
        }
      }
    }

    if (this.#shell == Shell.Xonsh) {
      if (inshellisenseConfig?.prompt?.xonsh != null) {
        const extractedPrompt = this._extractPrompt(lineText, inshellisenseConfig.prompt.xonsh);
        if (extractedPrompt) return extractedPrompt;
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
        const extractedPrompt = this._extractPrompt(lineText, inshellisenseConfig.prompt.powershell);
        if (extractedPrompt) return extractedPrompt;
      }

      if (inshellisenseConfig?.prompt?.pwsh != null) {
        const extractedPrompt = this._extractPrompt(lineText, inshellisenseConfig.prompt.pwsh);
        if (extractedPrompt) return extractedPrompt;
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
      let lineY = this.#activeCommand.promptEndMarker!.line;
      let line = this.#terminal.buffer.active.getLine(this.#activeCommand.promptEndMarker!.line);
      let command = "";
      let wrappedCommand = "";
      let suggestions = "";
      let isWrapped = false;
      for (;;) {
        for (let i = lineY == this.#activeCommand.promptEndMarker!.line ? this.#activeCommand.promptText.length : 0; i < this.#terminal.cols; i++) {
          if (command.endsWith("    ")) break; // assume that a command that ends with 4 spaces is terminated, avoids capturing right prompts
          const cell = line?.getCell(i);
          if (cell == null) continue;
          const chars = cell.getChars();
          const cleanedChars = chars == "" ? " " : chars;
          if (!this._isSuggestion(cell) && suggestions.length == 0) {
            command += cleanedChars;
            wrappedCommand += cleanedChars;
          } else {
            suggestions += cleanedChars;
          }
        }
        lineY += 1;
        line = this.#terminal.buffer.active.getLine(lineY);

        const wrapped = line?.isWrapped || this.#terminal.buffer.active.cursorY + this.#terminal.buffer.active.baseY != lineY - 1;
        isWrapped = isWrapped || wrapped;

        if (!wrapped) {
          break;
        }
        wrappedCommand = "";
      }

      const cursorAtEndOfInput = isWrapped
        ? wrappedCommand.trim().length % this.#terminal.cols <= this.#terminal.buffer.active.cursorX
        : (this.#activeCommand.promptText.length + command.trimEnd().length) % this.#terminal.cols <= this.#terminal.buffer.active.cursorX;

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

      const postfixActive = isWrapped
        ? wrappedCommand.trim().length < this.#terminal.buffer.active.cursorX
        : this.#activeCommand.promptText.length + command.trimEnd().length < this.#terminal.buffer.active.cursorX;

      const commandPostfix = postfixActive ? " " : "";
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
