package suggestions

import (
	"runtime"
	"strings"

	"github.com/charmbracelet/bubbles/cursor"
	"github.com/charmbracelet/bubbles/key"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/cpendery/clac/autocomplete"
	"github.com/cpendery/clac/ui/utils"
	"github.com/mattn/go-runewidth"
	"github.com/muesli/reflow/wordwrap"
	"github.com/muesli/reflow/wrap"
)

type Model struct {
	cursor                  int
	userInputCursorLocation int
	suggestions             []autocomplete.Suggestion
	keyMap                  KeyMap
	windowWidth             int
	windowHeight            int
}

const (
	SuggestionWidth  = 40
	DescriptionWidth = 30
	BorderOffset     = 2
	MaxSuggestions   = 5
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
		cursor: 0,
		keyMap: keyBindings,
	}
}

func (m *Model) cursorUp() {
	m.cursor = utils.Clamp(m.cursor-1, 0, len(m.suggestions)-1)
}

func (m *Model) cursorDown() {
	m.cursor = utils.Clamp(m.cursor+1, 0, len(m.suggestions)-1)
}

func (m Model) HasActiveSuggestion() bool {
	return len(m.suggestions) > 0
}

func (m Model) ActiveSuggestion() string {
	return m.suggestions[m.cursor].Name
}

func (m Model) Update(msg tea.Msg, command string, userInputCursorLocation int) Model {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch {
		case key.Matches(msg, m.keyMap.LineUp):
			m.cursorUp()
		case key.Matches(msg, m.keyMap.LineDown):
			m.cursorDown()
		}
	case cursor.BlinkMsg:
		if runtime.GOOS == "windows" {
			m.windowWidth, m.windowHeight = utils.GetWindowSize()
		}
	case tea.WindowSizeMsg:
		m.windowHeight = msg.Height
		m.windowWidth = msg.Width
	}
	m.userInputCursorLocation = userInputCursorLocation
	m.suggestions = autocomplete.LoadSuggestions(command)
	if len(m.suggestions) == 0 {
		m.cursor = 0
	}
	return m
}

func (m Model) renderSuggestion(suggestion string, position, cursor, width int) string {
	content := wordTrunc(suggestion, width)
	if position == m.cursor%MaxSuggestions {
		return lipgloss.NewStyle().Background(lipgloss.Color("#7D56F4")).Width(width).Render(content)
	}
	return lipgloss.NewStyle().Render(content)
}

func wordWrap(content string, width int) string {
	return wrap.String(wordwrap.String(content, width), width)
}

func wordTrunc(content string, width int) string {
	return runewidth.Truncate(content, width, "…")
}

func pageSuggestions(suggestions []autocomplete.Suggestion, cursorLocation int) []autocomplete.Suggestion {
	page := (cursorLocation / MaxSuggestions) + 1
	pagedSuggestions := []autocomplete.Suggestion{}
	for i := (page - 1) * MaxSuggestions; i < min(page*MaxSuggestions, len(suggestions)); i++ {
		pagedSuggestions = append(pagedSuggestions, suggestions[i])
	}
	return pagedSuggestions
}

func (m Model) renderSuggestions(width int) string {
	var style = lipgloss.NewStyle().
		Bold(true).
		Width(width).
		BorderStyle(lipgloss.NormalBorder()).
		BorderForeground(lipgloss.Color("63"))

	m.suggestions = pageSuggestions(m.suggestions, m.cursor)
	r := make([]string, len(m.suggestions))

	for idx, suggestion := range m.suggestions {
		r[idx] = m.renderSuggestion(suggestion.Name, idx, m.cursor, width)
	}

	return style.Render(strings.Join(r, "\n"))
}

func (m Model) renderDescription(width int) string {
	var style = lipgloss.NewStyle().
		Bold(true).
		Width(width).
		BorderStyle(lipgloss.NormalBorder()).
		BorderForeground(lipgloss.Color("63"))

	return style.Render(wordWrap(m.suggestions[m.cursor].Description, width))
}

func (m Model) View() string {
	if len(m.suggestions) == 0 {
		return ""
	}

	suggestionWidth := min(m.windowWidth-BorderOffset, SuggestionWidth)
	descriptionWidth := min(m.windowWidth-BorderOffset, DescriptionWidth)

	suggestionsView := m.renderSuggestions(suggestionWidth)
	descriptionView := m.renderDescription(descriptionWidth)

	maxLeftPadding := m.windowWidth - suggestionWidth - BorderOffset
	maxLeftPaddingWhenJoined := maxLeftPadding - BorderOffset - descriptionWidth
	showDescriptionRight := m.userInputCursorLocation+suggestionWidth+descriptionWidth+BorderOffset*2 <= m.windowWidth
	showDescriptionLeft := !showDescriptionRight && (suggestionWidth+descriptionWidth+BorderOffset*2 <= m.windowWidth)

	if showDescriptionRight {
		return lipgloss.
			NewStyle().
			MarginBottom(1).
			MarginLeft(utils.Clamp(m.userInputCursorLocation, 0, maxLeftPaddingWhenJoined)).
			Render(lipgloss.JoinHorizontal(lipgloss.Top, suggestionsView, descriptionView))

	} else if showDescriptionLeft {
		return lipgloss.
			NewStyle().
			MarginBottom(1).
			MarginLeft(utils.Clamp(m.userInputCursorLocation-DescriptionWidth-BorderOffset, 0, maxLeftPaddingWhenJoined)).
			Render(lipgloss.JoinHorizontal(lipgloss.Top, descriptionView, suggestionsView))
	} else {
		return lipgloss.
			NewStyle().
			MarginBottom(1).
			MarginLeft(utils.Clamp(m.userInputCursorLocation, 0, maxLeftPadding)).
			Render(lipgloss.JoinVertical(lipgloss.Left, suggestionsView, descriptionView))
	}
}
