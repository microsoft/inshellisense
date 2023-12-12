// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const ESC = "\u001B";
const CSI = "\u001B[";
const OSC = "\u001B]";
const BEL = "\u0007";
const SS3 = "\u001BO";

export const IsTermOscPs = 6973;
const IS_OSC = OSC + IsTermOscPs + ";";

export enum IstermOscPt {
  PromptStarted = "PS",
  PromptEnded = "PE",
}

export const IstermPromptStart = IS_OSC + IstermOscPt.PromptStarted + BEL;
export const IstermPromptEnd = IS_OSC + IstermOscPt.PromptEnded + BEL;
export const cursorHide = CSI + "?25l";
export const cursorShow = CSI + "?25h";
export const cursorNextLine = CSI + "E";
export const eraseLine = CSI + "2K";
export const cursorBackward = (count = 1) => CSI + count + "D";
export const cursorTo = ({ x, y }: { x?: number; y?: number }) => {
  return CSI + (y ?? "") + ";" + (x ?? "") + "H";
};
export const deleteLinesBelow = (count = 1) => {
  return [...Array(count).keys()].map(() => CSI + "B" + CSI + "M").join("");
};
export const deleteLine = (count = 1) => CSI + count + "M";
export const scrollUp = (count = 1) => CSI + count + "S";
export const scrollDown = (count = 1) => CSI + count + "T";
export const eraseLinesBelow = (count = 1) => {
  return [...Array(count).keys()].map(() => cursorNextLine + eraseLine).join("");
};

export const parseKeystroke = (b: Buffer): "up" | "down" | "tab" | "esc" | undefined => {
  let s: string;
  if (b[0] > 127 && b[1] === undefined) {
    b[0] -= 128;
    s = "\u001B" + String(b);
  } else {
    s = String(b);
  }

  if (s == ESC) {
    return "esc";
  } else if (s == CSI + "A" || s == SS3 + "A") {
    return "up";
  } else if (s == CSI + "B" || s == SS3 + "B") {
    return "down";
  } else if (s == "\t") {
    return "tab";
  }
};
