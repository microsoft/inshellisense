// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const inshellisenseFolderName = "inshellisense";

export const resolveXdgConfigHome = (value: string | undefined, platform: NodeJS.Platform): string | undefined => {
  return platform !== "win32" && value != null && path.isAbsolute(value) ? value : undefined;
};

export const resolveResourcesPath = (homeDirectory: string, xdgConfigDirectory: string | undefined, hasLegacyResources: boolean): string => {
  return xdgConfigDirectory == null || hasLegacyResources
    ? path.join(homeDirectory, `.${inshellisenseFolderName}`)
    : path.join(xdgConfigDirectory, inshellisenseFolderName);
};

export const resolveConfigFilePath = (homeDirectory: string, xdgConfigDirectory: string | undefined): string => {
  const configDirectory = xdgConfigDirectory ?? path.join(homeDirectory, ".config");
  return path.join(configDirectory, inshellisenseFolderName, "rc.toml");
};

const homeDirectory = os.homedir();
const legacyResourcesPath = path.join(homeDirectory, `.${inshellisenseFolderName}`);
export const xdgConfigHome = resolveXdgConfigHome(process.env.XDG_CONFIG_HOME, process.platform);
export const allResourcesPath = resolveResourcesPath(homeDirectory, xdgConfigHome, fs.existsSync(legacyResourcesPath));
export const usesLegacyResources = allResourcesPath === legacyResourcesPath;
export const xdgConfigPath = resolveConfigFilePath(homeDirectory, xdgConfigHome);
export const loggingResourcesPath = path.join(allResourcesPath, "log");
export const nativeResourcesPath = path.join(allResourcesPath, "native");
export const shellResourcesPath = path.join(allResourcesPath, "shell");
export const specResourcesPath = path.join(allResourcesPath, "spec");
export const initResourcesPath = path.join(allResourcesPath, "init");
export const versionResourcePath = path.join(allResourcesPath, "version.txt");
