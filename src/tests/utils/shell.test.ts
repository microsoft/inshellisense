// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import os from "node:os";
import path from "node:path";
import process from "node:process";
import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { getShellConfig, getShellSourceCommand, hasLegacyShellConfig, Shell, shouldFlagLegacyResourcePlugin, zdotdir } from "../../utils/shell.js";

test("uses a process-specific ZDOTDIR", () => {
  expect(zdotdir).toBe(path.join(os.tmpdir(), `is-zsh-${process.pid}`));
});

const zshDescribe = process.platform === "win32" ? describe.skip : describe;

zshDescribe("zsh initialization", () => {
  let configDirectory: string;

  beforeAll(async () => {
    configDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "is-zsh-init-test-"));
    await fs.writeFile(path.join(configDirectory, ".zshrc"), `is() { print -r -- "wrapped $*"; }\n${getShellConfig(Shell.Zsh)}\n`);
  });

  afterAll(async () => {
    await fs.rm(configDirectory, { recursive: true, force: true });
  });

  test.each([
    { name: "runs interactive commands", args: ["-i", "-c", "print -r -- reached"], stdout: "reached\n" },
    { name: "runs interactive login commands", args: ["-l", "-i", "-c", "print -r -- reached"], stdout: "reached\n" },
    { name: "runs commands with combined login flags", args: ["-li", "-c", "print -r -- reached"], stdout: "reached\n" },
    { name: "runs commands with combined command flags", args: ["-ilc", "print -r -- reached"], stdout: "reached\n" },
    {
      name: "runs commands with additional shell options",
      args: ["-o", "extendedglob", "-ilc", "print -r -- reached"],
      stdout: "reached\n",
    },
    { name: "does not wrap empty interactive commands", args: ["-ic", ""], stdout: "" },
    { name: "does not wrap empty interactive login commands", args: ["-lic", ""], stdout: "" },
    { name: "wraps interactive shells", args: ["-i"], stdout: "wrapped -s zsh\n" },
    { name: "wraps interactive login shells", args: ["-li"], stdout: "wrapped -s zsh --login\n" },
    {
      name: "does not wrap existing inshellisense sessions",
      args: ["-i"],
      env: { ISTERM: "1" },
      input: "print -r -- reached\nexit\n",
      stdout: "reached\n",
    },
    {
      name: "does not wrap VS Code environment resolution",
      args: ["-i"],
      env: { VSCODE_RESOLVING_ENVIRONMENT: "1" },
      input: "print -r -- reached\nexit\n",
      stdout: "reached\n",
    },
    {
      name: "does not wrap non-interactive shells",
      args: [],
      input: 'source "$ZDOTDIR/.zshrc"\nprint -r -- reached\n',
      stdout: "reached\n",
    },
  ])("$name", ({ args, env, input, stdout }) => {
    // Disable line editing so interactive zsh reads the piped input instead of the controlling terminal.
    const result = spawnSync("zsh", ["-d", "+Z", ...args], {
      env: {
        ...process.env,
        HOME: configDirectory,
        ZDOTDIR: configDirectory,
        ISTERM: "",
        VSCODE_RESOLVING_ENVIRONMENT: "",
        ZSH_EXECUTION_STRING: undefined,
        ...env,
      },
      input,
      encoding: "utf8",
      timeout: 5_000,
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(stdout);
  });
});

describe("getShellSourceCommand", () => {
  test.each([
    [Shell.Bash, "~/.inshellisense/init/bash/init.sh", "[ -f ~/.inshellisense/init/bash/init.sh ] && source ~/.inshellisense/init/bash/init.sh"],
    [
      Shell.Powershell,
      "~/.inshellisense/init/powershell/init.ps1",
      "if ( Test-Path '~/.inshellisense/init/powershell/init.ps1' -PathType Leaf ) { . ~/.inshellisense/init/powershell/init.ps1 }",
    ],
    [
      Shell.Pwsh,
      "~/.inshellisense/init/pwsh/init.ps1",
      "if ( Test-Path '~/.inshellisense/init/pwsh/init.ps1' -PathType Leaf ) { . ~/.inshellisense/init/pwsh/init.ps1 }",
    ],
    [Shell.Zsh, "~/.inshellisense/init/zsh/init.zsh", "[[ -f ~/.inshellisense/init/zsh/init.zsh ]] && source ~/.inshellisense/init/zsh/init.zsh"],
    [Shell.Fish, "~/.inshellisense/init/fish/init.fish", "test -f ~/.inshellisense/init/fish/init.fish && source ~/.inshellisense/init/fish/init.fish"],
    [Shell.Xonsh, "~/.inshellisense/init/xonsh/init.xsh", 'p"~/.inshellisense/init/xonsh/init.xsh".exists() && source "~/.inshellisense/init/xonsh/init.xsh"'],
    [Shell.Nushell, "~/.inshellisense/init/nu/init.nu", "if ( '~/.inshellisense/init/nu/init.nu' | path exists ) { source ~/.inshellisense/init/nu/init.nu }"],
  ])("preserves the legacy %s command", (shell, initFilePath, expected) => {
    expect(getShellSourceCommand(shell, initFilePath)).toBe(expected);
  });

  test.each([
    [
      Shell.Bash,
      "/tmp/xdg home/inshellisense/init/bash/init.sh",
      "[ -f '/tmp/xdg home/inshellisense/init/bash/init.sh' ] && source '/tmp/xdg home/inshellisense/init/bash/init.sh'",
    ],
    [
      Shell.Pwsh,
      "/tmp/xdg home/inshellisense/init/pwsh/init.ps1",
      "if ( Test-Path '/tmp/xdg home/inshellisense/init/pwsh/init.ps1' -PathType Leaf ) { . '/tmp/xdg home/inshellisense/init/pwsh/init.ps1' }",
    ],
    [
      Shell.Zsh,
      "/tmp/xdg home/inshellisense/init/zsh/init.zsh",
      "[[ -f '/tmp/xdg home/inshellisense/init/zsh/init.zsh' ]] && source '/tmp/xdg home/inshellisense/init/zsh/init.zsh'",
    ],
    [
      Shell.Fish,
      "/tmp/xdg home/inshellisense/init/fish/init.fish",
      "test -f '/tmp/xdg home/inshellisense/init/fish/init.fish' && source '/tmp/xdg home/inshellisense/init/fish/init.fish'",
    ],
    [
      Shell.Xonsh,
      "/tmp/xdg home/inshellisense/init/xonsh/init.xsh",
      'p"/tmp/xdg home/inshellisense/init/xonsh/init.xsh".exists() && source "/tmp/xdg home/inshellisense/init/xonsh/init.xsh"',
    ],
    [
      Shell.Nushell,
      "/tmp/xdg home/inshellisense/init/nu/init.nu",
      'if ( "/tmp/xdg home/inshellisense/init/nu/init.nu" | path exists ) { source "/tmp/xdg home/inshellisense/init/nu/init.nu" }',
    ],
  ])("quotes an XDG path for %s", (shell, initFilePath, expected) => {
    expect(getShellSourceCommand(shell, initFilePath)).toBe(expected);
  });

  test("escapes shell-specific quote characters", () => {
    expect(getShellSourceCommand(Shell.Bash, "/tmp/user's config/init.sh")).toContain("'/tmp/user'\\''s config/init.sh'");
    expect(getShellSourceCommand(Shell.Pwsh, "/tmp/user's config/init.ps1")).toContain("'/tmp/user''s config/init.ps1'");
  });
});

describe("hasLegacyShellConfig", () => {
  test("detects the original shell plugin marker", () => {
    expect(hasLegacyShellConfig("# inshellisense shell plugin", Shell.Zsh, false)).toBe(true);
  });

  test("detects the original generated plugin path", () => {
    expect(hasLegacyShellConfig("source ~/.inshellisense/zsh/init.zsh", Shell.Zsh, false)).toBe(true);
  });

  test("detects the current path when it should be treated as legacy", () => {
    expect(hasLegacyShellConfig("source ~/.inshellisense/init/zsh/init.zsh", Shell.Zsh, true)).toBe(true);
  });

  test("allows the current path while legacy resources remain current", () => {
    expect(hasLegacyShellConfig("source ~/.inshellisense/init/zsh/init.zsh", Shell.Zsh, false)).toBe(false);
  });
});

describe("shouldFlagLegacyResourcePlugin", () => {
  test.each([
    ["legacy resources without an XDG config", true, false, false],
    ["migrated resources without an XDG config", false, false, true],
    ["legacy resources with an XDG config", true, true, true],
  ])("%s", (_case, usesLegacyResources, hasXdgConfig, expected) => {
    expect(shouldFlagLegacyResourcePlugin(usesLegacyResources, hasXdgConfig)).toBe(expected);
  });
});
