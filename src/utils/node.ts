// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from "node:path";
import sea from "node:sea";
import fsAsync from "node:fs/promises";
import fs from "node:fs";
import { allResourcesPath, getResourcePaths } from "./constants.js";
import { getVersion } from "./version.js";
import { createShellConfigs } from "./shell.js";
import { writeFileAtomic } from "./file.js";

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
      await writeFileAtomic(destPath, await fsAsync.readFile(sourcePath));
    }),
  );
};

const copyAssets = async (assetType: AssetType, resources: ResourcePaths) => {
  await Promise.all(
    getAssetKeys(assetType).map(async (assetKey) => {
      const assetPath = assetKey.replaceAll(ASSET_PATH_SEP, path.sep);
      const outputPath = path.join(getAssetFolder(assetType, resources), assetPath);
      await writeFileAtomic(outputPath, new Uint8Array(sea.getRawAsset(assetKey)));
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

const unpackSpecs = async (resources: ResourcePaths, sourceRoot: string): Promise<void> => {
  if (!sea.isSea()) {
    const autocompleteSpecFolderPath = path.join(sourceRoot, "node_modules", "@withfig", "autocomplete", "build");
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
  await writeFileAtomic(packageJsonPath, JSON.stringify({ type: "module" }));
};

const unpackShellFiles = async (resources: ResourcePaths, sourceRoot: string): Promise<void> => {
  if (!sea.isSea()) {
    const shellFolderPath = path.join(sourceRoot, "shell");
    const files = (await fsAsync.readdir(shellFolderPath)).map((f) => path.basename(f));

    await copyFiles("shell", files, shellFolderPath, resources);
  } else {
    await copyAssets("shell", resources);
  }
};

const setUnpackedVersion = async (resources: ResourcePaths): Promise<void> => {
  await writeFileAtomic(resources.version, getVersion());
};

export const checkUnpackedVersion = async (resourcesPath = allResourcesPath): Promise<boolean> => {
  const versionPath = getResourcePaths(resourcesPath).version;
  if (!fs.existsSync(versionPath)) {
    return false;
  }
  const unpackedVersion = await fsAsync.readFile(versionPath, "utf-8");
  const currentVersion = getVersion();
  return unpackedVersion === currentVersion;
};

// Outside of SEA builds (development) resources are copied from the checkout containing the running entry point
// (build/index.js or src/index.ts), independent of the working directory.
const getDevelopmentSourceRoot = (): string => {
  const entryPoint = process.argv[1];
  if (sea.isSea() || entryPoint == null) return process.cwd();
  try {
    return path.resolve(path.dirname(fs.realpathSync(entryPoint)), "..");
  } catch {
    return process.cwd();
  }
};

// sourceRoot is only used outside of SEA builds
export const unpackResources = async (resourcesPath = allResourcesPath, sourceRoot = getDevelopmentSourceRoot()): Promise<void> => {
  const resources = getResourcePaths(resourcesPath);
  await unpackNativeModules(resources);
  await permissionNativeModules(resources);
  await unpackShellFiles(resources, sourceRoot);
  await unpackSpecs(resources, sourceRoot);
  // written last so an interrupted refresh is retried on the next start
  await setUnpackedVersion(resources);
};

/**
 * Brings resources unpacked by a previous inshellisense version up to date in place (keeping the resource location the
 * user's shell profile points at), so upgrading the binary doesn't require a manual `is reinit`.
 */
export const refreshResources = async (resourcesPath = allResourcesPath, sourceRoot = getDevelopmentSourceRoot()): Promise<void> => {
  await createShellConfigs(getResourcePaths(resourcesPath).init);
  await unpackResources(resourcesPath, sourceRoot);
};
