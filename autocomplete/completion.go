package autocomplete

import "strings"

func LoadSuggestions(cmd string) []string {
	params := strings.Split(cmd, " ")
	lastParam := params[len(params)-1]
	if lastParam == "git" {
		return []string{"go", "get"}
	}
	return []string{}
}
