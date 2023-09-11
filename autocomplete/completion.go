package autocomplete

import (
	"log"
	"regexp"

	"github.com/cpendery/clac/autocomplete/specs"
)

type Suggestion struct {
	Name        string
	Description string
}

var (
	cmdDelimiter      = regexp.MustCompile(`(\|\|)|(&&)|(;)`)
	lastSuggestionCmd = ""
	lastSuggestion    = []Suggestion{}
)

func loadSuggestions(cmd string) (suggestions []Suggestion) {
	activeCmd := ParseCommand(cmd)
	if len(activeCmd) <= 0 {
		return
	}
	rootToken := activeCmd[0]
	if !rootToken.complete {
		return
	}
	if spec, ok := specs.Specs[rootToken.token]; ok {
		log.Println(spec.Description)
	}
	return
}

func LoadSuggestions(cmd string) []Suggestion {
	if cmd == lastSuggestionCmd {
		return lastSuggestion
	}
	suggestions := loadSuggestions(cmd)
	lastSuggestionCmd, lastSuggestion = cmd, suggestions
	return suggestions
}
