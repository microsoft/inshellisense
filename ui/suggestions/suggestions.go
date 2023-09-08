package suggestions

import (
	"log"
	"strings"

	"github.com/charmbracelet/bubbles/key"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/cpendery/clac/autocomplete"
	"github.com/cpendery/clac/ui/utils"
)

type Model struct {
	cursor      int
	suggestions []string
	keyMap      KeyMap
}

const (
	SuggestionWidth = 50
	BorderOffset    = 2
)

type KeyMap struct {
	LineUp   key.Binding
	LineDown key.Binding
	PageUp   key.Binding
	PageDown key.Binding
}

func New() Model {
	keyBindings := KeyMap{
		LineUp: key.NewBinding(
			key.WithKeys("up"),
		),
		LineDown: key.NewBinding(
			key.WithKeys("down"),
		),
		PageUp: key.NewBinding(
			key.WithKeys("pgup"),
		),
		PageDown: key.NewBinding(
			key.WithKeys("pgdown"),
		),
	}
	return Model{
		cursor:      0,
		suggestions: []string{"div", "table"},
		keyMap:      keyBindings,
	}
}

func (m *Model) cursorUp() {
	m.cursor = utils.Clamp(m.cursor-1, 0, len(m.suggestions)-1)
}

func (m *Model) cursorDown() {
	m.cursor = utils.Clamp(m.cursor+1, 0, len(m.suggestions)-1)
}

func (m Model) ActiveSuggestion() string {
	return m.suggestions[m.cursor]
}

func (m Model) Update(msg tea.Msg, command string) Model {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch {
		case key.Matches(msg, m.keyMap.LineUp):
			log.Println("up")
			m.cursorUp()
		case key.Matches(msg, m.keyMap.LineDown):
			log.Println("down")
			m.cursorDown()
		}
	}
	m.suggestions = autocomplete.LoadSuggestions(command)
	return m
}

func (m Model) renderSuggestion(suggestion string, position int) string {
	if position == m.cursor {
		return lipgloss.NewStyle().Background(lipgloss.Color("#7D56F4")).Width(SuggestionWidth).Render(suggestion)
	}
	return lipgloss.NewStyle().Render(suggestion)
}

func (m Model) View() string {
	if len(m.suggestions) == 0 {
		return ""
	}

	var style = lipgloss.NewStyle().
		Bold(true).
		Width(SuggestionWidth).
		BorderStyle(lipgloss.NormalBorder()).
		BorderForeground(lipgloss.Color("63"))

	r := make([]string, len(m.suggestions))
	for idx, suggestion := range m.suggestions {
		r[idx] = m.renderSuggestion(suggestion, idx)
	}

	return style.Render(strings.Join(r, "\n"))
}
