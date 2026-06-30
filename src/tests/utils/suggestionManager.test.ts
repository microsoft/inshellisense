// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { SuggestionManager } from "../../ui/suggestionManager";
import { Shell } from "../../utils/shell";

class FakeTerm {
  commandText = "g";
  cwd = process.cwd();
  cols = 80;

  getCommandState() {
    return { commandText: this.commandText, hasOutput: false, cursorTerminated: true };
  }

  getCursorState() {
    return { cursorX: this.commandText.length, cursorY: 0, remainingLines: 10, hidden: false, shift: 0 };
  }

  clearCommand() {
    return;
  }

  write() {
    return;
  }
}

const keyPress = (name: string, ctrl = false, sequence = name) => ({
  name,
  ctrl,
  shift: false,
  sequence,
});

describe("SuggestionManager keybindings", () => {
  test("up and down hide suggestions and pass through for shell history", async () => {
    const term = new FakeTerm();
    const manager = new SuggestionManager(term as never, Shell.Bash);

    await manager.exec();
    expect(manager.render("below")).not.toHaveLength(0);

    expect(manager.update(keyPress("up", false, "\x1b[A"))).toBe(false);
    expect(manager.render("below")).toHaveLength(0);

    term.commandText = "gi";
    await manager.exec();
    expect(manager.render("below")).toHaveLength(0);

    expect(manager.update(keyPress("x"))).toBe(false);
    term.commandText = "g";
    await manager.exec();
    expect(manager.render("below")).not.toHaveLength(0);
  });

  test("ctrl+n and ctrl+p navigate visible suggestions", async () => {
    const term = new FakeTerm();
    const manager = new SuggestionManager(term as never, Shell.Bash);

    await manager.exec();

    expect(manager.update(keyPress("n", true, "\x0e"))).toBe(true);
    expect(manager.update(keyPress("p", true, "\x10"))).toBe(true);
  });
});
