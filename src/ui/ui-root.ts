// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import ansi from "ansi-escapes";
import { Command } from "commander";

import log from "../utils/log.js";
import { getBackspaceSequence, Shell } from "../utils/shell.js";
import { resetToInitialState } from "../utils/ansi.js";
import { endTiming, incrementMetric, startTiming } from "../utils/performance.js";
import type { KeyPressEvent } from "./suggestionManager.js";
import { BatchScheduler } from "./batchScheduler.js";
import { SuggestionRenderer } from "./suggestionRenderer.js";
import { StdioProxy } from "./stdioProxy.js";

const writeOutput = (data: string) => {
  if (data.length === 0) return;
  log.debug({ msg: "writing data", data });
  incrementMetric("ui.stdoutBytes", Buffer.byteLength(data));
  process.stdout.write(data);
};

export const render = async (program: Command, shell: Shell, underTest: boolean, login: boolean) => {
  const [isterm, { SuggestionManager }] = await Promise.all([import("../isterm/index.js"), import("./suggestionManager.js")]);
  const term = await isterm.default.spawn(program, { shell, rows: process.stdout.rows, cols: process.stdout.columns, underTest, login });
  const suggestions = new SuggestionManager(term, shell);
  const renderer = new SuggestionRenderer(term, suggestions, writeOutput);
  let commandStateVersion = term.getCommandStateVersion();
  let backspaceEchoPending = false;

  const stdinStartedInRawMode = process.stdin.isRaw;
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  const stdio = new StdioProxy({
    onCursorPositionReport: (data) => {
      if (term.consumeCursorPositionQuery()) {
        term.write(data);
      }
    },
  });
  const handleInput = (data: Buffer | string) => stdio.handleInput(data);
  process.stdin.on("data", handleInput);
  writeOutput(ansi.clearTerminal);

  const suggestionScheduler = new BatchScheduler(
    async () => {
      if (await suggestions.exec()) {
        renderer.renderSuggestionUpdate(backspaceEchoPending);
      }
    },
    (error) => log.debug({ msg: "suggestion update failed", error: error instanceof Error ? error.message : error }),
  );

  term.onBufferChange(async (bufferType) => {
    await renderer.handleBufferChange(bufferType);
    backspaceEchoPending = false;
  });

  term.onData((data) => {
    const dataTiming = startTiming();
    try {
      renderer.renderPtyData(stdio.handleOutput(data), backspaceEchoPending);

      if (term.isAlternateBuffer()) {
        commandStateVersion = term.getCommandStateVersion();
        backspaceEchoPending = false;
        return;
      }

      const nextCommandStateVersion = term.getCommandStateVersion();
      if (nextCommandStateVersion !== commandStateVersion) {
        commandStateVersion = nextCommandStateVersion;
        suggestions.invalidate();
        suggestionScheduler.request();
      }
      backspaceEchoPending = false;
    } finally {
      endTiming("ui.ptyData", dataTiming);
    }
  });

  stdio.onKeypress((...keyPress: KeyPressEvent) => {
    const press = keyPress[1];
    if (term.isAlternateBuffer()) {
      term.write(press.name === "backspace" ? getBackspaceSequence(keyPress, shell) : press.sequence);
      return;
    }

    const inputHandled = suggestions.update(press, renderer.hasVisibleSuggestions);
    if (renderer.hasVisibleSuggestions && inputHandled) {
      term.noop();
    } else if (!inputHandled) {
      if (press.name === "backspace") {
        backspaceEchoPending = true;
        term.write(getBackspaceSequence(keyPress, shell));
      } else {
        term.write(press.sequence);
      }
    }
  });

  term.onExit(({ exitCode }) => {
    process.stdin.removeListener("data", handleInput);
    writeOutput(stdio.dispose());
    if (!stdinStartedInRawMode) process.stdin.setRawMode(false);
    process.stdout.write(resetToInitialState);
    process.exit(exitCode);
  });

  process.stdout.on("resize", () => {
    renderer.resize(process.stdout.columns, process.stdout.rows);
  });
  suggestions.initialize();
};
