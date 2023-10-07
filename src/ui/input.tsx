import React, { useState, useEffect } from "react";
import { useInput, Text } from "ink";
import chalk from "chalk";

const BlinkSpeed = 530;
const CursorColor = "#FFFFFF";

export default function Input({ value, setValue, prompt }: { value: string; setValue: (_: string) => void; prompt: string }) {
  const [cursorLocation, setCursorLocation] = useState(value.length);
  const [cursorBlink, setCursorBlink] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setCursorBlink(!cursorBlink);
    }, BlinkSpeed);
  }, [cursorBlink]);

  // TODO: arrow key navigation shortcuts (emacs & vim modes)
  useInput((input, key) => {
    if (key.backspace) {
      setValue([...value].slice(0, Math.max(cursorLocation - 1, 0)).join("") + [...value].slice(cursorLocation).join(""));
      setCursorLocation(Math.max(cursorLocation - 1, 0));
    } else if (key.delete) {
      setValue([...value].slice(0, cursorLocation).join("") + [...value].slice(Math.min(value.length, cursorLocation + 1)).join(""));
    } else if (key.leftArrow) {
      setCursorLocation(Math.max(cursorLocation - 1, 0));
    } else if (key.rightArrow) {
      setCursorLocation(Math.min(cursorLocation + 1, value.length));
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
