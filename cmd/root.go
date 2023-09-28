// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

package cmd

import (
	"io"
	"log/slog"
	"os"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/microsoft/clac/autocomplete"
	"github.com/microsoft/clac/ui"
	"github.com/spf13/cobra"
)

var (
	rootCmd = &cobra.Command{
		Use:   `clac [command]`,
		Short: "command line autocomplete",
		Long: `clac - command line autocomplete

clac provides inshellisense for the command line to make developers
more productive

complete documentation is available at https://github.com/microsoft/clac`,
		SilenceUsage:      true,
		Args:              cobra.ArbitraryArgs,
		RunE:              rootExec,
		CompletionOptions: cobra.CompletionOptions{HiddenDefaultCmd: true},
	}
	outputCmd     bool
	enableLogging bool
)

func init() {
	rootCmd.Flags().BoolVarP(&outputCmd, "output-cmd", "o", false, "outputs the last cmd from a clac execution")
	rootCmd.Flags().BoolVarP(&enableLogging, "logging", "l", false, "enable logging to clac.log")
}

func rootExec(cmd *cobra.Command, args []string) error {
	if enableLogging {
		f, err := tea.LogToFile("clac.log", "debug")
		if err != nil {
			return err
		}
		defer f.Close()
	} else {
		slog.SetDefault(slog.New(slog.NewTextHandler(io.Discard, nil)))
	}

	if outputCmd {
		result := autocomplete.ReadResult()
		_, err := os.Stdout.WriteString(result)
		return err
	}
	autocomplete.ClearResult()

	startingInput := ""
	if len(args) >= 1 {
		startingInput = args[0]
	}
	p := tea.NewProgram(ui.Start(startingInput))
	if _, err := p.Run(); err != nil {
		return err
	}
	return nil
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
