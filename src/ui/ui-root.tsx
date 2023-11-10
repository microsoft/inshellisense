// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useCallback, useEffect, useState } from "react";
import { Text, Box, render as inkRender, measureElement, DOMElement, useInput, useApp } from "ink";
import wrapAnsi from "wrap-ansi";

import { getSuggestions } from "../runtime/runtime.js";
import { Suggestion } from "../runtime/model.js";
import Suggestions from "./suggestions.js";
import Input from "./input.js";

const Prompt = "> ";
let uiResult = undefined;

function UI({ startingCommand, commands: historyCommands }: { startingCommand: string; commands: string[] }) {
  const { exit } = useApp();
  const [isExiting, setIsExiting] = useState(false);
  // const [command, setCommand] = useState(startingCommand);
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion>();
  const [tabCompletionDropSize, setTabCompletionDropSize] = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [windowWidth, setWindowWidth] = useState(500);
  const [commands, setCommands] = useState([...historyCommands, ""]);
  const [commandIndex, setCommandIndex] = useState(commands.length - 1);
  const [isResetCursor, setIsResetCursor] = useState(false);
  const [hasSuggestions, setHasSuggestions] = useState(false);
  const leftPadding = getLeftPadding(windowWidth, commands[commandIndex]);

  const setForwardCommand = useCallback(() => setCommandIndex((index) => Math.max(index - 1, 0)), []);

  const setBackwardCommand = useCallback(() => setCommandIndex((index) => Math.min(index + 1, commands.length - 1)), [commands]);

  const measureRef = useCallback((node: DOMElement) => {
    if (node !== null) {
      const { width } = measureElement(node);
      setWindowWidth(width);
    }
  }, []);

  const setCommand = useCallback(
    (value: string) =>
      setCommands((commands) => {
        commands[commandIndex] = value;
        return [...commands];
      }),
    [commandIndex],
  );

  useInput((input, key) => {
    if (key.ctrl && input.toLowerCase() == "d") {
      uiResult = undefined;
      exit();
    } else if (key.return) {
      setIsExiting(true);
    } else if (key.upArrow) {
      if (!hasSuggestions) {
        setForwardCommand();
        setIsResetCursor(true);
      }
    } else if (key.downArrow) {
      if (!hasSuggestions) {
        setBackwardCommand();
        setIsResetCursor(true);
      }
    } else {
      setIsResetCursor(false);
    }
  });

  useEffect(() => {
    if (startingCommand) {
      setCommand(startingCommand);
    }
  }, []);

  useEffect(() => {
    if (isExiting) {
      uiResult = commands[commandIndex];
      exit();
    }
  }, [isExiting]);

  useEffect(() => {
    getSuggestions(commands[commandIndex]).then((suggestions) => {
      suggestions?.suggestions?.length ? setHasSuggestions(true) : setHasSuggestions(false);
      setSuggestions(suggestions?.suggestions ?? []);
      setTabCompletionDropSize(suggestions?.charactersToDrop ?? 0);
    });
  }, [commands, commandIndex]);

  if (isExiting) {
    return (
      <Text>
        {Prompt}
        {commands[commandIndex]}
      </Text>
    );
  }

  return (
    <Box flexDirection="column" ref={measureRef}>
      <Box>
        <Text>
          <Input
            value={commands[commandIndex]}
            setValue={setCommand}
            prompt={Prompt}
            activeSuggestion={activeSuggestion}
            tabCompletionDropSize={tabCompletionDropSize}
            isResetCursor={isResetCursor}
          />
        </Text>
      </Box>
      <Suggestions leftPadding={leftPadding} setActiveSuggestion={setActiveSuggestion} suggestions={suggestions} />
    </Box>
  );
}

export const render = async (command: string | undefined, commands: string[]): Promise<string | undefined> => {
  uiResult = undefined;
  const { waitUntilExit } = inkRender(<UI startingCommand={command ?? ""} commands={commands} />);
  await waitUntilExit();

  return uiResult;
};

function getLeftPadding(windowWidth: number, command: string) {
  const wrappedText = wrapAnsi(command + "", windowWidth, {
    trim: false,
    hard: true,
  });
  const lines = wrappedText.split("\n");
  return (lines.length - 1) * windowWidth + lines[lines.length - 1].length + Prompt.length;
}
