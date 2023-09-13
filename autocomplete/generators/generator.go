package generators

import (
	"log/slog"
	"os/exec"
	"strings"

	"github.com/cpendery/clac/autocomplete/model"
)

func Run(g model.Generator) []model.TermSuggestion {
	suggestions := []model.TermSuggestion{}
	if g.Script != "" {
		args := strings.Split(g.Script, " ")
		var cmd *exec.Cmd = nil
		if len(args) > 1 {
			cmd = exec.Command(args[0], args[1:]...)
		} else {
			cmd = exec.Command(args[0])
		}
		output, err := cmd.Output()
		if err != nil {
			slog.Error("failed to run script in generator", slog.String("script", g.Script), slog.String("error", err.Error()), slog.String("output", string(output)))
		} else if g.PostProcess != nil {
			suggestions = append(suggestions, g.PostProcess(string(output))...)
		} else {
			tokens := strings.Split(string(output), g.SplitOn)
			for _, token := range tokens {
				suggestions = append(suggestions, model.TermSuggestion{
					Name: token,
				})
			}
		}
	}

	if g.Function != nil {
		suggestions = append(suggestions, g.Function()...)
	}

	suggestions = append(suggestions, RunTemplates(g.Template)...)

	return suggestions
}
