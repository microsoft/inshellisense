package autocomplete

import (
	"testing"

	"github.com/bradleyjkemp/cupaloy"
	"github.com/stretchr/testify/assert"
)

func TestLoadSuggestions(t *testing.T) {
	tests := []struct {
		Name string
		Cmd  string
		Skip bool
	}{
		{Name: "partialPrefixFilter", Cmd: "git sta"},
		{Name: "completePrefixFilter", Cmd: "git stat"},
		{Name: "emptySuggestions", Cmd: "git to"},
		{Name: "alreadyUsedSuggestion", Cmd: "cd ~ "},
		{Name: "alreadyUsedOption", Cmd: "act --bind --b"},
		{Name: "exclusiveOnOption", Cmd: "ag --affinity --no"},
		{Name: "providedSuggestion", Cmd: "bw completion --shell "},
		{Name: "fullyTypedSuggestion", Cmd: "ls -W"},
		{Name: "noOptionsSuggestedAfterVariadicArg", Cmd: "ls item -"},
		{Name: "providedArgDescription", Cmd: "act completion bash -a "},
		{Name: "completedOptionWithArg", Cmd: "act completion bash -a 'actor' "},
		{Name: "command", Cmd: "sudo git sta", Skip: true}, // TODO: fix skipped test
	}
	for _, test := range tests {
		test := test
		t.Run(test.Name, func(tc *testing.T) {
			tc.Parallel()

			if test.Skip {
				tc.SkipNow()
			}
			suggestions, argDescription, _ := LoadSuggestions(test.Cmd)
			cleanSuggestions := []string{}
			for _, suggestion := range suggestions {
				cleanSuggestions = append(cleanSuggestions, suggestion.Name)
			}
			assert.NoError(tc, cupaloy.SnapshotMulti(test.Name+"-"+"suggestions", cleanSuggestions))
			if argDescription != "" {
				assert.NoError(tc, cupaloy.SnapshotMulti(test.Name+"-"+"argumentDescription", argDescription))
			}
		})
	}
}
