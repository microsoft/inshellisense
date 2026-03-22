// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Constants
const PKG_DIR = "pkg";
const SCRIPTS_DIR = "scripts";

const getVersion = (): string => {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
  return packageJson.version;
};

const copyFiles = (): void => {
  const mdFiles = fs.readdirSync(process.cwd()).filter((file) => file.endsWith(".md"));
  for (const file of mdFiles) {
    fs.copyFileSync(file, path.join(PKG_DIR, file));
  }
  fs.copyFileSync("LICENSE", path.join(PKG_DIR, "LICENSE"));
  fs.copyFileSync(path.join(SCRIPTS_DIR, "bin.js"), path.join(PKG_DIR, "bin.js"));
};

const generatePackageJson = (): void => {
  const packageJson = {
    name: `@microsoft/inshellisense`,
    version: getVersion(),
    description: "IDE style command line auto complete",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/microsoft/inshellisense.git",
    },
    author: {
      name: "Microsoft Corporation",
    },
    bugs: {
      url: "https://github.com/microsoft/inshellisense/issues",
    },
    bin: {
      is: "bin.js",
      inshellisense: "bin.js",
    },
    files: ["*.md", "LICENSE", "bin.js"],
    optionalDependencies: {
      "@microsoft/inshellisense-darwin-x64": getVersion(),
      "@microsoft/inshellisense-darwin-arm64": getVersion(),
      "@microsoft/inshellisense-linux-x64": getVersion(),
      "@microsoft/inshellisense-linux-arm64": getVersion(),
      "@microsoft/inshellisense-win32-x64": getVersion(),
      "@microsoft/inshellisense-win32-arm64": getVersion(),
    },
  };
  fs.writeFileSync(path.join(PKG_DIR, "package.json"), JSON.stringify(packageJson, null, 2), "utf-8");
};

const packageBase = (): void => {
  execSync(`cd ${PKG_DIR} && npm pack`, { stdio: "inherit" });
};

const main = async (): Promise<void> => {
  copyFiles();
  generatePackageJson();
  packageBase();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
