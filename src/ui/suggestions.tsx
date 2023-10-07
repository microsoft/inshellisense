import React, { useState, useCallback } from "react";
import { Text, useInput, Box, measureElement, DOMElement } from "ink";
import { Suggestion } from "../runtime/model.js";

const MaxSuggestions = 5;
const SuggestionWidth = 40;
const DescriptionWidth = 30;
const BorderWidth = 2;
const ActiveSuggestionBackgroundColor = "#7D56F4";

function Description({ description }: { description: string }) {
  if (description.length !== 0) {
    return (
      <Box flexDirection="column">
        <Box borderStyle="single" width={DescriptionWidth}>
          <Text>{description}</Text>
        </Box>
      </Box>
    );
  }
}

function SuggestionList({ suggestions, activeSuggestionIdx }: { suggestions: Suggestion[]; activeSuggestionIdx: number }) {
  return (
    <Box flexDirection="column">
      <Box borderStyle="single" width={SuggestionWidth} flexDirection="column">
        {suggestions.map((suggestion, idx) => {
          const bgColor = idx === activeSuggestionIdx ? ActiveSuggestionBackgroundColor : undefined;

          const name = suggestion.name;
          if (name.length === 0) return <></>;

          return (
            <Box key={idx}>
              <Text backgroundColor={bgColor} wrap="truncate-end">
                {name.padEnd(SuggestionWidth - BorderWidth, " ")}
              </Text>
            </Box>
          );
        })}
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

  // TODO: tweak this logic to be more accurate as it gives bad offsets on wrap
  const wrappedPadding = leftPadding % windowWidth;

  const maxPadding = activeDescription.length !== 0 ? windowWidth - SuggestionWidth - DescriptionWidth : windowWidth - SuggestionWidth;

  const swapDescription = wrappedPadding > maxPadding;

  const swappedPadding = swapDescription ? Math.max(wrappedPadding - DescriptionWidth, 0) : wrappedPadding;

  const clampedLeftPadding = Math.min(Math.min(wrappedPadding, swappedPadding), maxPadding);

  useInput((_, key) => {
    if (key.upArrow) {
      setActiveSuggestionIndex(Math.max(0, activeSuggestionIndex - 1));
      setActiveSuggestion(suggestions[activeSuggestionIndex]);
    }
    if (key.downArrow) {
      setActiveSuggestionIndex(Math.min(activeSuggestionIndex + 1, suggestions.length - 1));
      setActiveSuggestion(suggestions[activeSuggestionIndex]);
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
