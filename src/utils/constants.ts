// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from "node:path";
import os from "node:os";

const inshellisenseFolderName = ".inshellisense";
export const allResourcesPath = path.join(os.homedir(), inshellisenseFolderName);
export const loggingResourcesPath = path.join(os.homedir(), inshellisenseFolderName, "log");
export const nativeResourcesPath = path.join(os.homedir(), inshellisenseFolderName, "native");
export const shellResourcesPath = path.join(os.homedir(), inshellisenseFolderName, "shell");
export const initResourcesPath = path.join(os.homedir(), inshellisenseFolderName, "init");
