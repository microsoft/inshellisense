package autocomplete

import (
	"regexp"
	"strings"
	"unicode"
)

var (
	quoteRegex = regexp.MustCompile(`['"]`)
)

type commandToken struct {
	token    string
	complete bool
	isOption bool
}

func ParseCommand(cmd string) []commandToken {
	commands := cmdDelimiter.Split(cmd, -1)
	command := commands[len(commands)-1]
	cleanCommand := strings.TrimLeftFunc(command, unicode.IsSpace)
	return parse([]rune(cleanCommand))
}

func parse(cmd []rune) []commandToken {
	results := []commandToken{}
	readingQuotedStr := false
	readingFlag := false
	readingCmd := false
	readingIdx := 0
	var reading bool

	for idx, r := range cmd {
		reading = readingQuotedStr || readingFlag || readingCmd
		if !reading && quoteRegex.MatchString(string(r)) {
			readingQuotedStr, readingIdx = true, idx
			continue
		} else if !reading && r == '-' {
			readingFlag, readingIdx = true, idx
			continue
		} else if !reading && !unicode.IsSpace(r) {
			readingCmd, readingIdx = true, idx
			continue
		}
		if readingQuotedStr && quoteRegex.MatchString(string(r)) {
			readingQuotedStr = false
			complete := idx+1 < len(cmd) && unicode.IsSpace(cmd[idx+1])
			results = append(results, commandToken{complete: complete, token: string(cmd[readingIdx : idx+1])})
		} else if readingFlag && (unicode.IsSpace(r) || r == '=') {
			readingFlag = false
			results = append(results, commandToken{complete: true, token: string(cmd[readingIdx:idx]), isOption: true})
		} else if readingCmd && unicode.IsSpace(r) {
			readingCmd = false
			results = append(results, commandToken{complete: true, token: string(cmd[readingIdx:idx])})
		}
	}
	reading = readingQuotedStr || readingFlag || readingCmd
	if reading {
		results = append(results, commandToken{complete: false, token: string(cmd[readingIdx:])})
	}
	return results
}
