// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import ansi from "ansi-escapes";

import type { ISTerm } from "../isterm/pty.js";
import { eraseViewport } from "../utils/ansi.js";
import { endTiming, startTiming } from "../utils/performance.js";
import { getMaxLines, type SuggestionManager } from "./suggestionManager.js";

type PatchBuffer = "active" | "normal";
type TerminalBuffer = "normal" | "alternate";
type Direction = "above" | "below";
type CursorState = ReturnType<ISTerm["getCursorState"]>;

type RenderSnapshot = {
  cursor: CursorState;
  command: ReturnType<ISTerm["getCommandState"]>;
  layout: { direction: Direction; lines: number };
};

type RenderCache = {
  patch?: string;
  clear?: string;
};

export class SuggestionRenderer {
  readonly #term: ISTerm;
  readonly #suggestions: SuggestionManager;
  readonly #writeOutput: (data: string) => void;
  readonly #cache: RenderCache = {};
  #visible = false;
  #direction: Direction;
  #skipNextPtyRender = false;
  #resizeRepaint?: NodeJS.Timeout;
  #resizePending = false;

  constructor(term: ISTerm, suggestions: SuggestionManager, writeOutput: (data: string) => void) {
    this.#term = term;
    this.#suggestions = suggestions;
    this.#writeOutput = writeOutput;
    this.#direction = this.#snapshot().layout.direction;
  }

  get hasVisibleSuggestions(): boolean {
    return this.#visible;
  }

  async handleBufferChange(bufferType: TerminalBuffer): Promise<void> {
    if (bufferType === "alternate") {
      this.#clearNormalBufferSuggestions();
      await this.#suggestions.suspend();
      this.#visible = false;
    } else {
      this.#skipNextPtyRender = true;
      this.#direction = this.#snapshot().layout.direction;
      if (this.#resizePending) this.#scheduleResizeRepaint();
    }
    this.#resetCache();
  }

  renderPtyData(data: string, preserveDuringBackspaceEcho: boolean): void {
    if (this.#term.isAlternateBuffer()) {
      this.#writeOutput(data);
      return;
    }

    if (this.#resizeRepaint != null) {
      this.#writeOutput(data);
      this.#scheduleResizeRepaint();
      return;
    }

    const snapshot = this.#snapshot();
    if (this.#skipNextPtyRender) {
      this.#writeOutput(data);
      this.#skipNextPtyRender = false;
      this.#cache.patch = undefined;
      return;
    }

    if (this.#direction !== snapshot.layout.direction) {
      this.#clearPreviousDirection(snapshot);
    }
    this.#render(data, preserveDuringBackspaceEcho, snapshot);
  }

  renderSuggestionUpdate(preserveDuringBackspaceEcho: boolean): void {
    if (this.#term.isAlternateBuffer() || this.#resizeRepaint != null) return;
    this.#render("", preserveDuringBackspaceEcho, this.#snapshot());
  }

  resize(columns: number, rows: number): void {
    this.#resizePending = true;
    this.#resetCache();
    this.#visible = false;
    this.#term.resize(columns, rows);
    this.#scheduleResizeRepaint();
  }

  #layout(cursor: CursorState): RenderSnapshot["layout"] {
    const maxLines = getMaxLines();
    const { remainingLines, cursorY } = cursor;
    const direction = remainingLines >= maxLines ? "below" : cursorY >= maxLines ? "above" : remainingLines >= cursorY ? "below" : "above";
    const lines = direction === "above" ? Math.min(maxLines, cursorY) : Math.min(maxLines, remainingLines);
    return { direction, lines };
  }

  #snapshot(bufferType: PatchBuffer = "active"): RenderSnapshot {
    const cursor = this.#term.getCursorState(bufferType);
    return {
      cursor,
      command: this.#term.getCommandState(),
      layout: this.#layout(cursor),
    };
  }

  #render(data: string, preserveDuringBackspaceEcho: boolean, snapshot: RenderSnapshot): void {
    const renderTiming = startTiming();
    try {
      const previouslyVisible = this.#visible;
      const {
        layout: { direction, lines },
        cursor: { hidden: cursorHidden, shift: cursorShift, cursorX },
        command,
      } = snapshot;
      const suggestions = this.#suggestions.render(direction, cursorX);
      const fitsViewport = suggestions.length <= lines && suggestions.every(({ startX, length }) => startX >= 0 && startX + length <= this.#term.cols);

      if (!fitsViewport || (!previouslyVisible && suggestions.length === 0)) {
        if (previouslyVisible && this.#cache.clear != null) {
          this.#writeOutput(this.#cache.clear);
        }
        this.#cache.patch = "none";
        this.#cache.clear = undefined;
        this.#writeOutput(data);
        this.#visible = false;
        this.#direction = direction;
        return;
      }

      const cursorTerminated = preserveDuringBackspaceEcho || command.cursorTerminated === true;
      const showSuggestions = suggestions.length !== 0 && fitsViewport && cursorTerminated && !command.hasOutput && !cursorShift && !!command.commandText;
      const visibleSuggestions = showSuggestions ? suggestions : [];
      const renderKey = `${direction}:${lines}:${cursorHidden}:${visibleSuggestions
        .map(({ startX, length, data: patchData }) => `${startX}:${length}:${patchData}`)
        .join("\u0000")}`;

      if (data.length === 0 && previouslyVisible === showSuggestions && this.#cache.patch === renderKey) {
        this.#visible = showSuggestions;
        this.#direction = direction;
        return;
      }

      const patch = this.#term.getPatch(lines, visibleSuggestions, direction);
      this.#writeOutput(this.#renderOutput(data, patch, snapshot));
      this.#cache.patch = renderKey;
      this.#cache.clear = showSuggestions ? this.#clearOutput(direction, snapshot) : undefined;
      this.#visible = showSuggestions;
      this.#direction = direction;
    } finally {
      endTiming("ui.render", renderTiming);
    }
  }

  #renderOutput(data: string, patch: string, snapshot: RenderSnapshot): string {
    const {
      layout: { direction, lines },
      cursor: { hidden: cursorHidden },
    } = snapshot;
    const showCursor = cursorHidden ? "" : ansi.cursorShow;
    if (direction === "above") {
      return data + ansi.cursorHide + ansi.cursorSavePosition + ansi.cursorPrevLine.repeat(lines) + patch + ansi.cursorRestorePosition + showCursor;
    }
    return ansi.cursorHide + ansi.cursorSavePosition + ansi.cursorNextLine + patch + ansi.cursorRestorePosition + showCursor + data;
  }

  #clearOutput(direction: Direction, snapshot: RenderSnapshot, bufferType: PatchBuffer = "active"): string {
    const {
      cursor: { hidden: cursorHidden, cursorY, remainingLines },
    } = snapshot;
    const lines = direction === "above" ? Math.min(getMaxLines(), cursorY) : Math.min(getMaxLines(), remainingLines);
    const patch = this.#term.getPatch(lines, [], direction, bufferType);
    const showCursor = cursorHidden ? "" : ansi.cursorShow;

    if (direction === "above") {
      return ansi.cursorHide + ansi.cursorSavePosition + ansi.cursorPrevLine.repeat(lines) + patch + ansi.cursorRestorePosition + showCursor;
    }
    return ansi.cursorHide + ansi.cursorSavePosition + ansi.cursorNextLine + patch + ansi.cursorRestorePosition + showCursor;
  }

  #clearPreviousDirection(snapshot: RenderSnapshot): void {
    const previousDirection = snapshot.layout.direction === "above" ? "below" : "above";
    this.#writeOutput(this.#clearOutput(previousDirection, snapshot));
    this.#resetCache();
  }

  #clearNormalBufferSuggestions(): void {
    if (!this.#visible) return;
    const clearOutput = this.#cache.clear ?? this.#clearOutput(this.#direction, this.#snapshot("normal"), "normal");
    this.#writeOutput(clearOutput);
  }

  #resetCache(): void {
    this.#cache.patch = undefined;
    this.#cache.clear = undefined;
  }

  #scheduleResizeRepaint(): void {
    if (this.#resizeRepaint != null) clearTimeout(this.#resizeRepaint);
    this.#resizeRepaint = setTimeout(() => {
      this.#resizeRepaint = undefined;
      if (this.#term.isAlternateBuffer()) return;

      this.#resizePending = false;
      const snapshot = this.#snapshot();
      this.#repaintViewport(snapshot);
      this.#render("", false, snapshot);
    }, 150);
  }

  #repaintViewport(snapshot: RenderSnapshot): void {
    const cursor = ansi.cursorTo(snapshot.cursor.cursorX, snapshot.cursor.cursorY);
    const showCursor = snapshot.cursor.hidden ? ansi.cursorHide : ansi.cursorShow;
    this.#writeOutput(ansi.cursorHide + eraseViewport + ansi.cursorTo(0, 0) + this.#term.getViewportPatch() + cursor + showCursor);
  }
}
