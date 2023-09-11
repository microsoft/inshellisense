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

/*  <has a>   <no a>
cmd --flag arg --flag

thus load suggestions for the base command, which would be any template, suggestions, options, subcommand, or an arg

rules:
	if there is an arg, just show the description of that arg
	else, show suggestions, subcommand, template, options
	in that org
*/

/*
generally, we want to make a recommendation based on what we finish on, so that is what matters, we can tree down until we get there

subcommand
	if isOption -> option
	else
		if match subcommand -> subcommand
		else -> arg

	if _ -> recommend based self + rest

option
	if hasArgs
		if args optional
			if next is subcommand || option -> go there
		if args variadic ---> arg
		else -> arg

	if _ ->
		if args optional -> recommend on parent subcommand + rest + args
		else if has args -> recommend based on args
		else -> recommend based on parent subcommand + rest

arg
	<NEEDS_WORK>
	if _ -> recommend based on self
*/

func getLongName(names []string) string {
	longestName := ""
	for _, name := range names {
		if len(name) > len(longestName) {
			longestName = name
		}
	}
	return longestName
}

func getSubcommandDrivenRecommendation(spec model.Subcommand, persistentOptions []model.Option) []Suggestion {
	suggestions := []Suggestion{}
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
		return getSubcommandDrivenRecommendation(spec, persistentOptions)
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
	if !activeCmd[len(activeCmd)-1].complete {
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
