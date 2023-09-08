package ui

import (
	"fmt"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/cpendery/clac/ui/suggestions"
	"github.com/cpendery/clac/ui/utils"
)

type model struct {
	textInput    textinput.Model
	suggestions  suggestions.Model
	windowHeight int
	windowWidth  int
}

const (
	prompt       = "> "
	promptOffset = len(prompt)
	cursorOffset = 1
	widthOffset  = promptOffset + cursorOffset
)

func Start() model {
	ti := textinput.New()
	ti.Cursor.Style = lipgloss.NewStyle().Foreground(lipgloss.Color("63"))
	ti.Focus()
	sug := suggestions.New()

	return model{textInput: ti, suggestions: sug}
}

func (m model) Init() tea.Cmd {
	return textinput.Blink
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyEnter, tea.KeyCtrlC, tea.KeyEsc:
			return m, tea.Quit
		case tea.KeyTab:
			activeSuggestion := m.suggestions.ActiveSuggestion()
			s := m.textInput.Value() + activeSuggestion
			m.textInput.SetValue(s)
			m.textInput.SetCursor(len(s))
			return m, nil
		}
	case tea.WindowSizeMsg:
		m.windowHeight = msg.Height
		m.windowWidth = msg.Width
		m.textInput.Width = m.windowWidth - widthOffset
	}

	var cmd tea.Cmd
	m.suggestions = m.suggestions.Update(msg, m.textInput.Value())
	m.textInput, cmd = m.textInput.Update(msg)
	return m, cmd
}

func (m model) View() string {
	suggestionsSpacing := lipgloss.NewStyle().MarginLeft(
		utils.Clamp(len(m.textInput.Value())+len(m.textInput.Prompt), 0, m.windowWidth-suggestions.SuggestionWidth-suggestions.BorderOffset),
	)

	return fmt.Sprintf(
		"%s\n%s",
		m.textInput.View(),
		suggestionsSpacing.Render(m.suggestions.View()),
	)
}
