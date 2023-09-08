package ui

import (
	"fmt"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)



type model struct {
	textInput    textinput.Model
	windowHeight int
	windowWidth  int
}

func Start() model {
	ti := textinput.New()
	ti.Cursor.Style = lipgloss.NewStyle().Foreground(lipgloss.Color("63"))
	ti.Focus()
	return model{textInput: ti}
}

func (m model) Init() tea.Cmd {
	return textinput.Blink
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyEnter, tea.KeyCtrlC, tea.KeyEsc:
			// return m, tea.ClearScreen
			return m, tea.Quit
		}
	case tea.WindowSizeMsg:
		m.windowHeight = msg.Height
		m.windowWidth = msg.Width
	}

	var cmd tea.Cmd
	m.textInput, cmd = m.textInput.Update(msg)
	return m, cmd
}

func (m model) View() string {

	sugWidth := 22
	marginLeft := clamp(len(m.textInput.Value())+len(m.textInput.Prompt), 0, m.windowWidth-sugWidth)

	var style = lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("#FAFAFA")).
		Background(lipgloss.Color("#7D56F4")).
		PaddingTop(2).
		PaddingLeft(4).
		Width(sugWidth).
		MarginLeft(marginLeft)

	return fmt.Sprintf(
		"%s\n%s",
		m.textInput.View(),
		style.Render("Hello, kitty"),
	)
}

// work
func clamp(v, low, high int) int {
	if high < low {
		low, high = high, low
	}
	return min(high, max(low, v))
}
