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
	cmdDelimiter = regexp.MustCompile(`(\|\|)|(&&)|(;)`)
)

func LoadSuggestions(cmd string) []Suggestion {
	activeCmd := ParseCommand(cmd)
	if len(activeCmd) <= 0 {
		return []Suggestion{}
	}
	log.Println(activeCmd, activeCmd[0].token)
	if spec, ok := specs.Specs[activeCmd[0].token]; ok {
		log.Println(spec.Description)
	}
	return []Suggestion{}
}
