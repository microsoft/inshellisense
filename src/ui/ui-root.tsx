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

function UI({ startingCommand }: { startingCommand: string }) {
  const { exit } = useApp();
  const [isExiting, setIsExiting] = useState(false);
  const [command, setCommand] = useState(startingCommand);
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion>();
  const [tabCompletionDropSize, setTabCompletionDropSize] = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [windowWidth, setWindowWidth] = useState(500);
  const leftPadding = getLeftPadding(windowWidth, command);

  const measureRef = useCallback((node: DOMElement) => {
    if (node !== null) {
      const { width } = measureElement(node);
      setWindowWidth(width);
    }
  }, []);

  useInput((input, key) => {
    if (key.ctrl && input.toLowerCase() == "d") {
      uiResult = undefined;
      exit();
    }
    if (key.return) {
      setIsExiting(true);
    }
  });

  useEffect(() => {
    if (isExiting) {
      uiResult = command;
      exit();
    }
  }, [isExiting]);

  useEffect(() => {
    getSuggestions(command).then((suggestions) => {
      setSuggestions(suggestions?.suggestions ?? []);
      setTabCompletionDropSize(suggestions?.charactersToDrop ?? 0);
    });
  }, [command]);

  if (isExiting) {
    return (
      <Text>
        {Prompt}
        {command}
      </Text>
    );
  }

  return (
    <Box flexDirection="column" ref={measureRef}>
      <Box>
        <Text>
          <Input value={command} setValue={setCommand} prompt={Prompt} activeSuggestion={activeSuggestion} tabCompletionDropSize={tabCompletionDropSize} />
        </Text>
      </Box>
      <Suggestions leftPadding={leftPadding} setActiveSuggestion={setActiveSuggestion} suggestions={suggestions} />
    </Box>
  );
}

export const render = async (command: string | undefined): Promise<string | undefined> => {
  uiResult = undefined;
  const { waitUntilExit } = inkRender(<UI startingCommand={command ?? ""} />);
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
