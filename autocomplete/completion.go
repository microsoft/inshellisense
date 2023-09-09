package autocomplete

import "strings"

type Suggestion struct {
	Name        string
	Description string
}

func LoadSuggestions(cmd string) []Suggestion {
	params := strings.Split(cmd, " ")
	lastParam := params[len(params)-1]
	if lastParam == "git" {
		return []Suggestion{{"go", "the only way to go"}, {"get", "the right way to get"}, {"gone", "here today, bye tomorrow"}}
	}
	return []Suggestion{}
}
