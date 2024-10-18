// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export type CommandToken = {
  token: string;
  complete: boolean;
  isOption: boolean;
  isPersistent?: boolean;
  isPath?: boolean;
  isPathComplete?: boolean;
  isQuoted?: boolean; // used for any token starting with quotes
  isQuoteContinued?: boolean; // used for strings that are fully wrapped in quotes with content after the quotes
  isQuoteComplete?: boolean; // used for strings fully wrapped in quotes
};

const cmdDelim = /(\|\|)|(&&)|(;)|(\|)/;
const spaceRegex = /\s/;

export const parseCommand = (command: string): CommandToken[] => {
  const lastCommand = command.split(cmdDelim).at(-1)?.trimStart();
  return lastCommand ? lex(lastCommand) : [];
};

const lex = (command: string): CommandToken[] => {
  const tokens: CommandToken[] = [];
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

    if (readingQuotedString && char === readingQuoteChar && command.at(idx - 1) !== "\\" && !spaceRegex.test(command.at(idx + 1) ?? " ")) {
      readingQuotedString = false;
      readingQuoteContinuedString = true;
    } else if (readingQuotedString && char === readingQuoteChar && command.at(idx - 1) !== "\\") {
      readingQuotedString = false;
      const complete = idx + 1 < command.length && spaceRegex.test(command[idx + 1]);
      tokens.push({
        token: command.slice(readingIdx + 1, idx),
        complete,
        isOption: false,
        isQuoted: true,
      });
    } else if (readingQuoteContinuedString && spaceRegex.test(char) && command.at(idx - 1) !== "\\") {
      readingQuoteContinuedString = false;
      tokens.push({
        token: command.slice(readingIdx, idx),
        complete: true,
        isOption: false,
        isQuoted: true,
        isQuoteContinued: true,
      });
    } else if ((readingFlag && spaceRegex.test(char)) || char === "=") {
      readingFlag = false;
      tokens.push({
        token: command.slice(readingIdx, idx),
        complete: true,
        isOption: true,
      });
    } else if (readingCmd && spaceRegex.test(char) && command.at(idx - 1) !== "\\") {
      readingCmd = false;
      tokens.push({
        token: command.slice(readingIdx, idx),
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
        complete: false,
        isOption: false,
        isQuoted: true,
      });
    } else if (readingQuoteContinuedString) {
      tokens.push({
        token: command.slice(readingIdx),
        complete: false,
        isOption: false,
        isQuoted: true,
        isQuoteContinued: true,
      });
    } else {
      tokens.push({
        token: command.slice(readingIdx),
        complete: false,
        isOption: readingFlag,
      });
    }
  }

  return tokens;
};
