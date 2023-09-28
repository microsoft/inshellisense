// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

package autocomplete

import (
	"sort"
	"strings"

	"github.com/lithammer/fuzzysearch/fuzzy"
	"github.com/microsoft/clac/autocomplete/generators"
	"github.com/microsoft/clac/autocomplete/model"
)

type matchable interface {
	GetName() []string
	GetDescription() string
	GetType() model.TermSuggestionType
}

type match[M matchable] struct {
	name string
	rank int
	item M
}

func fuzzyMatch[M matchable](input string, targets []M) []match[M] {
	matchers := []match[M]{}
	for _, item := range targets {
		bestName := ""
		bestNameRank := -1
		for _, name := range item.GetName() {
			rank := fuzzy.RankMatch(input, name)
			if rank > bestNameRank {
				bestName = name
				bestNameRank = rank
			}
		}

		if bestNameRank != -1 {
			matchers = append(matchers, match[M]{
				name: bestName,
				item: item,
				rank: bestNameRank,
			})
		}
	}
	sort.Slice(matchers, func(i, j int) bool {
		return matchers[i].rank > matchers[j].rank
	})
	return matchers
}

func prefixMatch[M matchable](input string, targets []M) []match[M] {
	matches := []match[M]{}
	for _, targ := range targets {
		for _, name := range targ.GetName() {
			if strings.HasPrefix(name, input) {
				matches = append(matches, match[M]{
					name: name,
					item: targ,
				})
				break
			}
		}
	}
	return matches
}

func filterMatch[M matchable](items []M, suggestions *[]model.TermSuggestion, input *string, filterStrategy model.FilterStrategy) {
	if input == nil {
		for _, item := range items {
			*suggestions = append(*suggestions, model.TermSuggestion{
				Name:        getShortName(item.GetName()),
				Description: item.GetDescription(),
				Type:        item.GetType(),
			})
		}
	} else {
		var matches []match[M]
		switch filterStrategy {
		case model.FilterStrategyFuzzy:
			matches = fuzzyMatch[M](*input, items)
		case model.FilterStrategyEmpty, model.FilterStrategyPrefix:
			matches = prefixMatch[M](*input, items)
		}
		for _, match := range matches {
			*suggestions = append(*suggestions, model.TermSuggestion{
				Name:        match.name,
				Description: match.item.GetDescription(),
				Type:        match.item.GetType(),
			})
		}
	}
}

func getGeneratorDrivenRecommendations(g *model.Generator, suggestions *[]model.TermSuggestion, input *string, filterStrategy model.FilterStrategy, processedTokens []model.ProcessedToken) {
	if g == nil {
		return
	}
	termTokens := []string{}
	for _, t := range processedTokens {
		termTokens = append(termTokens, t.Token)
	}
	filterMatch[model.TermSuggestion](generators.Run(*g, termTokens), suggestions, input, filterStrategy)
}

func getTemplateDrivenRecommendations(templates []model.Template, suggestions *[]model.TermSuggestion, input *string, filterStrategy model.FilterStrategy) {
	filterMatch[model.TermSuggestion](generators.RunTemplates(templates), suggestions, input, filterStrategy)
}

func getSuggestionDrivenRecommendations(suggestionSet []model.Suggestion, suggestions *[]model.TermSuggestion, input *string, filterStrategy model.FilterStrategy) {
	filterMatch[model.Suggestion](suggestionSet, suggestions, input, filterStrategy)
}

func getSubcommandDrivenRecommendations(spec model.Subcommand, suggestions *[]model.TermSuggestion, input *string, filterStrategy model.FilterStrategy) {
	filterMatch[model.Subcommand](spec.Subcommands, suggestions, input, filterStrategy)
}

func getOptionDrivenRecommendations(options []model.Option, suggestions *[]model.TermSuggestion, processedTokens []model.ProcessedToken, input *string, filterStrategy model.FilterStrategy) {
	usedTokens := make(map[string]struct{})
	for _, processedToken := range processedTokens {
		usedTokens[processedToken.Token] = struct{}{}
	}
	validOptions := []model.Option{}
	for _, op := range options {
		hasBeenExcluded := false
		for _, exclusiveToken := range op.ExclusiveOn {
			if _, exclude := usedTokens[exclusiveToken]; exclude {
				hasBeenExcluded = true
			}
		}
		if hasBeenExcluded {
			continue
		}
		validOptions = append(validOptions, op)
	}
	filterMatch[model.Option](validOptions, suggestions, input, filterStrategy)
}

func removeDuplicateRecommendation(suggestions *[]model.TermSuggestion, processedTokens []model.ProcessedToken) {
	dupMap := make(map[string]struct{})
	for _, processedToken := range processedTokens {
		dupMap[processedToken.Token] = struct{}{}
	}
	for i := 0; i < len(*suggestions); i++ {
		if _, includes := dupMap[(*suggestions)[i].Name]; includes {
			*suggestions = append((*suggestions)[:i], (*suggestions)[i+1:]...)
			i--
		}
	}
}
