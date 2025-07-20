// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Suggestion, SuggestionBlob } from "../runtime/model.js";
import { getSuggestions } from "../runtime/runtime.js";
import { ISTerm, ISTermPatch } from "../isterm/pty.js";
import { renderBox, truncateText, truncateMultilineText } from "./utils.js";
import chalk from "chalk";
import { Shell } from "../utils/shell.js";
import log from "../utils/log.js";
import { getConfig } from "../utils/config.js";

const maxSuggestions = 5;
const suggestionWidth = 40;
const descriptionWidth = 30;
const descriptionHeight = 5;
const borderWidth = 2;
const activeSuggestionBackgroundColor = "#7D56F4";
export const MAX_LINES = borderWidth + Math.max(maxSuggestions, descriptionHeight) + 1; // accounts when there is a unhandled newline at the end of the command
export const MIN_WIDTH = borderWidth + descriptionWidth;

export type KeyPressEvent = [string | null | undefined, KeyPress];

type KeyPress = {
  sequence: string;
  name: string;
  ctrl: boolean;
  shift: boolean;
};

export class SuggestionManager {
  #term: ISTerm;
  #command: string;
  #activeSuggestionIdx: number;
  #suggestBlob?: SuggestionBlob;
  #shell: Shell;
  #hideSuggestions: boolean = false;

  constructor(terminal: ISTerm, shell: Shell) {
    this.#term = terminal;
    this.#suggestBlob = { suggestions: [] };
    this.#command = "";
    this.#activeSuggestionIdx = 0;
    this.#shell = shell;
  }

  private async _loadSuggestions(): Promise<void> {
    const commandText = this.#term.getCommandState().commandText;
    if (!commandText) {
      this.#command = "";
    }
    if (!commandText || this.#hideSuggestions) {
      this.#suggestBlob = undefined;
      this.#activeSuggestionIdx = 0;
      return;
    }
    if (commandText == this.#command) {
      return;
    }
    this.#command = commandText;
    const suggestionBlob = await getSuggestions(commandText, this.#term.cwd, this.#shell);
    this.#suggestBlob = suggestionBlob;
    this.#activeSuggestionIdx = 0;
  }

  private _renderArgumentDescription(description: string | undefined) {
    if (!description) return [];
    return renderBox([truncateText(description, descriptionWidth - borderWidth)], descriptionWidth);
  }

  private _renderDescription(description: string | undefined) {
    if (!description) return "";
    return renderBox(truncateMultilineText(description, descriptionWidth - borderWidth, descriptionHeight), descriptionWidth);
  }

  private _renderSuggestions(suggestions: Suggestion[], activeSuggestionIdx: number) {
    return renderBox(
      suggestions.map((suggestion, idx) => {
        const suggestionText = `${suggestion.icon} ${suggestion.name}`;
        const truncatedSuggestion = truncateText(suggestionText, suggestionWidth - 2);
        return idx == activeSuggestionIdx ? chalk.bgHex(activeSuggestionBackgroundColor)(truncatedSuggestion) : truncatedSuggestion;
      }),
      suggestionWidth,
    );
  }

  private _calculatePadding(description: string): { padding: number; swapDescription: boolean } {
    const wrappedPadding = this.#term.getCursorState().cursorX % this.#term.cols;
    const maxPadding = description.length !== 0 ? this.#term.cols - suggestionWidth - descriptionWidth : this.#term.cols - suggestionWidth;
    const swapDescription = wrappedPadding > maxPadding && description.length !== 0;
    const swappedPadding = swapDescription ? Math.max(wrappedPadding - descriptionWidth, 0) : wrappedPadding;
    const padding = Math.min(Math.min(wrappedPadding, swappedPadding), maxPadding);
    return { padding, swapDescription };
  }

  private _calculateRowPadding(padding: number, swapDescription: boolean, suggestionContent?: string, descriptionContent?: string): number {
    if (swapDescription) {
      return descriptionContent == null ? padding + descriptionWidth : padding;
    }
    return suggestionContent == null ? padding + suggestionWidth : padding;
  }

  async exec(): Promise<void> {
    return await this._loadSuggestions();
  }

  render(direction: "above" | "below"): ISTermPatch[] {
    if (!this.#suggestBlob) {
      return [];
    }
    const { suggestions, argumentDescription } = this.#suggestBlob;

    const page = Math.min(Math.floor(this.#activeSuggestionIdx / maxSuggestions) + 1, Math.floor(suggestions.length / maxSuggestions) + 1);
    const pagedSuggestions = suggestions.filter((_, idx) => idx < page * maxSuggestions && idx >= (page - 1) * maxSuggestions);
    const activePagedSuggestionIndex = this.#activeSuggestionIdx % maxSuggestions;
    const activeDescription = pagedSuggestions.at(activePagedSuggestionIndex)?.description || argumentDescription || "";
    const { swapDescription, padding } = this._calculatePadding(activeDescription);

    if (suggestions.length <= this.#activeSuggestionIdx) {
      this.#activeSuggestionIdx = Math.max(suggestions.length - 1, 0);
    }

    if (pagedSuggestions.length == 0) {
      if (argumentDescription != null) {
        return this._renderArgumentDescription(argumentDescription).map((row) => ({ startX: padding, length: descriptionWidth, data: row }));
      }
      return [];
    }
    const descriptionUI = this._renderDescription(activeDescription);
    const suggestionUI = this._renderSuggestions(pagedSuggestions, activePagedSuggestionIndex);
    const ui = [];
    const maxRows = Math.max(descriptionUI.length, suggestionUI.length);
    for (let i = 0; i < maxRows; i++) {
      const [suggestionUIRow, descriptionUIRow] =
        direction == "above"
          ? [suggestionUI[i - maxRows + suggestionUI.length], descriptionUI[i - maxRows + descriptionUI.length]]
          : [suggestionUI[i], descriptionUI[i]];

      const data = swapDescription ? (descriptionUIRow ?? "") + (suggestionUIRow ?? "") : (suggestionUIRow ?? "") + (descriptionUIRow ?? "");
      const rowPadding = this._calculateRowPadding(padding, swapDescription, suggestionUIRow, descriptionUIRow);

      ui.push({
        startX: rowPadding,
        length: (suggestionUIRow == null ? 0 : suggestionWidth) + (descriptionUIRow == null ? 0 : descriptionWidth),
        data: data,
      });
    }
    return ui;
  }

  update(keyPress: KeyPress): boolean {
    const { name, shift, ctrl } = keyPress;
    if (name == "return") {
      this.#term.clearCommand(); // clear the current command on enter
    }

    // if suggestions are hidden, keep them hidden until during command navigation
    if (this.#hideSuggestions) {
      this.#hideSuggestions = name == "up" || name == "down";
    }

    if (!this.#suggestBlob) {
      return false;
    }
    const {
      dismissSuggestions: { key: dismissKey, shift: dismissShift, control: dismissCtrl },
      acceptSuggestion: { key: acceptKey, shift: acceptShift, control: acceptCtrl },
      nextSuggestion: { key: nextKey, shift: nextShift, control: nextCtrl },
      previousSuggestion: { key: prevKey, shift: prevShift, control: prevCtrl },
    } = getConfig().bindings;

    if (name == dismissKey && shift == !!dismissShift && ctrl == !!dismissCtrl) {
      this.#suggestBlob = undefined;
      this.#hideSuggestions = true;
    } else if (name == prevKey && shift == !!prevShift && ctrl == !!prevCtrl) {
      this.#activeSuggestionIdx = Math.max(0, this.#activeSuggestionIdx - 1);
    } else if (name == nextKey && shift == !!nextShift && ctrl == !!nextCtrl) {
      this.#activeSuggestionIdx = Math.min(this.#activeSuggestionIdx + 1, (this.#suggestBlob?.suggestions.length ?? 1) - 1);
    } else if (name == acceptKey && shift == !!acceptShift && ctrl == !!acceptCtrl) {
      const removals = "\u007F".repeat(this.#suggestBlob?.charactersToDrop ?? 0);
      const suggestion = this.#suggestBlob?.suggestions.at(this.#activeSuggestionIdx);
      const chars = suggestion?.insertValue ?? suggestion?.name + " ";
      if (this.#suggestBlob == null || !chars.trim() || this.#suggestBlob?.suggestions.length == 0) {
        return false;
      }
      this.#term.write(removals + chars);
    } else {
      return false;
    }
    log.debug({ msg: "handled keypress", ...keyPress });
    return true;
  }
}
