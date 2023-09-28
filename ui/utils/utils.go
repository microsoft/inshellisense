// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

package utils

import (
	"os"

	"golang.org/x/term"
)

func Clamp(v, low, high int) int {
	if high < low {
		low, high = high, low
	}
	return min(high, max(low, v))
}

func GetWindowSize() (width int, height int) {
	fd := int(os.Stdout.Fd())
	if term.IsTerminal(fd) {
		width, height, _ = term.GetSize(fd)
	}
	return
}
