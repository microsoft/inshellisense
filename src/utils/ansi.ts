// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const ESC = "\u001B[";
const OSC = "\u001B]";
const BEL = "\u0007";

export const IsTermOscPs = 6973;
const IS_OSC = OSC + IsTermOscPs + ";";

export enum IstermOscPt {
  PromptStarted = "PS",
  PromptEnded = "PE",
}

export const IstermPromptStart = IS_OSC + IstermOscPt.PromptStarted + BEL;
export const IstermPromptEnd = IS_OSC + IstermOscPt.PromptEnded + BEL;
export const cursorHide = ESC + "?25l";
export const cursorShow = ESC + "?25h";
export const cursorBackward = (count = 1) => ESC + count + "D";
