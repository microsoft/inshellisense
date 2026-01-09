// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from "node:path";
import sea from "node:sea";
import fsAsync from "node:fs/promises";
import fs from "node:fs";
import { nativeResourcesPath, shellResourcesPath } from "./constants.js";

export const unpackNativeModules = async (): Promise<void> => {
  if (!sea.isSea()) return;

  const assetKeys = sea.getAssetKeys().filter(
    (key) => !key.includes("shellIntegration") && !key.includes("preexec")
  );

  await Promise.all(
    assetKeys.map(async (assetKey) => {
      const assetPath = assetKey == "conpty.dll" || assetKey == "OpenConsole.exe" ? path.join("conpty", assetKey) : assetKey;
      const outputPath = path.join(nativeResourcesPath, assetPath);
      if (fs.existsSync(outputPath)) return;
      const assetBlob = sea.getRawAsset(assetKey);
      await fsAsync.mkdir(path.dirname(outputPath), { recursive: true });
      await fsAsync.writeFile(outputPath, Buffer.from(assetBlob));
    })
  );
};

export const unpackShellFiles = async (): Promise<void> => {
  if (!sea.isSea()) {
    const shellFolderPath = path.join(process.cwd(), "shell");
    const files = (await fsAsync.readdir(shellFolderPath)).map((f) => path.basename(f));

    await Promise.all(
      files.map(async (file) => {
        const sourcePath = path.join(shellFolderPath, file);
        const destPath = path.join(shellResourcesPath, file);
        if (fs.existsSync(destPath)) return;
        await fsAsync.mkdir(path.dirname(destPath), { recursive: true });
        await fsAsync.copyFile(sourcePath, destPath);
      })
    );
  } else {
    const assetKeys = sea.getAssetKeys().filter(
      (key) => key.includes("shellIntegration") || key.includes("preexec")
    );

    await Promise.all(
      assetKeys.map(async (assetKey) => {
        const outputPath = path.join(shellResourcesPath, assetKey);
        if (fs.existsSync(outputPath)) return;
        const assetBlob = sea.getRawAsset(assetKey);
        await fsAsync.mkdir(path.dirname(outputPath), { recursive: true });
        await fsAsync.writeFile(outputPath, Buffer.from(assetBlob));
      })
    );
  }
};
