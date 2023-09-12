package autocomplete

import (
	"sort"
	"strings"

	"github.com/cpendery/clac/autocomplete/model"
	"github.com/lithammer/fuzzysearch/fuzzy"
)

func fuzzyMatchSubcommands(input string, subcommands []model.Subcommand) []Suggestion {
	type match struct {
		name       string
		rank       int
		subcommand model.Subcommand
	}
	matchers := []match{}
	for _, sub := range subcommands {
		bestName := ""
		bestNameRank := -1
		for _, n := range sub.Name {
			rank := fuzzy.RankMatch(input, n)
			if rank > bestNameRank {
				bestName = n
				bestNameRank = rank
			}
		}
		if bestNameRank != -1 {
			matchers = append(matchers, match{
				name:       bestName,
				subcommand: sub,
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
			Description: m.subcommand.Description,
		})
	}
	return results
}

func prefixMatchSubcommands(input string, subcommands []model.Subcommand) []Suggestion {
	results := []Suggestion{}
	for _, sub := range subcommands {
		for _, n := range sub.Name {
			if strings.HasPrefix(n, input) {
				results = append(results, Suggestion{
					Name:        n,
					Description: sub.Description,
				})
				break
			}
		}
	}
	return results
}
