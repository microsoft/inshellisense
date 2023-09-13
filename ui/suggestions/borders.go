package suggestions

import "github.com/charmbracelet/lipgloss"

var SuggestionWithDescriptionBorder = lipgloss.Border{
	Top:         "─",
	Bottom:      "─",
	Left:        "│",
	Right:       "│",
	TopLeft:     "┌",
	TopRight:    "┐",
	BottomLeft:  "├",
	BottomRight: "┤",
}

var ArgumentDescriptionBorder = lipgloss.Border{
	Top:         "",
	Bottom:      "─",
	Left:        "│",
	Right:       "│",
	TopLeft:     "",
	TopRight:    "",
	BottomLeft:  "└",
	BottomRight: "┘",
}
