#!/usr/bin/env node
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const { spawnSync } = require("child_process");
const path = require("path");

const platform = process.platform;
const arch = process.arch;

const platformArch = `${platform}-${arch}`;
const packageName = `@microsoft/inshellisense-${platformArch}`;
const binaryName = platform === "win32" 
  ? `inshellisense-${platformArch}.exe` 
  : `inshellisense-${platformArch}`;

try {
  const platformPkgPath = require.resolve(`${packageName}/package.json`);
  const platformPkgDir = path.dirname(platformPkgPath);
  const binaryPath = path.join(platformPkgDir, binaryName);

  const result = spawnSync(binaryPath, process.argv.slice(2), {
    stdio: "inherit",
    shell: false,
  });

  process.exit(result.status ?? 1);
} catch (err) {
  console.error(`inshellisense: Platform ${platformArch} is not supported.`);
  console.error(err.message);
  process.exit(1);
}
