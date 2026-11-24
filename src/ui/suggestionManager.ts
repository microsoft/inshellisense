// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Suggestion, SuggestionBlob } from "../runtime/model.js";
import type { ISTerm, ISTermPatch } from "../isterm/pty.js";
import { getExpandedBoxSize, renderBox, truncateText, truncateMultilineText } from "./utils.js";
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
const borderWidth = 2;
const minBoxSize = borderWidth + 1;
// The description is stacked below the suggestions when they don't fit side by side.
const isStacked = (columns: number) => columns < suggestionWidth + getConfig().descriptionWidth;
export const getMaxLines = (columns = Infinity) => {
  const { descriptionHeight, truncateDescriptions } = getConfig();
  if (!truncateDescriptions) return Infinity;
  // Reserve an extra line for an unhandled newline at the end of the command.
  return (isStacked(columns) ? borderWidth * 2 + getMaxSuggestions() + descriptionHeight : borderWidth + Math.max(getMaxSuggestions(), descriptionHeight)) + 1;
};

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
  #historyMode: "navigating" | "editing" | undefined;
  #historyCommandText = "";
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
    this.#historyMode = undefined;
    this.#historyCommandText = "";
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
    const currentCommandText = commandText ?? "";
    const commandKey = commandText ? `${this.#term.cwd}\u0000${getCommandCacheKey(commandText, this.#shell)}` : "";
    if (this.#historyMode !== undefined && currentCommandText !== this.#historyCommandText) {
      this.#historyCommandText = currentCommandText;
      if (this.#historyMode === "editing") {
        this.#historyMode = undefined;
        this.#historyCommandText = "";
        if (commandText) this.#commandKey = "";
      }
    }
    if (commandKey.length !== 0 && commandKey === this.#commandKey && !this.#hideSuggestions && this.#historyMode === undefined && !commandState.hasOutput) {
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
    if (!commandText || this.#hideSuggestions || this.#historyMode !== undefined || commandState.hasOutput) {
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

  private _renderDescription(description: string | undefined, width: number, maxWidth: number, availableLines: number) {
    if (!description || availableLines < minBoxSize) return { rows: [], width: 0 };
    const { descriptionHeight, truncateDescriptions } = getConfig();
    const size = truncateDescriptions
      ? { width: Math.min(width, maxWidth), height: Math.min(descriptionHeight + borderWidth, availableLines) }
      : getExpandedBoxSize(description, width, descriptionHeight + borderWidth, maxWidth, availableLines);
    return {
      rows: renderBox(truncateMultilineText(description, size.width - borderWidth, size.height - borderWidth), size.width),
      width: size.width,
    };
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

  private _renderSideBySide(
    suggestionRows: string[],
    descriptionRows: string[],
    suggestionPanelWidth: number,
    descriptionPanelWidth: number,
    direction: "above" | "below",
    cursorX: number,
  ): ISTermPatch[] {
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
    const { descriptionWidth } = getConfig();
    const stacked = page.length === 0 || isStacked(this.#term.cols);
    const baseWidth = page.length > 0 ? suggestionWidth : descriptionWidth;
    const descriptionPanel = this._renderDescription(
      description,
      stacked ? Math.max(baseWidth, descriptionWidth) : descriptionWidth,
      stacked ? this.#term.cols : this.#term.cols - suggestionWidth,
      availableLines - (stacked && page.length > 0 ? page.length + borderWidth : 0),
    );
    const panelWidth = Math.min(stacked ? Math.max(baseWidth, descriptionPanel.width) : baseWidth, this.#term.cols);
    const suggestionRows = page.length > 0 ? this._renderSuggestions(page, activeIndex, panelWidth) : [];

    if (stacked) {
      const { padding } = this._calculatePadding(panelWidth, 0, cursorX);
      return [...suggestionRows, ...descriptionPanel.rows].map((data) => ({ startX: padding, length: panelWidth, data }));
    }
    return this._renderSideBySide(suggestionRows, descriptionPanel.rows, panelWidth, descriptionPanel.width, direction, cursorX);
  }

  update(keyPress: KeyPress, allowBindings = true): boolean {
    const { name, shift, ctrl } = keyPress;
    const isHistoryKey = (name === "up" || name === "down") && !shift && !ctrl;

    if (name === "return" || (name === "c" && ctrl)) {
      this.#historyMode = undefined;
      this.#historyCommandText = "";
    }

    if (name == "return") {
      this.#term.clearCommand(); // clear the current command on enter
    }

    if (isHistoryKey && !allowBindings) {
      // Let the shell navigate history and keep suggestions hidden for recalled commands.
      this.#historyMode = "navigating";
      this.#historyCommandText = this.#term.getCommandState().commandText ?? "";
      this.invalidate();
      this.#suggestBlob = undefined;
      this.#activeSuggestionIdx = 0;
      return false;
    }

    if (this.#historyMode !== undefined && !isHistoryKey) {
      // Let the shell handle the key, then use the resulting command text to detect edits.
      this.#historyMode = "editing";
      this.#historyCommandText = this.#term.getCommandState().commandText ?? "";
    }

    // Keep dismissed suggestions hidden while navigating command history.
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
