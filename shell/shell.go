// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

package shell

import (
	_ "embed"
	"fmt"
	"os"
	"path"
	"runtime"
	"strings"

	"github.com/adrg/xdg"
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
	return createShBinding("key-bindings.bash", ".bashrc", bashBindings)
}

func CreateZshBinding() error {
	return createShBinding("key-bindings.zsh", ".zshrc", zshBindings)
}

func createShBinding(keyBindingFilename, rcFilename string, bindingData []byte) error {
	if err := os.MkdirAll(path.Join(xdg.Home, clacHomeFolder), 0770); err != nil {
		return fmt.Errorf("unable to create .clac folder: %w", err)
	}

	f, err := os.Create(path.Join(xdg.Home, clacHomeFolder, keyBindingFilename))
	if err != nil {
		return fmt.Errorf("unable to create keybindings file: %w", err)
	}

	if _, err = f.Write(bashBindings); err != nil {
		return fmt.Errorf("unable to write to keybindings file: %w", err)
	}

	f, err = os.OpenFile(path.Join(xdg.Home, rcFilename), os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
	if err != nil {
		return fmt.Errorf("unable to append to rc file: %w", err)
	}

	bindingsPath := fmt.Sprintf("~/.clac/%s", keyBindingFilename)
	if _, err := fmt.Fprintf(f, "\n[ -f %s ] && source %s", bindingsPath, bindingsPath); err != nil {
		return fmt.Errorf("unable to append to rc file: %w", err)
	}

	return err
}

func CreateWindowsPowershellBinding() error {
	homeDir, _ := os.UserHomeDir()
	profilePath := path.Join(homeDir, "Documents", "WindowsPowershell")
	return createPShellBinding(profilePath, "Microsoft.PowerShell_profile.ps1")
}

func CreatePowershellBinding() error {
	homeDir, _ := os.UserHomeDir()
	profilePath := ""
	switch runtime.GOOS {
	case "windows":
		profilePath = path.Join(homeDir, "Documents", "Powershell")
	case "linux", "darwin":
		profilePath = path.Join("~", ".config", "powershell")
	}
	return createPShellBinding(profilePath, "Microsoft.PowerShell_profile.ps1")
}

func createPShellBinding(profileLocation string, profileFile string) error {
	if err := os.MkdirAll(profileLocation, 0600); err != nil {
		return fmt.Errorf("unable to create powershell's profile directory: %w", err)
	}
	profilePath := path.Join(profileLocation, profileFile)
	f, err := os.OpenFile(profilePath, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
	if err != nil {
		return fmt.Errorf("unable to open/create powershell's profile file: %w", err)
	}

	if _, err := f.Write(powershellBindings); err != nil {
		return fmt.Errorf("unable to append keybindings to powershell's profile: %w", err)
	}
	return nil
}
