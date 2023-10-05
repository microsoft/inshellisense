import React, { useState, useEffect } from "react";
import { Text } from "ink";

export default function Cursor() {
  const cursorIcon = "█";
  const blinkSpeed = 530;
  const [cursor, setCursor] = useState(cursorIcon);

  useEffect(() => {
    setTimeout(() => {
      setCursor(cursor === cursorIcon ? " " : cursorIcon);
    }, blinkSpeed);
  }, [cursor]);

  return <Text>{cursor}</Text>;
}
