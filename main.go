package main

import (
	"log"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/cpendery/clac/ui"
)

func main() {
	p := tea.NewProgram(ui.Start())
	if _, err := p.Run(); err != nil {
		log.Fatal(err)
	}
}
