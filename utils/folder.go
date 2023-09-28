package utils

import (
	"fmt"
	"os"
	"path"
)

const (
	clacHomeFolder = ".clac"
)

func ClacFolder() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("unable to detect home dir: %w", err)
	}
	clacFolderPath := path.Join(homeDir, clacHomeFolder)
	if err := os.MkdirAll(clacFolderPath, 0770); err != nil {
		return "", fmt.Errorf("unable to create .clac folder: %w", err)
	}
	return clacFolderPath, nil
}
