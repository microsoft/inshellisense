package autocomplete

import (
	"log"
	"log/slog"
	"regexp"

	"github.com/cpendery/clac/autocomplete/model"
	"github.com/cpendery/clac/autocomplete/specs"
)

var (
	cmdDelimiter      = regexp.MustCompile(`(\|\|)|(&&)|(;)`)
	lastSuggestionCmd = ""
	lastSuggestion    = []Suggestion{}
	lastCmdRunes      = 0
)

type Suggestion struct {
	Name        string
	Description string
}

func getOption(token string, options []model.Option) *model.Option {
	for _, option := range options {
		for _, optionName := range option.Name {
			if token == optionName {
				return &option
			}
		}
	}
	return nil
}

func getSubcommand(token string, spec model.Subcommand) *model.Subcommand {
	for _, subcommand := range spec.Subcommands {
		for _, subcommandName := range subcommand.Name {
			if token == subcommandName {
				return &subcommand
			}
		}
	}
	return nil
}

func argsAreOptional(args []model.Arg) bool {
	allOptional := true
	for _, arg := range args {
		allOptional = allOptional && arg.IsOptional
	}
	return allOptional
}

func getLongName(names []string) string {
	longestName := ""
	for _, name := range names {
		if len(name) > len(longestName) {
			longestName = name
		}
	}
	return longestName
}

func getShortName(names []string) string {
	if len(names) == 0 {
		return ""
	}
	shortestName := names[0]
	for _, name := range names {
		if len(name) < len(shortestName) {
			shortestName = name
		}
	}
	return shortestName
}

func getSubcommandDrivenRecommendation(spec model.Subcommand, persistentOptions []model.Option, partialCmd *commandToken, onlyRecommendSubcommands bool) []model.TermSuggestion {
	log.Println("sub rec")
	suggestions := []model.TermSuggestion{}
	allOptions := append(spec.Options, persistentOptions...)

	if onlyRecommendSubcommands {
		getSubcommandDrivenRecommendations(spec, &suggestions)
	} else {
		if len(spec.Args) != 0 {
			activeArg := spec.Args[0]
			getSuggestionDrivenRecommendations(activeArg.Suggestions, &suggestions)
			getTemplateDrivenRecommendations(activeArg.Templates, &suggestions)
		}
		getSubcommandDrivenRecommendations(spec, &suggestions)
		getOptionDrivenRecommendations(allOptions, &suggestions)
	}

	if partialCmd != nil {
		switch spec.FilterStrategy {
		case model.FilterStrategyFuzzy:
			getFuzzyFilteredRecommendations(partialCmd.token, &suggestions)
		case model.FilterStrategyPrefix, model.FilterStrategyEmpty:
			getPrefixFilteredRecommendations(partialCmd.token, &suggestions)
		}
	}

	return suggestions
}

func getArgDrivenRecommendation(args []model.Arg, spec model.Subcommand, persistentOptions []model.Option, partialCmd *commandToken) []model.TermSuggestion {
	log.Println("arg rec")
	suggestions := []model.TermSuggestion{}
	activeArg := args[0]
	allOptions := append(spec.Options, persistentOptions...)

	getSuggestionDrivenRecommendations(activeArg.Suggestions, &suggestions)
	getTemplateDrivenRecommendations(activeArg.Templates, &suggestions)

	if activeArg.IsOptional {
		getSubcommandDrivenRecommendations(spec, &suggestions)
		getOptionDrivenRecommendations(allOptions, &suggestions)
	}

	if partialCmd != nil {
		switch spec.FilterStrategy {
		case model.FilterStrategyFuzzy:
			getFuzzyFilteredRecommendations(partialCmd.token, &suggestions)
		case model.FilterStrategyPrefix, model.FilterStrategyEmpty:
			getPrefixFilteredRecommendations(partialCmd.token, &suggestions)
		}
	}

	return suggestions
}

func handleSubcommand(tokens []commandToken, spec model.Subcommand, persistentOptions []model.Option, argsDepleted bool) (suggestions []model.TermSuggestion) {
	if len(tokens) == 0 {
		return getSubcommandDrivenRecommendation(spec, persistentOptions, nil, argsDepleted)
	} else if !tokens[0].complete {
		return getSubcommandDrivenRecommendation(spec, persistentOptions, &tokens[0], argsDepleted)
	}
	for _, option := range spec.Options {
		if option.IsPersistent {
			persistentOptions = append(persistentOptions, option)
		}
	}
	activeCmd := tokens[0]
	if activeCmd.isOption {
		if option := getOption(activeCmd.token, append(spec.Options, persistentOptions...)); option != nil {
			return handleOption(tokens, *option, spec, persistentOptions)
		}
		return
	}
	if subcommand := getSubcommand(activeCmd.token, spec); subcommand != nil {
		return handleSubcommand(tokens[1:], *subcommand, persistentOptions, false)
	}

	return handleArg(tokens, spec.Args, spec, persistentOptions)
}

func handleOption(tokens []commandToken, option model.Option, spec model.Subcommand, persistentOptions []model.Option) (suggestions []model.TermSuggestion) {
	if len(tokens) == 0 {
		slog.Error("invalid state reached, option with no tokens")
		return
	}
	if len(option.Args) == 0 {
		return handleSubcommand(tokens[1:], spec, persistentOptions, false)
	}
	return handleArg(tokens[1:], option.Args, spec, persistentOptions)
}

func handleArg(tokens []commandToken, args []model.Arg, spec model.Subcommand, persistentOptions []model.Option) (suggestions []model.TermSuggestion) {
	if len(args) == 0 {
		return handleSubcommand(tokens, spec, persistentOptions, true)
	} else if len(tokens) == 0 {
		return getArgDrivenRecommendation(args, spec, persistentOptions, nil)
	} else if !tokens[0].complete {
		return getArgDrivenRecommendation(args, spec, persistentOptions, &tokens[0])
	}

	activeCmd := tokens[0]
	if argsAreOptional(args) {
		if activeCmd.isOption {
			if option := getOption(activeCmd.token, append(spec.Options, persistentOptions...)); option != nil {
				return handleOption(tokens, *option, spec, persistentOptions)
			}
			return
		}
		subcommand := getSubcommand(activeCmd.token, spec)
		if subcommand != nil {
			return handleSubcommand(tokens[1:], *subcommand, persistentOptions, false)
		}
	}

	activeArg := args[0]
	if activeArg.IsVariadic {
		return handleArg(tokens[1:], args, spec, persistentOptions)
	} else if activeArg.IsCommand {
		if len(tokens) <= 1 {
			return
		}
		activeCmd = tokens[1]
		if subcommand := getSubcommand(activeCmd.token, spec); subcommand != nil {
			return handleSubcommand(tokens[2:], *subcommand, persistentOptions, false)
		}
		return
	}
	return handleArg(tokens[1:], args[1:], spec, persistentOptions)
}

func loadSuggestions(cmd string) (suggestions []model.TermSuggestion, charsInLastCmd int) {
	activeCmd := ParseCommand(cmd)
	if len(activeCmd) <= 0 {
		return
	}
	rootToken := activeCmd[0]
	if !rootToken.complete {
		return
	}
	lastCmd := activeCmd[len(activeCmd)-1]
	charsInLastCmd = len(lastCmd.token)
	if lastCmd.complete {
		charsInLastCmd = 0
	}
	if spec, ok := specs.Specs[rootToken.token]; ok {
		return handleSubcommand(activeCmd[1:], spec, []model.Option{}, false), charsInLastCmd
	}
	return
}

func LoadSuggestions(cmd string) ([]Suggestion, int) {
	if cmd == lastSuggestionCmd {
		return lastSuggestion, lastCmdRunes
	}
	termSuggestions, lastRunes := loadSuggestions(cmd)
	suggestions := []Suggestion{}
	for _, suggestion := range termSuggestions {
		suggestions = append(suggestions, Suggestion{Name: suggestion.Name, Description: suggestion.Description})
	}
	lastSuggestionCmd, lastSuggestion, lastCmdRunes = cmd, suggestions, lastRunes
	return suggestions, lastRunes
}
