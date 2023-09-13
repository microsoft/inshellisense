package generators

import (
	"log/slog"
	"os"

	"github.com/cpendery/clac/autocomplete/model"
)

// * - filepaths: show folders and filepaths. Allow autoexecute on filepaths
// * - folders: show folders only. Allow autoexecute on folders
// * - history: show suggestions for all items in history matching this pattern
// * - help: show subcommands. Only includes the 'siblings' of the nearest 'parent' subcommand

const (
	directory = "Directory"
	file      = "File"
)

func walk(includeFiles bool) []model.TermSuggestion {
	wd, err := os.Getwd()
	if err != nil {
		slog.Error("unable to get working dir", slog.String("error", err.Error()))
		return []model.TermSuggestion{}
	}
	dirItems, err := os.ReadDir(wd)
	if err != nil {
		slog.Error("unable to read files from working dir", slog.String("error", err.Error()))
		return []model.TermSuggestion{}
	}
	suggestions := []model.TermSuggestion{}
	for _, dirItem := range dirItems {
		if !dirItem.IsDir() && !includeFiles {
			continue
		}
		description := file
		suggestionType := model.TermSuggestionTypeFile
		if dirItem.IsDir() {
			description = directory
			suggestionType = model.TermSuggestionTypeFolder
		}
		suggestions = append(suggestions, model.TermSuggestion{
			Name:        dirItem.Name(),
			Description: description,
			Type:        suggestionType,
		})
	}
	return suggestions
}

func Filepaths() []model.TermSuggestion {
	return walk(true)
}

func Folders() []model.TermSuggestion {
	return walk(false)
}

// TODO: implement history template
func History() []model.TermSuggestion {
	return []model.TermSuggestion{}
}

// TODO: implement help template
func Help() []model.TermSuggestion {
	return []model.TermSuggestion{}
}
