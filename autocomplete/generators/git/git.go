package git

import (
	"strings"

	"github.com/cpendery/clac/autocomplete/generators"
	"github.com/cpendery/clac/autocomplete/model"
	"github.com/google/uuid"
)

func CommitMessageGenerator() *model.Generator {
	return generators.AI(
		"git commit -m",
		func(executeShellCommand func(string) string) string {
			gitLogShortMessages := executeShellCommand(
				"git log --pretty=format:%s --abbrev-commit --max-count=20",
			)

			return "Generate a git commit message summary based on this git diff, the \"summary\" must be no more " +
				"than 70-75 characters, and it must describe what the patch changes" +
				"\n\nHere are some examples from the repo:\n" + gitLogShortMessages
		},
		func(executeShellCommand func(string) string) string {
			return executeShellCommand("git diff --staged")
		},
		"\n",
	)
}

func AddFileGenerator() *model.Generator {
	return &model.Generator{
		Id:     uuid.New(),
		Script: "git --no-optional-locks status --short",
		PostProcess: func(s string) []model.TermSuggestion {
			suggestions := []model.TermSuggestion{}
			lines := strings.Split(s, "\n")
			for _, line := range lines {
				baseRune := strings.IndexRune(line, 0)
				if baseRune == 'M' || baseRune == 'A' {
					continue
				}
				splits := strings.Split(line, " ")
				if len(splits) <= 1 {
					continue
				}
				filename := splits[len(splits)-1]
				suggestions = append(suggestions, model.TermSuggestion{
					Name:        filename,
					Description: "Unstaged/Untracked File",
				})
			}
			return suggestions
		},
	}
}
