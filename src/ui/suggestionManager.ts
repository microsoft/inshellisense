// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Suggestion, SuggestionBlob } from "../runtime/model.js";
import { getSuggestions } from "../runtime/runtime.js";
import { ISTerm } from "../isterm/pty.js";
import { renderBox, truncateText } from "./utils.js";
import ansi from "ansi-escapes";
import chalk from "chalk";

const maxSuggestions = 5;
const suggestionWidth = 40;
const descriptionWidth = 30;
const DescriptionMaxHeight = 6;
const borderWidth = 2;
const activeSuggestionBackgroundColor = "#7D56F4";

type SuggestionsSequence = {
  data: string;
  columns: number;
};

export class SuggestionManager {
  #term: ISTerm;
  #command: string;
  #activeSuggestionIdx: number;
  #suggestBlob?: SuggestionBlob;

  constructor(terminal: ISTerm) {
    this.#term = terminal;
    this.#suggestBlob = { suggestions: [] };
    this.#command = "";
    this.#activeSuggestionIdx = 0;
  }

  private async _loadSuggestions(): Promise<void> {
    const commandText = this.#term.getCommandState().commandText;
    if (!commandText) {
      this.#suggestBlob = undefined;
      return;
    }
    if (commandText == this.#command) {
      return;
    }
    this.#command = commandText;
    const suggestionBlob = await getSuggestions(commandText);
    this.#suggestBlob = suggestionBlob;
  }

  // if I want a 30 box, this means that

  // normalBorder = Border{
  // 	Top:          "─",
  // 	Bottom:       "─",
  // 	Left:         "│",
  // 	Right:        "│",
  // 	TopLeft:      "┌",
  // 	TopRight:     "┐",
  // 	BottomLeft:   "└",
  // 	BottomRight:  "┘",
  // 	MiddleLeft:   "├",
  // 	MiddleRight:  "┤",
  // 	Middle:       "┼",
  // 	MiddleTop:    "┬",
  // 	MiddleBottom: "┴",
  // }

  private _renderSuggestions(suggestions: Suggestion[], activeSuggestionIdx: number) {
    return renderBox(
      suggestions.map((suggestion, idx) => {
        const suggestionText = `${suggestion.icon} ${suggestion.name}`.padEnd(suggestionWidth - borderWidth, " ");
        const truncatedSuggestion = truncateText(suggestionText, suggestionWidth - 2);
        return idx == activeSuggestionIdx ? chalk.bgHex(activeSuggestionBackgroundColor).inverse(truncatedSuggestion) : truncatedSuggestion;
      }),
      suggestionWidth,
    );
  }

  async render(): Promise<SuggestionsSequence> {
    await this._loadSuggestions();
    if (!this.#suggestBlob) return { data: "", columns: 0 };
    const { suggestions } = this.#suggestBlob;

    const page = Math.floor(this.#activeSuggestionIdx / maxSuggestions) + 1;
    const pagedSuggestions = suggestions.filter((_, idx) => idx < page * maxSuggestions && idx >= (page - 1) * maxSuggestions);
    const activePagedSuggestionIndex = this.#activeSuggestionIdx % maxSuggestions;
    // const activeDescription = pagedSuggestions.at(activePagedSuggestionIndex)?.description || "";
    const activeDescription = "";

    const wrappedPadding = this.#term.getCursorState().cursorX % this.#term.rows;
    const maxPadding = activeDescription.length !== 0 ? this.#term.rows - suggestionWidth - descriptionWidth : this.#term.rows - suggestionWidth;
    const swapDescription = wrappedPadding > maxPadding;
    const swappedPadding = swapDescription ? Math.max(wrappedPadding - descriptionWidth, 0) : wrappedPadding;
    const clampedLeftPadding = Math.min(Math.min(wrappedPadding, swappedPadding), maxPadding);

    if (suggestions.length <= this.#activeSuggestionIdx) {
      this.#activeSuggestionIdx = Math.max(suggestions.length - 1, 0);
    }

    if (pagedSuggestions.length == 0) {
      return { data: "", columns: 0 };
    }

    const columnsUsed = pagedSuggestions.length + borderWidth;
    return {
      data:
        ansi.cursorHide +
        ansi.cursorUp(columnsUsed - 1) +
        ansi.cursorForward(clampedLeftPadding) +
        this._renderSuggestions(pagedSuggestions, activePagedSuggestionIndex) +
        ansi.cursorShow,
      columns: columnsUsed,
    };
  }

  update(input: Buffer) {}
}
