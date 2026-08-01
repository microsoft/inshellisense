// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from "node:path";
import sea from "node:sea";
import fsAsync from "node:fs/promises";
import fs from "node:fs";
import { allResourcesPath, getResourcePaths, versionResourcePath } from "./constants.js";
import { getVersion } from "./version.js";

const ASSET_PATH_SEP = "____";

type AssetType = "native" | "shell" | "spec";
type ResourcePaths = ReturnType<typeof getResourcePaths>;

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

const getAssetFolder = (assetType: AssetType, resources: ResourcePaths) => {
  switch (assetType) {
    case "native":
      return resources.native;
    case "shell":
      return resources.shell;
    case "spec":
      return resources.spec;
    default:
      return "";
  }
};

const copyFiles = async (assetType: AssetType, files: string[], sourceFolder: string, resources: ResourcePaths) => {
  await Promise.all(
    files.map(async (file) => {
      const sourcePath = path.join(sourceFolder, file);
      const destPath = path.join(getAssetFolder(assetType, resources), file);
      if (fs.existsSync(destPath)) return;
      await fsAsync.mkdir(path.dirname(destPath), { recursive: true });
      await fsAsync.copyFile(sourcePath, destPath);
    }),
  );
};

const copyAssets = async (assetType: AssetType, resources: ResourcePaths) => {
  await Promise.all(
    getAssetKeys(assetType).map(async (assetKey) => {
      const assetPath = assetKey.replaceAll(ASSET_PATH_SEP, path.sep);
      const outputPath = path.join(getAssetFolder(assetType, resources), assetPath);
      if (fs.existsSync(outputPath)) return;
      const assetBlob = sea.getRawAsset(assetKey);
      await fsAsync.mkdir(path.dirname(outputPath), { recursive: true });
      await fsAsync.writeFile(outputPath, Buffer.from(assetBlob));
    }),
  );
};

const unpackNativeModules = async (resources: ResourcePaths): Promise<void> => {
  if (!sea.isSea()) return;

  await copyAssets("native", resources);
};

const permissionNativeModules = async (resources: ResourcePaths): Promise<void> => {
  if (!sea.isSea()) return;

  const spawnHelper = path.join(resources.native, "spawn-helper");
  if (fs.existsSync(spawnHelper)) {
    await fsAsync.chmod(spawnHelper, 0o755);
  }
};

const unpackSpecs = async (resources: ResourcePaths): Promise<void> => {
  if (!sea.isSea()) {
    const autocompleteSpecFolderPath = path.join(process.cwd(), "node_modules", "@withfig", "autocomplete", "build");
    const entries = await fsAsync.readdir(autocompleteSpecFolderPath, { recursive: true });
    const files = entries
      .filter((f) => {
        const fullPath = path.join(autocompleteSpecFolderPath, f.toString());
        return fs.statSync(fullPath).isFile();
      })
      .map((f) => f.toString());

    await copyFiles("spec", files, autocompleteSpecFolderPath, resources);
  } else {
    await copyAssets("spec", resources);
  }

  const packageJsonPath = path.join(resources.spec, "package.json");
  await fsAsync.mkdir(resources.spec, { recursive: true });
  await fsAsync.writeFile(packageJsonPath, JSON.stringify({ type: "module" }));
};

const unpackShellFiles = async (resources: ResourcePaths): Promise<void> => {
  if (!sea.isSea()) {
    const shellFolderPath = path.join(process.cwd(), "shell");
    const files = (await fsAsync.readdir(shellFolderPath)).map((f) => path.basename(f));

    await copyFiles("shell", files, shellFolderPath, resources);
  } else {
    await copyAssets("shell", resources);
  }
};

const setUnpackedVersion = async (resources: ResourcePaths): Promise<void> => {
  const version = getVersion();
  await fsAsync.writeFile(resources.version, version, "utf-8");
};

export const checkUnpackedVersion = async (): Promise<boolean> => {
  if (!fs.existsSync(versionResourcePath)) {
    return false;
  }
  const unpackedVersion = await fsAsync.readFile(versionResourcePath, "utf-8");
  const currentVersion = getVersion();
  return unpackedVersion === currentVersion;
};

export const unpackResources = async (resourcesPath = allResourcesPath): Promise<void> => {
  const resources = getResourcePaths(resourcesPath);
  await unpackNativeModules(resources);
  await permissionNativeModules(resources);
  await unpackShellFiles(resources);
  await unpackSpecs(resources);
  await setUnpackedVersion(resources);
};
