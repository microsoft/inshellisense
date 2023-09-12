package autocomplete

import (
	"log/slog"
	"regexp"

	"github.com/cpendery/clac/autocomplete/model"
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

func getSubcommandDrivenRecommendation(spec model.Subcommand, persistentOptions []model.Option, partialCmd *commandToken) []Suggestion {
	suggestions := []Suggestion{}
	if partialCmd != nil {
		switch spec.FilterStrategy {
		case model.FilterStrategyFuzzy:
			return fuzzyMatchSubcommands(partialCmd.token, spec.Subcommands)
		case model.FilterStrategyPrefix, model.FilterStrategyEmpty:
			return prefixMatchSubcommands(partialCmd.token, spec.Subcommands)
		}
	}

	for _, sub := range spec.Subcommands {
		suggestions = append(suggestions, Suggestion{
			Name:        getLongName(sub.Name),
			Description: sub.Description,
		})
	}
	for _, op := range append(spec.Options, persistentOptions...) {
		suggestions = append(suggestions, Suggestion{
			Name:        getLongName(op.Name),
			Description: op.Description,
		})
	}
	return suggestions
}

func getArgDrivenRecommendation(args []model.Arg, spec model.Subcommand, persistentOptions []model.Option) []Suggestion {
	return []Suggestion{}
}

func handleSubcommand(tokens []commandToken, spec model.Subcommand, persistentOptions []model.Option) (suggestions []Suggestion) {
	if len(tokens) == 0 {
		return getSubcommandDrivenRecommendation(spec, persistentOptions, nil)
	} else if !tokens[0].complete {
		return getSubcommandDrivenRecommendation(spec, persistentOptions, &tokens[0])
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
		return handleSubcommand(tokens[1:], *subcommand, persistentOptions)
	}

	return handleArg(tokens, spec.Args, spec, persistentOptions)
}

func handleOption(tokens []commandToken, option model.Option, spec model.Subcommand, persistentOptions []model.Option) (suggestions []Suggestion) {
	if len(tokens) == 0 {
		slog.Error("invalid state reached, option with no tokens")
		return
	}
	if len(option.Args) == 0 {
		return handleSubcommand(tokens[1:], spec, persistentOptions)
	}
	return handleArg(tokens[1:], option.Args, spec, persistentOptions)
}

func handleArg(tokens []commandToken, args []model.Arg, spec model.Subcommand, persistentOptions []model.Option) (suggestions []Suggestion) {
	if len(tokens) == 0 {
		return getArgDrivenRecommendation(args, spec, persistentOptions)
	} else if !tokens[0].complete {
		return getArgDrivenRecommendation(args, spec, persistentOptions)
	} else if len(args) == 0 {
		return handleSubcommand(tokens, spec, persistentOptions)
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
			return handleSubcommand(tokens[1:], *subcommand, persistentOptions)
		}
	}

	activeArg := args[0]
	if activeArg.IsVariadic {
		return []Suggestion{{Name: activeArg.Name}}
	} else if activeArg.IsCommand {
		if len(tokens) <= 1 {
			return
		}
		activeCmd = tokens[1]
		if subcommand := getSubcommand(activeCmd.token, spec); subcommand != nil {
			return handleSubcommand(tokens[2:], *subcommand, persistentOptions)
		}
		return
	}
	return handleArg(tokens[1:], args[1:], spec, persistentOptions)
}

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
		return handleSubcommand(activeCmd[1:], spec, []model.Option{})
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
