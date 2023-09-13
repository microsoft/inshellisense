package git

import (
	"github.com/cpendery/clac/autocomplete/generators"
	"github.com/cpendery/clac/autocomplete/model"
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
