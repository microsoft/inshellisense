import React, { useCallback, useEffect, useState } from "react";
import {
  Text,
  Box,
  useInput,
  render as inkRender,
  measureElement,
  DOMElement,
} from "ink";
import wrapAnsi from "wrap-ansi";
import { getSuggestions } from "@/runtime/runtime.js";
import Cursor from "./cursor.js";
import Suggestions from "./suggestions.js";

const Prompt = "> ";

function UI() {
  const [command, setCommand] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState<Fig.Suggestion>();
  const [suggestions, setSuggestions] = useState<Fig.Suggestion[]>([]);
  const [windowWidth, setWindowWidth] = useState(500);
  const leftPadding = getLeftPadding(windowWidth, command);

  const measureRef = useCallback((node: DOMElement) => {
    if (node !== null) {
      const { width } = measureElement(node);
      setWindowWidth(width);
    }
  }, []);

  useEffect(() => {
    setSuggestions(getSuggestions(command));
  }, [command]);

  useInput((input, key) => {
    if (key.backspace) {
      setCommand([...command].slice(0, -1).join(""));
    } else {
      setCommand(command + input);
    }
  });

  return (
    <Box flexDirection="column" ref={measureRef}>
      <Box>
        <Text>
          <Text>
            {Prompt}
            {command}
          </Text>
          <Cursor />
        </Text>
      </Box>
      <Suggestions
        leftPadding={leftPadding}
        setActiveSuggestion={setActiveSuggestion}
        suggestions={suggestions}
      />
    </Box>
  );
}

export const render = () => {
  const { waitUntilExit } = inkRender(<UI />);
  return waitUntilExit();
};

function getLeftPadding(windowWidth: number, command: string) {
  const wrappedText = wrapAnsi(command + "", windowWidth, {
    trim: false,
    hard: true,
  });
  const lines = wrappedText.split("\n");
  return (
    (lines.length - 1) * windowWidth +
    lines[lines.length - 1].length +
    Prompt.length
  );
}
