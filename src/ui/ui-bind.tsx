// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect, useState } from "react";
import { Box, Text, render as inkRender, useInput, useApp } from "ink";
import chalk from "chalk";

import { availableBindings, bind, supportedShells, Shell } from "../utils/bindings.js";

let uiResult = "";

function UI() {
  const { exit } = useApp();
  const [selectionIdx, setSelectionIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [availableShells, setAvailableShells] = useState<Shell[]>([]);

  useEffect(() => {
    availableBindings().then((bindings) => {
      if (bindings.length == 0) {
        exit();
      }
      setAvailableShells(bindings);
      setLoaded(true);
    });
  }, []);

  useInput(async (_, key) => {
    if (key.upArrow) {
      setSelectionIdx(Math.max(0, selectionIdx - 1));
    } else if (key.downArrow) {
      setSelectionIdx(Math.min(availableShells.length - 1, selectionIdx + 1));
    } else if (key.return) {
      await bind(availableShells[selectionIdx]);
      uiResult = availableShells[selectionIdx];
      exit();
    }
  });

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>Select your desired shell for keybinding creation</Text>
      </Box>
      <Box flexDirection="column">
        {availableShells.map((shell, idx) => {
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
        {loaded
          ? supportedShells
              .filter((s) => !availableShells.includes(s))
              .map((shell, idx) => (
                <Text color="gray" key={idx}>
                  {"  "}
                  {shell} (already bound)
                </Text>
              ))
          : null}
        {!loaded ? <Text>Loading...</Text> : null}
      </Box>
    </Box>
  );
}

export const render = async () => {
  const { waitUntilExit } = inkRender(<UI />);
  await waitUntilExit();
  if (uiResult.length !== 0) {
    process.stdout.write("\n" + chalk.green("✓") + " successfully created new bindings \n");
  } else {
    process.stdout.write("\n");
  }
};
