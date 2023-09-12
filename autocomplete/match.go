package autocomplete

import (
	"sort"
	"strings"

	"github.com/cpendery/clac/autocomplete/model"
	"github.com/lithammer/fuzzysearch/fuzzy"
)

type matchable interface {
	GetName() []string
	GetDescription() string
}

func fuzzyMatch[M matchable](input string, targets []M) []Suggestion {
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
	results := []Suggestion{}
	for _, m := range matchers {
		results = append(results, Suggestion{
			Name:        m.name,
			Description: m.item.GetDescription(),
		})
	}
	return results
}

func fuzzyMatchSubcommands(input string, subcommands []model.Subcommand) []Suggestion {
	return fuzzyMatch[model.Subcommand](input, subcommands)
}

func fuzzyMatchOptions(input string, options []model.Option) []Suggestion {
	return fuzzyMatch[model.Option](input, options)
}

func prefixMatch[M matchable](input string, subcommands []M) []Suggestion {
	results := []Suggestion{}
	for _, sub := range subcommands {
		for _, n := range sub.GetName() {
			if strings.HasPrefix(n, input) {
				results = append(results, Suggestion{
					Name:        n,
					Description: sub.GetDescription(),
				})
				break
			}
		}
	}
	return results
}

func prefixMatchSubcommands(input string, subcommands []model.Subcommand) []Suggestion {
	return prefixMatch[model.Subcommand](input, subcommands)
}

func prefixMatchOptions(input string, options []model.Option) []Suggestion {
	return prefixMatch[model.Option](input, options)
}
