package autocomplete

import (
	"slices"
	"sort"
	"strings"

	"github.com/cpendery/clac/autocomplete/generators"
	"github.com/cpendery/clac/autocomplete/model"
	"github.com/lithammer/fuzzysearch/fuzzy"
)

type matchable interface {
	GetName() []string
	GetDescription() string
}

func fuzzyMatch[M matchable](input string, targets []M, suggestions *[]model.TermSuggestion) {
	type match struct {
		name string
		rank int
		item M
	}
	matchers := []match{}
	for _, item := range targets {
		bestName := ""
		bestNameRank := -1
		for _, n := range item.GetName() {
			rank := fuzzy.RankMatch(input, n)
			if rank > bestNameRank {
				bestName = n
				bestNameRank = rank
			}
		}
		if bestNameRank != -1 {
			matchers = append(matchers, match{
				name: bestName,
				item: item,
				rank: bestNameRank,
			})
		}
	}
	sort.Slice(matchers, func(i, j int) bool {
		return matchers[i].rank > matchers[j].rank
	})
	for _, m := range matchers {
		*suggestions = append(*suggestions, model.TermSuggestion{
			Name:        m.name,
			Description: m.item.GetDescription(),
		})
	}
}

func getFuzzyFilteredRecommendations(input string, suggestions *[]model.TermSuggestion) {
	results := []model.TermSuggestion{}
	fuzzyMatch[model.TermSuggestion](input, *suggestions, &results)
	*suggestions = results
}

func prefixMatch[M matchable](input string, subcommands []M, suggestions *[]model.TermSuggestion) {
	for _, sub := range subcommands {
		for _, n := range sub.GetName() {
			if strings.HasPrefix(n, input) {
				*suggestions = append(*suggestions, model.TermSuggestion{
					Name:        n,
					Description: sub.GetDescription(),
				})
				break
			}
		}
	}
}

func getPrefixFilteredRecommendations(input string, suggestions *[]model.TermSuggestion) {
	results := []model.TermSuggestion{}
	prefixMatch[model.TermSuggestion](input, *suggestions, &results)
	*suggestions = results
}

func getTemplateDrivenRecommendations(templates []model.Template, suggestions *[]model.TermSuggestion) {
	for _, template := range templates {
		switch template {
		case model.TemplateFilepaths:
			*suggestions = append(*suggestions, generators.Filepaths()...)
		case model.TemplateFolders:
			if slices.Contains(templates, model.TemplateFilepaths) {
				continue
			}
			*suggestions = append(*suggestions, generators.Folders()...)
		case model.TemplateHelp:
			*suggestions = append(*suggestions, generators.Help()...)
		case model.TemplateHistory:
			*suggestions = append(*suggestions, generators.History()...)
		}
	}
}

func getSuggestionDrivenRecommendations(suggestionSet []model.Suggestion, suggestions *[]model.TermSuggestion) {
	for _, suggestion := range suggestionSet {
		*suggestions = append(*suggestions, model.TermSuggestion{
			Name:        getLongName(suggestion.Name),
			Description: suggestion.Description,
		})
	}
}

func getSubcommandDrivenRecommendations(spec model.Subcommand, suggestions *[]model.TermSuggestion) {
	for _, sub := range spec.Subcommands {
		*suggestions = append(*suggestions, model.TermSuggestion{
			Name:        getLongName(sub.Name),
			Description: sub.Description,
		})
	}
}

func getOptionDrivenRecommendations(options []model.Option, suggestions *[]model.TermSuggestion) {
	for _, op := range options {
		*suggestions = append(*suggestions, model.TermSuggestion{
			Name:        getShortName(op.Name),
			Description: op.Description,
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
