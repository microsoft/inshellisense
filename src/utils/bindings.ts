import os from "node:os";
import path from "node:path";
import fsAsync from "node:fs/promises";
import fs from "node:fs";
import process from "node:process";
import url from "node:url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export enum Shell {
  Bash = "bash",
  Powershell = "powershell",
  Pwsh = "pwsh",
}

export const supportedShells = [Shell.Bash, Shell.Powershell, Shell.Pwsh];

const bashScriptCommand = (): string => {
  return `[ -f ~/.sa/key-bindings.bash ] && source ~/.sa/key-bindings.bash`;
};

const powershellScriptCommand = (): string => {
  const bindingsPath = path.join(os.homedir(), ".sa", "key-bindings-powershell.ps1");
  return `if(Test-Path '${bindingsPath}' -PathType Leaf){. ${bindingsPath}}`;
};

const pwshScriptCommand = (): string => {
  const bindingsPath = path.join(os.homedir(), ".sa", "key-bindings-pwsh.ps1");
  return `if(Test-Path '${bindingsPath}' -PathType Leaf){. ${bindingsPath}}`;
};

const pwshConfigPath = (): string => {
  switch (process.platform) {
    case "win32":
      return path.join(os.homedir(), "Documents", "Powershell", "Microsoft.PowerShell_profile.ps1");
    case "linux":
    case "darwin":
      return path.join(os.homedir(), ".config", "powershell", "Microsoft.PowerShell_profile.ps1");
    default:
      throw new Error("Unsupported platform");
  }
};

export const availableBindings = async (): Promise<Shell[]> => {
  const saConfigPath = path.join(os.homedir(), ".sa");
  if (!fs.existsSync(saConfigPath)) {
    await fsAsync.mkdir(saConfigPath);
  }

  const bindings = [];
  const bashConfigPath = path.join(os.homedir(), ".bashrc");
  if (!fs.existsSync(bashConfigPath)) {
    bindings.push(Shell.Bash);
  } else {
    const bashConfigContent = fsAsync.readFile(bashConfigPath, { encoding: "utf-8" });
    if (!(await bashConfigContent).includes(bashScriptCommand())) {
      bindings.push(Shell.Bash);
    }
  }

  const powershellConfigPath = path.join(os.homedir(), "Documents", "WindowsPowershell", "Microsoft.PowerShell_profile.ps1");
  if (!fs.existsSync(powershellConfigPath)) {
    bindings.push(Shell.Powershell);
  } else {
    const powershellConfigContent = fsAsync.readFile(powershellConfigPath, { encoding: "utf-8" });
    if (!(await powershellConfigContent).includes(powershellScriptCommand())) {
      bindings.push(Shell.Powershell);
    }
  }

  if (!fs.existsSync(pwshConfigPath())) {
    bindings.push(Shell.Pwsh);
  } else {
    const pwshConfigContent = fsAsync.readFile(pwshConfigPath(), { encoding: "utf-8" });
    if (!(await pwshConfigContent).includes(pwshScriptCommand())) {
      bindings.push(Shell.Pwsh);
    }
  }

  return bindings;
};

export const bind = async (shell: Shell): Promise<void> => {
  const saConfigPath = path.join(os.homedir(), ".sa");
  if (!fs.existsSync(saConfigPath)) {
    await fsAsync.mkdir(saConfigPath);
  }
  switch (shell) {
    case Shell.Bash:
      const bashConfigPath = path.join(os.homedir(), ".bashrc");
      await fsAsync.appendFile(bashConfigPath, `\n${bashScriptCommand()}`);
      await fsAsync.copyFile(path.join(__dirname, "..", "..", "shell", "key-bindings.bash"), path.join(os.homedir(), ".sa", "key-bindings.bash"));
      break;
    case Shell.Powershell:
      const powershellConfigPath = path.join(os.homedir(), "Documents", "WindowsPowershell", "Microsoft.PowerShell_profile.ps1");
      await fsAsync.appendFile(powershellConfigPath, `\n${powershellScriptCommand()}`);
      await fsAsync.copyFile(
        path.join(__dirname, "..", "..", "shell", "key-bindings-powershell.ps1"),
        path.join(os.homedir(), ".sa", "key-bindings-powershell.ps1")
      );
      break;
    case Shell.Pwsh:
      await fsAsync.appendFile(pwshConfigPath(), `\n${pwshScriptCommand()}`);
      await fsAsync.copyFile(path.join(__dirname, "..", "..", "shell", "key-bindings-pwsh.ps1"), path.join(os.homedir(), ".sa", "key-bindings-pwsh.ps1"));
      break;
  }
};
