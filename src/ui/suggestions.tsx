// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState, useCallback, useEffect } from "react";
import { Text, useInput, Box, measureElement, DOMElement } from "ink";
import wrapAnsi from "wrap-ansi";
import { Suggestion } from "../runtime/model.js";

const MaxSuggestions = 5;
const SuggestionWidth = 40;
const DescriptionWidth = 30;
const DescriptionMaxHeight = 6;
const BorderWidth = 2;
const ActiveSuggestionBackgroundColor = "#7D56F4";

function Description({ description }: { description: string }) {
  wrapAnsi(description, DescriptionWidth, { hard: true });
  if (description.length !== 0) {
    return (
      <Box flexDirection="column">
        <Box borderStyle="single" width={DescriptionWidth}>
          <Text>{truncateDescription(description, DescriptionMaxHeight)}</Text>
        </Box>
      </Box>
    );
  }
}

function truncateDescription(description: string, maxHeight: number) {
  const wrappedText = wrapAnsi(description, DescriptionWidth - BorderWidth, {
    trim: false,
    hard: true,
  });
  const lines = wrappedText.split("\n");
  const truncatedLines = lines.slice(0, maxHeight);
  if (lines.length > maxHeight) {
    truncatedLines[maxHeight - 1] = [...truncatedLines[maxHeight - 1]].slice(0, -1).join("") + "…";
  }
  return truncatedLines.join("\n");
}

function SuggestionList({ suggestions, activeSuggestionIdx }: { suggestions: Suggestion[]; activeSuggestionIdx: number }) {
  return (
    <Box flexDirection="column">
      <Box borderStyle="single" width={SuggestionWidth} flexDirection="column">
        {suggestions
          .map((suggestion, idx) => {
            const bgColor = idx === activeSuggestionIdx ? ActiveSuggestionBackgroundColor : undefined;

            return (
              <Box key={idx}>
                <Text backgroundColor={bgColor} wrap="truncate-end">
                  {`${suggestion.icon} ${suggestion.name}`.padEnd(SuggestionWidth - BorderWidth, " ")}
                </Text>
              </Box>
            );
          })
          .filter((node) => node !== undefined)}
      </Box>
    </Box>
  );
}

export default function Suggestions({
  leftPadding,
  setActiveSuggestion,
  suggestions,
}: {
  leftPadding: number;
  setActiveSuggestion: (_: Suggestion) => void;
  suggestions: Suggestion[];
}) {
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(500);

  const page = Math.floor(activeSuggestionIndex / MaxSuggestions) + 1;
  const pagedSuggestions = suggestions.filter((_, idx) => idx < page * MaxSuggestions && idx >= (page - 1) * MaxSuggestions);
  const activePagedSuggestionIndex = activeSuggestionIndex % MaxSuggestions;
  const activeDescription = pagedSuggestions.at(activePagedSuggestionIndex)?.description || "";

  const wrappedPadding = leftPadding % windowWidth;
  const maxPadding = activeDescription.length !== 0 ? windowWidth - SuggestionWidth - DescriptionWidth : windowWidth - SuggestionWidth;
  const swapDescription = wrappedPadding > maxPadding;
  const swappedPadding = swapDescription ? Math.max(wrappedPadding - DescriptionWidth, 0) : wrappedPadding;
  const clampedLeftPadding = Math.min(Math.min(wrappedPadding, swappedPadding), maxPadding);

  useEffect(() => {
    setActiveSuggestion(suggestions[activeSuggestionIndex]);
  }, [activeSuggestionIndex, suggestions]);

  useEffect(() => {
    if (suggestions.length <= activeSuggestionIndex) {
      setActiveSuggestionIndex(Math.max(suggestions.length - 1, 0));
    }
  }, [suggestions]);

  useInput((_, key) => {
    if (key.upArrow) {
      setActiveSuggestionIndex(Math.max(0, activeSuggestionIndex - 1));
    }
    if (key.downArrow) {
      setActiveSuggestionIndex(Math.min(activeSuggestionIndex + 1, suggestions.length - 1));
    }
  });

  const measureRef = useCallback((node: DOMElement) => {
    if (node !== null) {
      const { width } = measureElement(node);
      setWindowWidth(width);
    }
  }, []);

  if (suggestions.length === 0) return <></>;

  return (
    <Box ref={measureRef}>
      <Box paddingLeft={clampedLeftPadding}>
        {swapDescription ? (
          <>
            <Description description={activeDescription} />
            <SuggestionList suggestions={pagedSuggestions} activeSuggestionIdx={activePagedSuggestionIndex} />
          </>
        ) : (
          <>
            <SuggestionList suggestions={pagedSuggestions} activeSuggestionIdx={activePagedSuggestionIndex} />
            <Description description={activeDescription} />
          </>
        )}
      </Box>
    </Box>
  );
}
