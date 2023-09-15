package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var (
	version string
)

func init() {
	rootCmd.AddCommand(versionCmd)
}

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "view clac's version",
	Args:  cobra.ExactArgs(0),
	RunE:  runVersionCmd,
}

func runVersionCmd(_ *cobra.Command, args []string) error {
	fmt.Printf("clac version: %s", version)
	return nil
}
