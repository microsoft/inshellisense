// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as esbuild from "esbuild";
import { execSync } from "node:child_process";
import crypto from "node:crypto";
import { createWriteStream } from "node:fs";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";

const require = createRequire(import.meta.url);

// Constants
const PKG_DIR = "pkg";
const BUNDLE_PATH = path.join(PKG_DIR, "index.cjs");
const SEA_CONFIG_PATH = path.join(PKG_DIR, "sea-config.json");
const SEA_BLOB_PATH = path.join(PKG_DIR, "sea-prep.blob");
const PLATFORM_ARCH = `${process.platform}-${process.arch}`;
const BINARY_NAME = process.platform === "win32" ? `inshellisense-${PLATFORM_ARCH}.exe` : `inshellisense-${PLATFORM_ARCH}`;
const BINARY_PATH = path.join(PKG_DIR, BINARY_NAME);
const NODE_VERSION = "22.21.1";
const ASSET_PATH_SEP = "____";

/** SHA-256 checksums for Node.js binaries from https://nodejs.org/dist/vX.X.X/SHASUMS256.txt */
const NODE_SHASUMS: Record<string, string> = {
  "node-v22.21.1-darwin-arm64.tar.gz": "c170d6554fba83d41d25a76cdbad85487c077e51fa73519e41ac885aa429d8af",
  "node-v22.21.1-darwin-x64.tar.gz": "8e3dc89614debe66c2a6ad2313a1adb06eb37db6cd6c40d7de6f7d987f7d1afd",
  "node-v22.21.1-linux-arm64.tar.gz": "c86830dedf77f8941faa6c5a9c863bdfdd1927a336a46943decc06a38f80bfb2",
  "node-v22.21.1-linux-x64.tar.gz": "219a152ea859861d75adea578bdec3dce8143853c13c5187f40c40e77b0143b2",
  "node-v22.21.1-win-arm64.zip": "b9d7faacd0b540b8b46640dbc8f56f4205ff63b79dec700d4f03d36591b0318f",
  "node-v22.21.1-win-x64.zip": "3c624e9fbe07e3217552ec52a0f84e2bdc2e6ffa7348f3fdfb9fbf8f42e23fcf",
};

const getNodePtyPath = (): string => path.dirname(require.resolve("node-pty"));
const getAutocompletePath = (): string => path.dirname(require.resolve("@withfig/autocomplete"));

const getVersion = (): string => {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
  return packageJson.version;
};

// Bundle utilities
const readBundle = (): string => fs.readFileSync(BUNDLE_PATH, "utf-8");
const writeBundle = (content: string): void => fs.writeFileSync(BUNDLE_PATH, content, "utf-8");

const patchBundle = (search: string, replacement: string, description: string): void => {
  const content = readBundle();
  writeBundle(content.replace(search, replacement));
  console.log(`Patched: ${description}`);
};

const verifySha256 = async (filePath: string): Promise<void> => {
  const filename = path.basename(filePath);
  const expectedSha = NODE_SHASUMS[filename];
  if (!expectedSha) {
    throw new Error(`No SHA-256 checksum found for ${filename}`);
  }

  const fileBuffer = await fsPromises.readFile(filePath);
  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  if (hash !== expectedSha) {
    throw new Error(`SHA-256 mismatch for ${filename}:\n  Expected: ${expectedSha}\n  Actual:   ${hash}`);
  }
  console.log(`SHA-256 verified: ${filename}`);
};

const downloadNodeBinary = async (): Promise<string> => {
  const isWindows = process.platform === "win32";
  const platform = isWindows ? "win" : process.platform;
  const ext = isWindows ? ".zip" : ".tar.gz";
  const archiveName = `node-v${NODE_VERSION}-${platform}-${process.arch}${ext}`;
  const archivePath = path.join(PKG_DIR, archiveName);
  const extractedDir = path.join(PKG_DIR, path.basename(archiveName, ext));
  const nodeBinary = isWindows ? path.join(extractedDir, "node.exe") : path.join(extractedDir, "bin", "node");

  const url = `https://nodejs.org/dist/v${NODE_VERSION}/${archiveName}`;
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download Node.js from ${url}: ${response.statusText}`);
  }
  console.log(`Downloaded Node.js v${NODE_VERSION}`);

  fs.mkdirSync(PKG_DIR, { recursive: true });
  const writer = createWriteStream(archivePath);
  Readable.fromWeb(response.body as ReadableStream).pipe(writer);
  await finished(writer);

  await verifySha256(archivePath);

  if (process.platform === "win32") {
    execSync(`unzip -o "${archivePath}" -d "${PKG_DIR}"`, { stdio: "inherit" });
  } else {
    execSync(`tar -xzf "${archivePath}" -C "${PKG_DIR}"`, { stdio: "inherit" });
  }

  // Clean up archive
  fs.unlinkSync(archivePath);
  return nodeBinary;
};

const unsignBinary = (): void => {
  if (process.platform === "darwin") {
    execSync(`codesign --remove-signature "${BINARY_PATH}"`, { stdio: "inherit" });
  }
  console.log(`Removed code signature (if applicable)`);
};

const signBinary = (): void => {
  if (process.platform === "darwin") {
    execSync(`codesign --sign - --force "${BINARY_PATH}"`, { stdio: "inherit" });
  }
  console.log(`Signed binary (if applicable)`);
};

// Build steps
const buildBundle = async (): Promise<void> => {
  await esbuild.build({
    entryPoints: ["build/index.js"],
    bundle: true,
    outfile: BUNDLE_PATH,
    platform: "node",
    format: "cjs",
    sourcemap: true,
  });
  console.log(`Built bundle: ${BUNDLE_PATH}`);
};

const bundleNodePtyWorker = async (): Promise<string> => {
  const workerPath = path.join(getNodePtyPath(), "worker", "conoutSocketWorker.js");
  const result = await esbuild.build({
    entryPoints: [workerPath],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
  });
  return result.outputFiles?.[0]?.text ?? "";
};

const applyBundlePatches = async (): Promise<void> => {
  // Patch native require
  patchBundle(
    'return { dir, module: require(dir + "/" + name + ".node") };',
    `var req = require("module").createRequire(__filename);
    return { dir, module: req(dir + "/" + name + ".node") };`,
    "native require",
  );

  // Patch native locations
  patchBundle(
    'var dirs = ["build/Release", "build/Debug", "prebuilds/" + process.platform + "-" + process.arch];',
    `var os_1 = require("os");
    var path_1 = require("path");
    var dirs = [path_1.join(os_1.homedir(), ".inshellisense", "native"), "build/Release", "build/Debug", "prebuilds/" + process.platform + "-" + process.arch];`,
    "native locations",
  );

  // Patch to handle absolute paths correctly (skip relative prefixes for absolute paths)
  patchBundle(
    'var dir = r + "/" + d;',
    'var dir = path_1.isAbsolute(d) ? d : r + "/" + d;',
    "absolute path handling",
  );

  // Patch worker inline
  const workerCode = await bundleNodePtyWorker();
  patchBundle(
    'this._worker = new worker_threads_1.Worker(path_1.join(scriptPath, "worker/conoutSocketWorker.js"), { workerData });',
    `var script = \`${workerCode}\`
    this._worker = new worker_threads_1.Worker(script, { workerData, eval: true });`,
    "inline worker",
  );

  // Patch version
  patchBundle("__VERSION__", getVersion(), "version");
};

const copyNodePtyNatives = (): void => {
  const srcDir = path.join(getNodePtyPath(), "..", "prebuilds", PLATFORM_ARCH);
  if (!fs.existsSync(srcDir)) return;

  const destDir = path.join(PKG_DIR, "prebuilds", PLATFORM_ARCH);
  fs.mkdirSync(path.dirname(destDir), { recursive: true });
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log(`Copied natives: ${srcDir} -> ${destDir}`);
};

const copyAutocompleteSpecs = (): void => {
  const srcDir = path.join(getAutocompletePath());
  if (!fs.existsSync(srcDir)) return;

  const destDir = path.join(PKG_DIR, "specs");
  fs.mkdirSync(path.dirname(destDir), { recursive: true });
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log(`Copied specs: ${srcDir} -> ${destDir}`);
};

const generateSeaConfig = (): void => {
  const shellAssets = fs.readdirSync("shell");
  const prebuildsDir = path.join(PKG_DIR, "prebuilds", PLATFORM_ARCH);
  const specsDir = path.join(PKG_DIR, "specs");

  const nativeAssets = fs
    .readdirSync(prebuildsDir, { recursive: true })
    .map(String)
    .filter((file) => !file.endsWith(".pdb"))
    .filter((file) => fs.statSync(path.join(prebuildsDir, file)).isFile());

  const specAssets = fs
    .readdirSync(specsDir, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".js"))
    .filter((file) => fs.statSync(path.join(specsDir, file)).isFile())
    .filter((file) => !["gcloud", "az", "aws"].some((name) => file.startsWith(name + path.sep)));
  
  const assets: Record<string, string> = {};
  shellAssets.forEach((file) => (assets[file] = `shell/${file}`));
  nativeAssets.forEach((file) => {
    assets[file.replaceAll(path.sep, ASSET_PATH_SEP)] = `pkg/prebuilds/${PLATFORM_ARCH}/${file}`.replaceAll(path.sep, "/");
  });
  specAssets.forEach((file) => {
    assets[file.replaceAll(path.sep, ASSET_PATH_SEP)] = `pkg/specs/${file}`.replaceAll(path.sep, "/");
  });

  const seaConfig = {
    main: BUNDLE_PATH,
    output: SEA_BLOB_PATH,
    execArgvExtension: "cli",
    disableExperimentalSEAWarning: true,
    assets,
  };

  fs.mkdirSync(PKG_DIR, { recursive: true });
  fs.writeFileSync(SEA_CONFIG_PATH, JSON.stringify(seaConfig, null, 2), "utf-8");
  console.log(`Generated SEA config: ${SEA_CONFIG_PATH}`);
};

const generateSeaBlob = (): void => {
  execSync(`${BINARY_PATH} --experimental-sea-config ${SEA_CONFIG_PATH}`, { stdio: "inherit" });
  console.log(`Generated SEA blob: ${SEA_BLOB_PATH}`);
};

const copyNodeExecutable = async (): Promise<void> => {
  const nodeBinary = await downloadNodeBinary();
  fs.copyFileSync(nodeBinary, BINARY_PATH);
  console.log(`Copied Node executable: ${BINARY_PATH}`);
};

const injectSeaBlob = async (): Promise<void> => {
  unsignBinary();

  const fuse = "--sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2";
  const macho = process.platform === "darwin" ? "--macho-segment-name NODE_SEA" : "";
  execSync(`npx postject ${BINARY_PATH} NODE_SEA_BLOB ${SEA_BLOB_PATH} ${fuse} ${macho}`.trim(), { stdio: "inherit" });
  console.log(`Injected SEA blob: ${BINARY_PATH}`);

  signBinary();
};

const generatePackageJson = (): void => {
  const packageJson = {
    name: `@microsoft/inshellisense-${PLATFORM_ARCH}`,
    version: getVersion(),
    description: "IDE style command line auto complete",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/microsoft/inshellisense.git",
    },
    os: [process.platform],
    cpu: [process.arch],
    files: [BINARY_NAME],
    bin: {
      is: BINARY_NAME,
      inshellisense: BINARY_NAME,
    },
  };
  fs.writeFileSync(path.join(PKG_DIR, "package.json"), JSON.stringify(packageJson, null, 2), "utf-8");
};

const packageBinary = (): void => {
  execSync(`cd ${PKG_DIR} && npm pack`, { stdio: "inherit" });
};

const main = async (): Promise<void> => {
  await buildBundle();
  await applyBundlePatches();
  copyNodePtyNatives();
  copyAutocompleteSpecs();
  await copyNodeExecutable();
  generateSeaConfig();
  generateSeaBlob();
  await injectSeaBlob();
  generatePackageJson();
  packageBinary();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
