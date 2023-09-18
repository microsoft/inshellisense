package suggestions

import (
	"runtime"
	"strings"

	"github.com/charmbracelet/bubbles/cursor"
	"github.com/charmbracelet/bubbles/key"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/cpendery/clac/autocomplete"
	"github.com/cpendery/clac/ui/theme"
	"github.com/cpendery/clac/ui/utils"
	"github.com/google/uuid"
	"github.com/mattn/go-runewidth"
	"github.com/muesli/reflow/wordwrap"
	"github.com/muesli/reflow/wrap"
)

type Model struct {
	cursor                  int
	userInputCursorLocation int
	suggestions             []autocomplete.Suggestion
	argDescription          string
	keyMap                  KeyMap
	windowWidth             int
	windowHeight            int
	runesToRemove           int
	suggestionId            uuid.UUID
}

const (
	SuggestionWidth  = 40
	DescriptionWidth = 30
	BorderOffset     = 2
	MaxSuggestions   = 5
)

type SuggestionMessage struct {
	Id                  uuid.UUID
	Suggestions         []autocomplete.Suggestion
	ArgumentDescription string
	RunesToRemove       int
}

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
	}
	return Model{
		cursor:       0,
		keyMap:       keyBindings,
		suggestionId: uuid.New(),
	}
}

func SuggestCmd(cmd string, suggestionId uuid.UUID) tea.Cmd {
	return func() tea.Msg {
		suggestions, argDescription, runesToRemove := autocomplete.LoadSuggestions(cmd)
		return SuggestionMessage{
			Suggestions:         suggestions,
			ArgumentDescription: argDescription,
			RunesToRemove:       runesToRemove,
			Id:                  suggestionId,
		}
	}
}

func (m *Model) Init(command string) tea.Cmd {
	return SuggestCmd(command, m.suggestionId)
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

func (m Model) ActiveSuggestion() (string, int) {
	return m.suggestions[m.cursor].Name, m.runesToRemove
}

func (m *Model) ResetCursor() {
	m.cursor = 0
}

func (m Model) Update(msg tea.Msg, command string, userInputCursorLocation int) (Model, tea.Cmd) {
	var cmds []tea.Cmd
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch {
		case key.Matches(msg, m.keyMap.LineUp):
			m.cursorUp()
		case key.Matches(msg, m.keyMap.LineDown):
			m.cursorDown()
		}
		m.suggestions, m.argDescription, m.runesToRemove = []autocomplete.Suggestion{}, "", 0
		m.suggestionId = uuid.New()
		cmds = append(cmds, SuggestCmd(command, m.suggestionId))
	case cursor.BlinkMsg:
		if runtime.GOOS == "windows" {
			m.windowWidth, m.windowHeight = utils.GetWindowSize()
		}
	case tea.WindowSizeMsg:
		m.windowHeight = msg.Height
		m.windowWidth = msg.Width
	case SuggestionMessage:
		if m.suggestionId == msg.Id {
			m.suggestions, m.argDescription, m.runesToRemove = msg.Suggestions, msg.ArgumentDescription, msg.RunesToRemove
		}
		if m.cursor > len(m.suggestions)-1 {
			m.cursor = 0
		}
	}
	m.userInputCursorLocation = userInputCursorLocation
	return m, tea.Batch(cmds...)
}

func (m Model) renderSuggestion(suggestion autocomplete.Suggestion, position, cursor, width int) string {
	content := suggestion.NamePrefix + " " + suggestion.Name
	truncatedContent := wordTrunc(content, width)
	if position == m.cursor%MaxSuggestions {
		return lipgloss.NewStyle().Background(theme.ActiveSuggestionBackground).Width(width).Render(truncatedContent)
	}
	return lipgloss.NewStyle().Render(truncatedContent)
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
	suggestionBorder := lipgloss.NormalBorder()
	if m.argDescription != "" {
		suggestionBorder = SuggestionWithDescriptionBorder
	}

	var style = lipgloss.NewStyle().
		Bold(true).
		Width(width).
		BorderStyle(suggestionBorder).
		BorderForeground(theme.BorderForeground)

	m.suggestions = pageSuggestions(m.suggestions, m.cursor)
	r := make([]string, len(m.suggestions))

	for idx, suggestion := range m.suggestions {
		r[idx] = m.renderSuggestion(suggestion, idx, m.cursor, width)
	}

	if m.argDescription != "" {
		descriptionStyle := lipgloss.NewStyle().
			Width(width).
			Border(ArgumentDescriptionBorder, false, true, true, true).
			BorderForeground(theme.BorderForeground)

		return lipgloss.JoinVertical(
			lipgloss.Left,
			style.Render(strings.Join(r, "\n")),
			descriptionStyle.Render(m.argDescription))
	}
	return style.Render(strings.Join(r, "\n"))
}

func (m Model) renderDescription(width int) string {
	var style = lipgloss.NewStyle().
		Bold(true).
		Width(width).
		BorderStyle(lipgloss.NormalBorder()).
		BorderForeground(theme.BorderForeground)

	return style.Render(wordWrap(m.suggestions[m.cursor].Description, width))
}

func (m Model) renderArgumentDescription(width int) string {
	argDescriptionWidth := utils.Clamp(len(m.argDescription), 0, width)
	maxLeftPaddingDescription := m.windowWidth - argDescriptionWidth - BorderOffset
	var style = lipgloss.
		NewStyle().
		MarginLeft(utils.Clamp(m.userInputCursorLocation, 0, maxLeftPaddingDescription)).
		Width(argDescriptionWidth).
		BorderStyle(lipgloss.NormalBorder()).
		BorderForeground(theme.BorderForeground)

	return style.Render(wordWrap(m.argDescription, argDescriptionWidth))
}

func (m Model) View() string {
	if len(m.suggestions) == 0 && m.argDescription == "" {
		return ""
	}

	suggestionWidth := min(m.windowWidth-BorderOffset, SuggestionWidth)
	descriptionWidth := min(m.windowWidth-BorderOffset, DescriptionWidth)

	if len(m.suggestions) == 0 && m.argDescription != "" {
		return m.renderArgumentDescription(descriptionWidth)
	}

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
