// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommandToken } from "./parser.js";
import { Suggestion } from "./model.js";
import { wcswidth } from "../utils/unicode.js";

export type ReplacementAction = {
  backspaceCount: number;
  insertText: string;
};

const commonPrefixLength = (a: string, b: string): number => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
};

// Shells delete one character per backspace, but tokenLength is a display width in which wide
// characters (e.g. CJK) count as 2. Quotes and escapes are single-width, so the difference between
// the width and the character count of the token text is exactly the extra width to remove.
const typedCharCount = (token: CommandToken): number => token.tokenLength - (wcswidth(token.token) - Array.from(token.token).length);

export const calculateReplacement = (token: CommandToken | undefined, suggestion: Suggestion): ReplacementAction | undefined => {
  const suggestionText = suggestion.insertValue ?? suggestion.name + " ";

  if (token == null || token.complete) {
    if (!suggestionText.trim()) return undefined;
    return { backspaceCount: 0, insertText: suggestionText };
  }

  const typedText = token.token;
  const tokenCharCount = typedCharCount(token);

  if (suggestion.insertValue != null && suggestion.insertValue !== suggestion.name) {
    return { backspaceCount: tokenCharCount, insertText: suggestionText };
  }

  const target = suggestion.name + " ";
  const prefixLen = commonPrefixLength(typedText, target);

  if (prefixLen === typedText.length) {
    const remaining = target.substring(prefixLen);
    if (!remaining.trim()) return undefined;
    return { backspaceCount: 0, insertText: remaining };
  }

  return { backspaceCount: tokenCharCount, insertText: target };
};

export const applyReplacement = (action: ReplacementAction): string => {
  return "\u007F".repeat(action.backspaceCount) + action.insertText;
};
