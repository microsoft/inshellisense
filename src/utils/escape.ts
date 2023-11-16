// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const ESC = "\u001B[";

const istermPromptStart = ESC + "?6973l";
const istermPromptEnd = ESC + "?69731l";
const cursorHide = ESC + "?25l";
const cursorShow = ESC + "?25h";

// \033]697;StartPrompt\007

export default { istermPromptEnd, istermPromptStart, cursorHide, cursorShow };
