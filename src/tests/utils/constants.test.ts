// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from "node:path";
import { resolveConfigFilePath, resolveResourcesPath, resolveXdgConfigHome, resolveXdgDataHome } from "../../utils/constants.js";

const homeDirectory = path.join(path.sep, "home", "tester");
const xdgConfigDirectory = path.join(path.sep, "tmp", "xdg");
const xdgDataDirectory = path.join(path.sep, "tmp", "xdg-data");

describe("resolveXdgConfigHome", () => {
  test("uses an absolute XDG config directory on Unix", () => {
    expect(resolveXdgConfigHome(xdgConfigDirectory, "linux")).toBe(xdgConfigDirectory);
  });

  test.each([undefined, "", "relative/xdg", "~/.config"])("ignores an unset, empty, or non-absolute XDG config directory", (value) => {
    expect(resolveXdgConfigHome(value, "linux")).toBeUndefined();
  });

  test("preserves the legacy location on Windows", () => {
    expect(resolveXdgConfigHome(xdgConfigDirectory, "win32")).toBeUndefined();
  });
});

describe("resolveResourcesPath", () => {
  test("uses the legacy hidden directory without XDG_CONFIG_HOME", () => {
    expect(resolveResourcesPath(homeDirectory, undefined, false)).toBe(path.join(homeDirectory, ".inshellisense"));
  });

  test("uses an unhidden directory below XDG_DATA_HOME for a new installation", () => {
    expect(resolveResourcesPath(homeDirectory, xdgDataDirectory, false)).toBe(path.join(xdgDataDirectory, "inshellisense"));
  });

  test("preserves an existing legacy resource directory", () => {
    expect(resolveResourcesPath(homeDirectory, xdgDataDirectory, true)).toBe(path.join(homeDirectory, ".inshellisense"));
  });
});

describe("resolveXdgDataHome", () => {
  test("uses an absolute XDG data directory on Unix", () => {
    expect(resolveXdgDataHome(xdgDataDirectory, homeDirectory, "linux")).toBe(xdgDataDirectory);
  });

  test.each([undefined, "", "relative/xdg", "~/.local/share"])("uses the XDG default for an unset, empty, or non-absolute data directory", (value) => {
    expect(resolveXdgDataHome(value, homeDirectory, "linux")).toBe(path.join(homeDirectory, ".local", "share"));
  });

  test("preserves the legacy location on Windows", () => {
    expect(resolveXdgDataHome(xdgDataDirectory, homeDirectory, "win32")).toBeUndefined();
  });
});

describe("resolveConfigFilePath", () => {
  test("uses the XDG default below the home directory", () => {
    expect(resolveConfigFilePath(homeDirectory, undefined)).toBe(path.join(homeDirectory, ".config", "inshellisense", "rc.toml"));
  });

  test("uses XDG_CONFIG_HOME when configured", () => {
    expect(resolveConfigFilePath(homeDirectory, xdgConfigDirectory)).toBe(path.join(xdgConfigDirectory, "inshellisense", "rc.toml"));
  });
});
