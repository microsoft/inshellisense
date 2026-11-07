// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Suggestion, SuggestionBlob } from "../runtime/model.js";
import type { ISTerm, ISTermPatch } from "../isterm/pty.js";
import { renderBox, truncateText, truncateMultilineText } from "./utils.js";
import chalk from "chalk";
import { Shell } from "../utils/shell.js";
import log from "../utils/log.js";
import { getConfig } from "../utils/config.js";
import { calculateReplacement, applyReplacement } from "../runtime/replacement.js";
import { getCommandCacheKey } from "../runtime/parser.js";
import { initializeRuntime } from "../runtime/initialize.js";

type SuggestionRuntime = Pick<Awaited<ReturnType<typeof initializeRuntime>>, "getSuggestions"> &
  Partial<Pick<Awaited<ReturnType<typeof initializeRuntime>>, "clearTransientSuggestionState">>;

const getMaxSuggestions = () => getConfig().maxSuggestions ?? 5;
const suggestionWidth = 40;
const descriptionWidth = 30;
const descriptionHeight = 5;
const borderWidth = 2;
const minBoxSize = borderWidth + 1;
// The description is stacked below the suggestions when they don't fit side by side.
const isStacked = (columns: number) => columns < suggestionWidth + descriptionWidth;
export const getMaxLines = (columns = Infinity) =>
  // Reserve an extra line for an unhandled newline at the end of the command.
  (isStacked(columns) ? borderWidth * 2 + getMaxSuggestions() + descriptionHeight : borderWidth + Math.max(getMaxSuggestions(), descriptionHeight)) + 1;

export type KeyPressEvent = [string | null | undefined, KeyPress];

type KeyPress = {
  sequence: string;
  name: string;
  ctrl: boolean;
  shift: boolean;
};

export class SuggestionManager {
  #term: ISTerm;
  #commandKey: string;
  #activeSuggestionIdx: number;
  #suggestBlob?: SuggestionBlob;
  #shell: Shell;
  #hideSuggestions: boolean = false;
  #abortController?: AbortController;
  #runtime?: Promise<SuggestionRuntime>;
  #requestVersion = 0;

  constructor(terminal: ISTerm, shell: Shell, runtime?: Promise<SuggestionRuntime>) {
    this.#term = terminal;
    this.#commandKey = "";
    this.#activeSuggestionIdx = 0;
    this.#shell = shell;
    this.#runtime = runtime;
  }

  initialize(): void {
    this.#runtime ??= initializeRuntime(this.#shell);
    void this.#runtime.catch((e) => log.debug({ msg: "suggestion runtime initialization failed", e: (e as Error).message }));
  }

  private _getRuntime(): Promise<SuggestionRuntime> {
    this.initialize();
    return this.#runtime!;
  }

  invalidate(): void {
    this.#requestVersion += 1;
    this.#abortController?.abort();
  }

  async suspend(): Promise<void> {
    const commandCleared = this.#commandKey.length !== 0 || this.#abortController != null;
    this.invalidate();
    this.#commandKey = "";
    this.#suggestBlob = undefined;
    this.#activeSuggestionIdx = 0;
    this.#hideSuggestions = false;
    if (commandCleared) {
      try {
        const runtime = await this._getRuntime();
        runtime.clearTransientSuggestionState?.();
      } catch (e) {
        log.debug({ msg: "failed to clear transient suggestion state", e: (e as Error).message });
      }
    }
  }

  private async _loadSuggestions(): Promise<boolean> {
    const commandState = this.#term.getCommandState();
    const commandText = commandState.commandText;
    const commandKey = commandText ? `${this.#term.cwd}\u0000${getCommandCacheKey(commandText, this.#shell)}` : "";
    if (commandKey.length !== 0 && commandKey === this.#commandKey && !this.#hideSuggestions && !commandState.hasOutput) {
      return false;
    }
    // Aborting is cooperative; the version check also rejects generators that ignore cancellation.
    const ownVersion = ++this.#requestVersion;
    this.#abortController?.abort();
    if (!commandText) {
      const commandCleared = this.#commandKey.length !== 0 || this.#abortController != null;
      this.#commandKey = "";
      if (commandCleared) {
        const runtime = await this._getRuntime();
        runtime.clearTransientSuggestionState?.();
      }
    }
    if (!commandText || this.#hideSuggestions || commandState.hasOutput) {
      const changed = this.#suggestBlob != null || this.#activeSuggestionIdx !== 0;
      this.#suggestBlob = undefined;
      this.#activeSuggestionIdx = 0;
      return changed;
    }
    const abortController = new AbortController();
    this.#abortController = abortController;
    try {
      const { getSuggestions } = await this._getRuntime();
      abortController.signal.throwIfAborted();
      const suggestionBlob = await getSuggestions(commandText, this.#term.cwd, this.#shell, abortController.signal);
      if (abortController.signal.aborted || ownVersion !== this.#requestVersion) {
        return false;
      }
      this.#commandKey = commandKey;
      this.#suggestBlob = suggestionBlob;
      this.#activeSuggestionIdx = 0;
      return true;
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        log.debug({ msg: "suggestion generation aborted", commandText, shell: this.#shell });
        return false;
      }
      throw e;
    } finally {
      if (this.#abortController === abortController) {
        this.#abortController = undefined;
      }
    }
  }

  private _renderDescription(description: string | undefined, width: number, height: number): string[] {
    if (!description) return [];
    return renderBox(truncateMultilineText(description, width - borderWidth, height), width);
  }

  private _renderSuggestions(suggestions: Suggestion[], activeSuggestionIdx: number, width: number) {
    return renderBox(
      suggestions.map((suggestion, idx) => {
        const suggestionText = `${suggestion.icon} ${suggestion.name}`;
        const truncatedSuggestion = truncateText(suggestionText, width - borderWidth);
        return idx == activeSuggestionIdx ? chalk.bgHex(getConfig().activeSuggestionBackgroundColor)(truncatedSuggestion) : truncatedSuggestion;
      }),
      width,
    );
  }

  private _calculatePadding(suggestionPanelWidth: number, descriptionPanelWidth: number, cursorX: number): { padding: number; swapDescription: boolean } {
    const wrappedPadding = cursorX % this.#term.cols;
    const maxPadding = this.#term.cols - suggestionPanelWidth - descriptionPanelWidth;
    const swapDescription = wrappedPadding > maxPadding && descriptionPanelWidth > 0;
    const swappedPadding = swapDescription ? Math.max(wrappedPadding - descriptionPanelWidth, 0) : wrappedPadding;
    const padding = Math.min(swappedPadding, maxPadding);
    return { padding, swapDescription };
  }

  private _getSuggestionPage(suggestions: Suggestion[], availableLines: number) {
    this.#activeSuggestionIdx = Math.max(0, Math.min(this.#activeSuggestionIdx, suggestions.length - 1));
    const pageSize = Math.max(1, Math.min(getMaxSuggestions(), availableLines - borderWidth));
    const pageStart = Math.floor(this.#activeSuggestionIdx / pageSize) * pageSize;
    const page = suggestions.slice(pageStart, pageStart + pageSize);
    const activeIndex = this.#activeSuggestionIdx - pageStart;
    return { page, activeIndex, activeSuggestion: page.at(activeIndex) };
  }

  private _renderStacked(
    suggestionRows: string[],
    description: string | undefined,
    panelWidth: number,
    cursorX: number,
    availableLines: number,
  ): ISTermPatch[] {
    const remainingLines = availableLines - suggestionRows.length;
    const descriptionRows =
      remainingLines >= minBoxSize ? this._renderDescription(description, panelWidth, Math.min(descriptionHeight, remainingLines - borderWidth)) : [];
    const { padding } = this._calculatePadding(panelWidth, 0, cursorX);
    return [...suggestionRows, ...descriptionRows].map((data) => ({ startX: padding, length: panelWidth, data }));
  }

  private _renderSideBySide(
    suggestionRows: string[],
    description: string | undefined,
    suggestionPanelWidth: number,
    direction: "above" | "below",
    cursorX: number,
    availableLines: number,
  ): ISTermPatch[] {
    const descriptionRows = this._renderDescription(description, descriptionWidth, Math.min(descriptionHeight, availableLines - borderWidth));
    const descriptionPanelWidth = descriptionRows.length > 0 ? descriptionWidth : 0;
    const { swapDescription, padding } = this._calculatePadding(suggestionPanelWidth, descriptionPanelWidth, cursorX);
    const suggestionPanel = { rows: suggestionRows, width: suggestionPanelWidth };
    const descriptionPanel = { rows: descriptionRows, width: descriptionPanelWidth };
    const [left, right] = swapDescription ? [descriptionPanel, suggestionPanel] : [suggestionPanel, descriptionPanel];
    const maxRows = Math.max(left.rows.length, right.rows.length);
    const rowAt = (rows: string[], index: number) => rows[direction === "above" ? index - maxRows + rows.length : index];
    const patches: ISTermPatch[] = [];
    for (let i = 0; i < maxRows; i++) {
      const leftRow = rowAt(left.rows, i);
      const rightRow = rowAt(right.rows, i);
      patches.push({
        startX: padding + (leftRow == null ? left.width : 0),
        length: (leftRow == null ? 0 : left.width) + (rightRow == null ? 0 : right.width),
        data: (leftRow ?? "") + (rightRow ?? ""),
      });
    }
    return patches;
  }

  async exec(): Promise<boolean> {
    return await this._loadSuggestions();
  }

  render(direction: "above" | "below", cursorX: number, availableLines = getMaxLines(this.#term.cols)): ISTermPatch[] {
    if (!this.#suggestBlob || this.#term.cols < minBoxSize || availableLines < minBoxSize) {
      return [];
    }
    const { suggestions, argumentDescription } = this.#suggestBlob;
    const { page, activeIndex, activeSuggestion } = this._getSuggestionPage(suggestions, availableLines);
    const description = activeSuggestion?.description || argumentDescription;
    const panelWidth = Math.min(page.length > 0 ? suggestionWidth : descriptionWidth, this.#term.cols);
    const suggestionRows = page.length > 0 ? this._renderSuggestions(page, activeIndex, panelWidth) : [];

    if (suggestionRows.length === 0 || isStacked(this.#term.cols)) {
      return this._renderStacked(suggestionRows, description, panelWidth, cursorX, availableLines);
    }
    return this._renderSideBySide(suggestionRows, description, panelWidth, direction, cursorX, availableLines);
  }

  update(keyPress: KeyPress, allowBindings = true): boolean {
    const { name, shift, ctrl } = keyPress;
    if (name == "return") {
      this.#term.clearCommand(); // clear the current command on enter
    }

    // if suggestions are hidden, keep them hidden until during command navigation
    if (this.#hideSuggestions) {
      this.#hideSuggestions = name == "up" || name == "down";
    }

    if (!allowBindings || !this.#suggestBlob) {
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
      const suggestion = this.#suggestBlob?.suggestions.at(this.#activeSuggestionIdx);
      if (suggestion == null || this.#suggestBlob?.suggestions.length == 0) {
        return false;
      }
      const action = calculateReplacement(this.#suggestBlob?.activeToken, suggestion);
      if (action == null) {
        return false;
      }
      this.#term.write(applyReplacement(action));
    } else if (name == "return" || (name == "c" && ctrl)) {
      this.#term.clearCommand();
      return false;
    } else {
      return false;
    }
    log.debug({ msg: "handled keypress", ...keyPress });
    return true;
  }
}
