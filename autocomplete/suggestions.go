package autocomplete

import (
	"sort"
	"strings"

	"github.com/cpendery/clac/autocomplete/generators"
	"github.com/cpendery/clac/autocomplete/model"
	"github.com/lithammer/fuzzysearch/fuzzy"
)

type match struct {
	name string
	rank int
	item model.TermSuggestion
}

func fuzzyMatch(input string, targets []model.TermSuggestion, suggestions *[]model.TermSuggestion) {
	matchers := []match{}
	for _, item := range targets {
		rank := fuzzy.RankMatch(input, item.Name)
		if rank != -1 {
			matchers = append(matchers, match{
				name: item.Name,
				item: item,
				rank: rank,
			})
		}
	}
	sort.Slice(matchers, func(i, j int) bool {
		return matchers[i].rank > matchers[j].rank
	})
	for _, m := range matchers {
		*suggestions = append(*suggestions, model.TermSuggestion{
			Name:        m.name,
			Description: m.item.Description,
			Type:        m.item.Type,
		})
	}
}

func getFuzzyFilteredRecommendations(input string, suggestions *[]model.TermSuggestion) {
	results := []model.TermSuggestion{}
	fuzzyMatch(input, *suggestions, &results)
	*suggestions = results
}

func prefixMatch(input string, targets []model.TermSuggestion, suggestions *[]model.TermSuggestion) {
	for _, targ := range targets {
		if strings.HasPrefix(targ.Name, input) {
			*suggestions = append(*suggestions, model.TermSuggestion{
				Name:        targ.Name,
				Description: targ.Description,
				Type:        targ.Type,
			})
		}
	}
}

func getPrefixFilteredRecommendations(input string, suggestions *[]model.TermSuggestion) {
	results := []model.TermSuggestion{}
	prefixMatch(input, *suggestions, &results)
	*suggestions = results
}

func getGeneratorDrivenRecommendations(g *model.Generator, suggestions *[]model.TermSuggestion) {
	if g != nil {
		*suggestions = append(*suggestions, generators.Run(*g)...)
	}

}

func getTemplateDrivenRecommendations(templates []model.Template, suggestions *[]model.TermSuggestion) {
	*suggestions = append(*suggestions, generators.RunTemplates(templates)...)
}

func getSuggestionDrivenRecommendations(suggestionSet []model.Suggestion, suggestions *[]model.TermSuggestion) {
	for _, suggestion := range suggestionSet {
		*suggestions = append(*suggestions, model.TermSuggestion{
			Name:        getLongName(suggestion.Name),
			Description: suggestion.Description,
			Type:        model.TermSuggestionTypeDefault,
		})
	}
}

func getSubcommandDrivenRecommendations(spec model.Subcommand, suggestions *[]model.TermSuggestion) {
	for _, sub := range spec.Subcommands {
		*suggestions = append(*suggestions, model.TermSuggestion{
			Name:        getLongName(sub.Name),
			Description: sub.Description,
			Type:        model.TermSuggestionTypeSubcommand,
		})
	}
}

func getOptionDrivenRecommendations(options []model.Option, suggestions *[]model.TermSuggestion) {
	for _, op := range options {
		*suggestions = append(*suggestions, model.TermSuggestion{
			Name:        getShortName(op.Name),
			Description: op.Description,
			Type:        model.TermSuggestionTypeOption,
		})
	}
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
