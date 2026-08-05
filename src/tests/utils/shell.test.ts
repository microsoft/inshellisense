// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { getShellSourceCommand, hasLegacyShellConfig, Shell, shouldFlagLegacyResourcePlugin } from "../../utils/shell.js";

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
