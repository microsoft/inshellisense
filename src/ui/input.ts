// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export const inputModifier = (input: Buffer): string => {
  switch (input.toString()) {
    case "\b":
      return "\u007F"; // DEL
  }
  return input.toString();
};
