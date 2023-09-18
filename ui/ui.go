package ui

import (
	"fmt"
	"runtime"

	"github.com/charmbracelet/bubbles/cursor"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/cpendery/clac/autocomplete"
	"github.com/cpendery/clac/ui/suggestions"
	"github.com/cpendery/clac/ui/theme"
	"github.com/cpendery/clac/ui/utils"
)

type model struct {
	textInput    textinput.Model
	suggestions  suggestions.Model
	windowHeight int
	windowWidth  int
	complete     bool
}

const (
	clacOutputEnvVar = "CLAC_COMPLETED_CMD"
	prompt           = "> "
	promptOffset     = len(prompt)
	cursorOffset     = 1
	widthOffset      = promptOffset + cursorOffset
)

func Start(startingContent string) model {
	ti := textinput.New()
	ti.SetValue(startingContent)
	ti.Cursor.Style = lipgloss.NewStyle().Foreground(theme.CursorForeground)
	ti.Focus()
	sug := suggestions.New()

	return model{textInput: ti, suggestions: sug}
}

func (m model) Init() tea.Cmd {
	return tea.Batch(textinput.Blink, m.suggestions.Init(m.textInput.Value()))
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyEnter:
			autocomplete.CacheResult(m.textInput.Value())
			m.complete = true
			return m, tea.Quit
		case tea.KeyCtrlC, tea.KeyEsc:
			m.complete = true
			return m, tea.Quit
		case tea.KeyTab:
			if !m.suggestions.HasActiveSuggestion() {
				return m, nil
			}
			activeSuggestion, runesToRemove := m.suggestions.ActiveSuggestion()
			currentValue := m.textInput.Value()
			s := currentValue[:len(currentValue)-runesToRemove] + activeSuggestion + " "
			m.textInput.SetValue(s)
			m.textInput.SetCursor(len(s))
		}
	case cursor.BlinkMsg:
		if runtime.GOOS == "windows" {
			m.windowWidth, m.windowHeight = utils.GetWindowSize()
			m.textInput.Width = m.windowWidth - widthOffset
		}
	case tea.WindowSizeMsg:
		m.windowHeight = msg.Height
		m.windowWidth = msg.Width
		m.textInput.Width = m.windowWidth - widthOffset
	}

	var textInputCmd, suggestionsCmd tea.Cmd
	m.textInput, textInputCmd = m.textInput.Update(msg)
	cursorLocation := len(m.textInput.Value()) + len(m.textInput.Prompt)
	m.suggestions, suggestionsCmd = m.suggestions.Update(msg, m.textInput.Value(), cursorLocation)

	return m, tea.Batch(textInputCmd, suggestionsCmd)
}

func (m model) View() string {
	if m.complete {
		return ""
	}
	return fmt.Sprintf(
		"%s\n%s",
		m.textInput.View(),
		m.suggestions.View(),
	)
}
