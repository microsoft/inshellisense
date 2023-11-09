// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState } from "react";
import { Box, Text, render, useApp, useInput } from "ink";

import { supportedShells } from "../utils/bindings.js";

let uiResult = undefined;

function UI() {
  const { exit } = useApp();
  const [selectionIdx, setSelectionIdx] = useState(0);
  const [exited, setExited] = useState(false);

  useInput(async (_, key) => {
    if (key.upArrow) {
      setSelectionIdx(Math.max(0, selectionIdx - 1));
    } else if (key.downArrow) {
      setSelectionIdx(Math.min(supportedShells.length - 1, selectionIdx + 1));
    } else if (key.return) {
      uiResult = supportedShells[selectionIdx];
      setExited(true);
      setTimeout(exit, 0);
    }
  });

  return (
    <>
      {exited ? null : (
        <Box flexDirection="column">
          <Box>
            <Text bold>Select your desired shell</Text>
          </Box>
          <Box flexDirection="column">
            {supportedShells.map((shell, idx) => {
              if (idx == selectionIdx) {
                return (
                  <Text color="cyan" underline key={idx}>
                    {">"} {shell}
                  </Text>
                );
              }
              return (
                <Text key={idx}>
                  {"  "}
                  {shell}
                </Text>
              );
            })}
          </Box>
        </Box>
      )}
    </>
  );
}

export const initRender = async (): Promise<string | undefined> => {
  uiResult = undefined;
  const { waitUntilExit } = render(<UI />);
  await waitUntilExit();

  return uiResult;
};
