// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkUnpackedVersion, refreshResources } from "../../utils/node.js";
import { getShellConfig, Shell } from "../../utils/shell.js";
import { getVersion } from "../../utils/version.js";

let directory: string;
let sourceRoot: string;
let resourcesPath: string;

const write = (filePath: string, content: string) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "is-node-test-"));
  sourceRoot = path.join(directory, "source");
  resourcesPath = path.join(directory, "resources");
  write(path.join(sourceRoot, "shell", "shellIntegration-rc.zsh"), "new shell integration");
  write(path.join(sourceRoot, "node_modules", "@withfig", "autocomplete", "build", "git.js"), "new spec");
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

describe("refreshResources", () => {
  test("replaces resources unpacked by a previous version", async () => {
    write(path.join(resourcesPath, "version.txt"), "0.0.1");
    write(path.join(resourcesPath, "shell", "shellIntegration-rc.zsh"), "old shell integration");
    write(path.join(resourcesPath, "spec", "git.js"), "old spec");
    write(path.join(resourcesPath, "init", "zsh", "init.zsh"), "old init");
    expect(await checkUnpackedVersion(resourcesPath)).toBe(false);

    await refreshResources(resourcesPath, sourceRoot);

    expect(fs.readFileSync(path.join(resourcesPath, "shell", "shellIntegration-rc.zsh"), "utf-8")).toBe("new shell integration");
    expect(fs.readFileSync(path.join(resourcesPath, "spec", "git.js"), "utf-8")).toBe("new spec");
    expect(fs.readFileSync(path.join(resourcesPath, "init", "zsh", "init.zsh"), "utf-8")).toBe(getShellConfig(Shell.Zsh));
    expect(fs.readFileSync(path.join(resourcesPath, "version.txt"), "utf-8")).toBe(getVersion());
    expect(await checkUnpackedVersion(resourcesPath)).toBe(true);
  });

  test("can run concurrently", async () => {
    await Promise.all(Array.from({ length: 3 }, () => refreshResources(resourcesPath, sourceRoot)));

    expect(await checkUnpackedVersion(resourcesPath)).toBe(true);
    expect(fs.readdirSync(resourcesPath, { recursive: true }).filter((file) => String(file).endsWith(".tmp"))).toEqual([]);
  });
});
