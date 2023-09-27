package cmd

import (
	"fmt"
	"slices"
	"strings"

	"github.com/cpendery/clac/shell"
	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(bindCmd)
}

var bindCmd = &cobra.Command{
	Use:   "bind [shell]",
	Short: "adds keybindings to the selected shell " + shell.SupportedShellsText,
	Args: func(_ *cobra.Command, args []string) error {
		if len(args) < 1 {
			return fmt.Errorf("you must select one of the supported shells: %s", shell.SupportedShellsText)
		} else if len(args) > 1 {
			return fmt.Errorf("you can only bind to 1 shell at a time")
		}
		userSelectedShell := strings.TrimSpace(args[0])
		if !slices.Contains(shell.SupportedShells, userSelectedShell) {
			return fmt.Errorf("%s is not one of the supported shells: %s", userSelectedShell, shell.SupportedShellsText)
		}
		return nil
	},
	RunE: runBindCmd,
}

func runBindCmd(_ *cobra.Command, args []string) error {
	userSelectedShell := args[0]
	switch userSelectedShell {
	case "bash":
		return shell.CreateBashBinding()
	case "windows-powershell":
		return shell.CreateWindowsPowershellBinding()
	case "powershell":
		return shell.CreatePowershellBinding()
	case "zsh":
		return shell.CreateZshBinding()
	}
	return nil
}
