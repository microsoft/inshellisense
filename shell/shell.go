// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

package shell

import (
	_ "embed"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/microsoft/clac/utils"
)

var (
	SupportedShells     = []string{"bash", "windows-powershell", "powershell"}
	SupportedShellsText = "[" + strings.Join(SupportedShells, ", ") + "]"
)

const (
	clacHomeFolder = ".clac"
	bashrcFile     = ".bashrc"
)

//go:embed key-bindings.bash
var bashBindings []byte

//go:embed key-bindings.ps1
var powershellBindings []byte

//go:embed key-bindings.zsh
var zshBindings []byte

func CreateBashBinding() error {
	keyBindingFilename := "key-bindings.bash"
	bindingsPath := fmt.Sprintf("~/.clac/%s", keyBindingFilename)
	bindScript := fmt.Sprintf("[ -f %s ] && source %s", bindingsPath, bindingsPath)
	return createBinding(keyBindingFilename, ".bashrc", bindScript, bashBindings)
}

func createBinding(keyBindingFilename, shellConfigFile, bindScript string, bindingData []byte) error {
	clacFolderPath, err := utils.ClacFolder()
	if err != nil {
		return err
	}

	f, err := os.Create(filepath.Join(clacFolderPath, keyBindingFilename))
	if err != nil {
		return fmt.Errorf("unable to create keybindings file: %w", err)
	}
	defer f.Close()

	if _, err = f.Write(bindingData); err != nil {
		return fmt.Errorf("unable to write to keybindings file: %w", err)
	}

	homeDir, _ := os.UserHomeDir()
	shellConfigPath := filepath.Join(homeDir, shellConfigFile)
	if _, err := os.Stat(shellConfigPath); err == nil {
		f, err = os.Open(shellConfigPath)
		if err != nil {
			return fmt.Errorf("unable to read shell config file: %w", err)
		}
		b, err := io.ReadAll(f)
		if err != nil {
			return fmt.Errorf("unable to read shell config file: %w", err)
		}
		if err := f.Close(); err != nil {
			return fmt.Errorf("unable to close shell config file: %w", err)
		}
		if strings.Contains(string(b), bindScript) {
			return nil
		}
	}

	f, err = os.OpenFile(filepath.Join(homeDir, shellConfigFile), os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
	if err != nil {
		return fmt.Errorf("unable to append to shell config file: %w", err)
	}
	defer f.Close()

	if _, err := fmt.Fprintf(f, "\n%s", bindScript); err != nil {
		return fmt.Errorf("unable to append to rc file: %w", err)
	}
	return nil
}

func CreateWindowsPowershellBinding() error {
	return createPShellBinding(filepath.Join("Documents", "WindowsPowershell", "Microsoft.PowerShell_profile.ps1"))
}

func CreatePowershellBinding() error {
	profilePath := ""
	switch runtime.GOOS {
	case "windows":
		profilePath = filepath.Join("Documents", "Powershell")
	case "linux", "darwin":
		profilePath = filepath.Join(".config", "powershell")
	}
	return createPShellBinding(filepath.Join(profilePath, "Microsoft.PowerShell_profile.ps1"))
}

func createPShellBinding(profileFile string) error {
	keyBindingFilename := "key-bindings.ps1"
	clacFolderPath, err := utils.ClacFolder()
	if err != nil {
		return err
	}
	bindingsPath := filepath.Join(clacFolderPath, keyBindingFilename)
	bindScript := fmt.Sprintf("if(Test-Path '%s' -PathType Leaf){. %s}", bindingsPath, bindingsPath)
	return createBinding(keyBindingFilename, profileFile, bindScript, powershellBindings)
}
