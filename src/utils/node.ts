// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from "node:path";
import sea from "node:sea";
import fsAsync from "node:fs/promises";
import fs from "node:fs";
import { nativeResourcesPath, shellResourcesPath, specResourcesPath } from "./constants.js";

const ASSET_PATH_SEP = "____";

type AssetType = "native" | "shell" | "spec";

const getAssetKeys = (assetType: AssetType) => {
  if (!sea.isSea()) return [];

  const allKeys = sea.getAssetKeys();
  switch (assetType) {
    case "native":
      return allKeys.filter((key) => !key.includes("shellIntegration") && !key.includes("preexec") && !key.endsWith(".js"));
    case "shell":
      return allKeys.filter((key) => key.includes("shellIntegration") || key.includes("preexec"));
    case "spec":
      return allKeys.filter((key) => key.endsWith(".js"));
    default:
      return [];
  }
};

const getAssetFolder = (assetType: AssetType) => {
  switch (assetType) {
    case "native":
      return nativeResourcesPath;
    case "shell":
      return shellResourcesPath;
    case "spec":
      return specResourcesPath;
    default:
      return "";
  }
};

const copyFiles = async(assetType: AssetType, files: string[], sourceFolder: string) => {
  await Promise.all(
      files.map(async (file) => {
        const sourcePath = path.join(sourceFolder, file);
        const destPath = path.join(getAssetFolder(assetType), file);
        if (fs.existsSync(destPath)) return;
        await fsAsync.mkdir(path.dirname(destPath), { recursive: true });
        await fsAsync.copyFile(sourcePath, destPath);
      }),
    );
};

const copyAssets = async (assetType: AssetType) => {
  await Promise.all(
    getAssetKeys(assetType).map(async (assetKey) => {
      const assetPath = assetKey.replaceAll(ASSET_PATH_SEP, path.sep);
      const outputPath = path.join(getAssetFolder(assetType), assetPath);
      if (fs.existsSync(outputPath)) return;
      const assetBlob = sea.getRawAsset(assetKey);
      await fsAsync.mkdir(path.dirname(outputPath), { recursive: true });
      await fsAsync.writeFile(outputPath, Buffer.from(assetBlob));
    }),
  );
};

const unpackNativeModules = async (): Promise<void> => {
  if (!sea.isSea()) return;

  await copyAssets("native");
};

const permissionNativeModules = async (): Promise<void> => {
  if (!sea.isSea()) return;

  const spawnHelper = path.join(nativeResourcesPath, "spawn-helper");
  if (fs.existsSync(spawnHelper)) {
    await fsAsync.chmod(spawnHelper, 0o755);
  }
};

const unpackSpecs = async (): Promise<void> => {
  if (!sea.isSea()) {
    const autocompleteSpecFolderPath = path.join(process.cwd(), "node_modules", "@withfig", "autocomplete", "build");
    const entries = await fsAsync.readdir(autocompleteSpecFolderPath, { recursive: true });
    const files = entries.filter((f) => {
      const fullPath = path.join(autocompleteSpecFolderPath, f.toString());
      return fs.statSync(fullPath).isFile();
    }).map((f) => f.toString());

    await copyFiles("spec", files, autocompleteSpecFolderPath);
  }
  else {
    await copyAssets("spec");
  }
};

const unpackShellFiles = async (): Promise<void> => {
  if (!sea.isSea()) {
    const shellFolderPath = path.join(process.cwd(), "shell");
    const files = (await fsAsync.readdir(shellFolderPath)).map((f) => path.basename(f));

    await copyFiles("shell", files, shellFolderPath);
  } else {
    await copyAssets("shell");
  }
};

export const unpackResources = async (): Promise<void> => {
  await unpackNativeModules();
  await permissionNativeModules();
  await unpackShellFiles();
  await unpackSpecs();
}
