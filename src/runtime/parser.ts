// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import wcwidth from "wcwidth";
import { Shell } from "../utils/shell.js";
import { getShellWhitespaceEscapeChar } from "./utils.js";

export type CommandToken = {
  token: string;
  tokenLength: number;
  complete: boolean;
  isOption: boolean;
  isPersistent?: boolean;
  isPath?: boolean;
  isPathComplete?: boolean;
  isQuoted?: boolean; // used for any token starting with quotes
  isQuoteContinued?: boolean; // used for strings that are fully wrapped in quotes with content after the quotes
};

const cmdDelim = /(\|\|)|(&&)|(;)|(\|)/;
const spaceRegex = /\s/;

export const parseCommand = (command: string, shell: Shell): CommandToken[] => {
  const lastCommand = command.split(cmdDelim).at(-1)?.trimStart();
  const tokens = lastCommand ? lex(lastCommand, shell) : [];
  return sanitizeTokens(tokens, shell);
};

const sanitizeTokens = (cmdTokens: CommandToken[], shell: Shell): CommandToken[] => unwrapQuotedTokens(unescapeSpaceTokens(cmdTokens, shell));

// remove escapes around spaces
const unescapeSpaceTokens = (cmdTokens: CommandToken[], shell: Shell): CommandToken[] => {
  const escapeChar = getShellWhitespaceEscapeChar(shell);
  return cmdTokens.map((cmdToken) => {
    const { token, isQuoted } = cmdToken;
    if (!isQuoted && token.includes(`${escapeChar} `)) {
      return { ...cmdToken, token: token.replaceAll(`${escapeChar} `, " ") };
    }
    return cmdToken;
  });
};

// need to unwrap tokens that are quoted with content after the quotes like `"hello"world`
const unwrapQuotedTokens = (cmdTokens: CommandToken[]): CommandToken[] => {
  return cmdTokens.map((cmdToken) => {
    const { token, isQuoteContinued } = cmdToken;
    if (isQuoteContinued) {
      const quoteChar = token[0];
      const unquotedToken = token.replaceAll(`\\${quoteChar}`, "\u001B").replaceAll(quoteChar, "").replaceAll("\u001B", quoteChar);
      return { ...cmdToken, token: unquotedToken };
    }
    return cmdToken;
  });
};

const lex = (command: string, shell: Shell): CommandToken[] => {
  const tokens: CommandToken[] = [];
  const escapeChar = getShellWhitespaceEscapeChar(shell);
  let [readingQuotedString, readingQuoteContinuedString, readingFlag, readingCmd] = [false, false, false, false];
  let readingIdx = 0;
  let readingQuoteChar = "";

  [...command].forEach((char, idx) => {
    const reading = readingQuotedString || readingQuoteContinuedString || readingFlag || readingCmd;
    if (!reading && (char === `'` || char === `"` || char == "`")) {
      [readingQuotedString, readingIdx, readingQuoteChar] = [true, idx, char];
      return;
    } else if (!reading && char === `-`) {
      [readingFlag, readingIdx] = [true, idx];
      return;
    } else if (!reading && !spaceRegex.test(char)) {
      [readingCmd, readingIdx] = [true, idx];
      return;
    }

    if (readingQuotedString && char === readingQuoteChar && command.at(idx - 1) !== escapeChar && !spaceRegex.test(command.at(idx + 1) ?? " ")) {
      readingQuotedString = false;
      readingQuoteContinuedString = true;
    } else if (readingQuotedString && char === readingQuoteChar && command.at(idx - 1) !== escapeChar) {
      readingQuotedString = false;
      const complete = idx + 1 < command.length && spaceRegex.test(command[idx + 1]);
      tokens.push({
        token: command.slice(readingIdx + 1, idx),
        tokenLength: wcwidth(command.slice(readingIdx + 1, idx)) + 2, // +2 for both quotes
        complete,
        isOption: false,
        isQuoted: true,
      });
    } else if (readingQuoteContinuedString && spaceRegex.test(char) && command.at(idx - 1) !== escapeChar) {
      readingQuoteContinuedString = false;
      tokens.push({
        token: command.slice(readingIdx, idx),
        tokenLength: wcwidth(command.slice(readingIdx, idx)),
        complete: true,
        isOption: false,
        isQuoted: true,
        isQuoteContinued: true,
      });
    } else if ((readingFlag && spaceRegex.test(char)) || char === "=") {
      readingFlag = false;
      tokens.push({
        token: command.slice(readingIdx, idx),
        tokenLength: wcwidth(command.slice(readingIdx, idx)),
        complete: true,
        isOption: true,
      });
    } else if (readingCmd && spaceRegex.test(char) && command.at(idx - 1) !== escapeChar) {
      readingCmd = false;
      tokens.push({
        token: command.slice(readingIdx, idx),
        tokenLength: wcwidth(command.slice(readingIdx, idx)),
        complete: true,
        isOption: false,
      });
    }
  });

  const reading = readingQuotedString || readingQuoteContinuedString || readingFlag || readingCmd;
  if (reading) {
    if (readingQuotedString) {
      tokens.push({
        token: command.slice(readingIdx + 1),
        tokenLength: wcwidth(command.slice(readingIdx + 1)) + 1, // +1 for the leading quote
        complete: false,
        isOption: false,
        isQuoted: true,
      });
    } else if (readingQuoteContinuedString) {
      tokens.push({
        token: command.slice(readingIdx),
        tokenLength: wcwidth(command.slice(readingIdx)),
        complete: false,
        isOption: false,
        isQuoted: true,
        isQuoteContinued: true,
      });
    } else {
      tokens.push({
        token: command.slice(readingIdx),
        tokenLength: wcwidth(command.slice(readingIdx)),
        complete: false,
        isOption: readingFlag,
      });
    }
  }

  return tokens;
};
