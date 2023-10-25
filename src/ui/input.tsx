// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState, useEffect } from "react";
import { useInput, Text } from "ink";
import chalk from "chalk";
import { Suggestion } from "../runtime/model.js";

const BlinkSpeed = 530;
const CursorColor = "#FFFFFF";

export default function Input({
  value,
  setValue,
  prompt,
  activeSuggestion,
  tabCompletionDropSize,
}: {
  value: string;
  setValue: (_: string) => void;
  prompt: string;
  activeSuggestion: Suggestion | undefined;
  tabCompletionDropSize: number;
}) {
  const [cursorLocation, setCursorLocation] = useState(value.length);
  const [cursorBlink, setCursorBlink] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setCursorBlink(!cursorBlink);
    }, BlinkSpeed);
  }, [cursorBlink]);

  // TODO: arrow key navigation shortcuts (emacs & vim modes)
  useInput((input, key) => {
    // TODO: handle delete better on unix systems: https://github.com/vadimdemedes/ink/issues/634
    const windows = process.platform === "win32";
    const backspaceKey = windows ? key.backspace : key.backspace || key.delete;
    const deleteKey = windows ? key.delete : false;

    if (backspaceKey) {
      setValue([...value].slice(0, Math.max(cursorLocation - 1, 0)).join("") + [...value].slice(cursorLocation).join(""));
      setCursorLocation(Math.max(cursorLocation - 1, 0));
    } else if (deleteKey) {
      setValue([...value].slice(0, cursorLocation).join("") + [...value].slice(Math.min(value.length, cursorLocation + 1)).join(""));
    } else if (key.leftArrow) {
      setCursorLocation(Math.max(cursorLocation - 1, 0));
    } else if (key.rightArrow) {
      setCursorLocation(Math.min(cursorLocation + 1, value.length));
    } else if (key.tab) {
      if (activeSuggestion) {
        // TOOD: support insertValue
        const newValue = [...value].slice(0, cursorLocation - tabCompletionDropSize).join("") + activeSuggestion.name + " ";
        setValue(newValue);
        setCursorLocation(newValue.length);
      }
    } else if (input) {
      setValue([...value].slice(0, cursorLocation).join("") + input + [...value].slice(cursorLocation).join(""));
      setCursorLocation(cursorLocation + input.length);
    }
  });

  const cursoredCommand = value + " ";
  const cursoredText =
    [...cursoredCommand].slice(0, cursorLocation).join("") +
    (cursorBlink ? chalk.bgHex(CursorColor).inverse([...cursoredCommand].at(cursorLocation)) : [...cursoredCommand].at(cursorLocation)) +
    [...cursoredCommand].slice(cursorLocation + 1).join("");

  return (
    <Text>
      {prompt}
      {cursoredText}
    </Text>
  );
}
