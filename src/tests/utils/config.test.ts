// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { jest } from "@jest/globals";
import { Command } from "commander";

describe("loadConfig", () => {
  test("loads local spec paths as file system paths", async () => {
    const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "inshellisense-home-"));
    const configDir = path.join(tempHome, ".config", "inshellisense");
    const localSpecPath = path.join(tempHome, "local-specs");
    const localSpecPathToml = localSpecPath.replace(/\\/g, "\\\\");

    fs.mkdirSync(configDir, { recursive: true });
    fs.mkdirSync(localSpecPath, { recursive: true });
    fs.writeFileSync(path.join(configDir, "rc.toml"), `[specs]\npath = ["${localSpecPathToml}"]\n`);

    jest.resetModules();
    jest.unstable_mockModule("node:os", () => ({
      default: { homedir: () => tempHome },
      homedir: () => tempHome,
    }));

    try {
      const { loadConfig, getConfig } = await import("../../utils/config.js");

      await loadConfig(new Command());

      expect(getConfig().specs.path).toEqual([path.join(tempHome, ".fig", "autocomplete", "build"), localSpecPath]);
      expect(getConfig().specs.path.every((p) => !p.startsWith("file:"))).toBe(true);
    } finally {
      fs.rmSync(tempHome, { recursive: true, force: true });
      jest.resetModules();
    }
  });
});
