package autocomplete

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParseCommand(t *testing.T) {
	tests := []struct {
		cmd      string
		expected []commandToken
	}{
		{"cmd --flag value ", []commandToken{{"cmd", true, false}, {"--flag", true, true}, {"value", true, false}}},
		{"cmd --flag 'value' ", []commandToken{{"cmd", true, false}, {"--flag", true, true}, {"'value'", true, false}}},
		{"cmd --flag=value ", []commandToken{{"cmd", true, false}, {"--flag", true, true}, {"value", true, false}}},
		{"cmd --flag='value' ", []commandToken{{"cmd", true, false}, {"--flag", true, true}, {"'value'", true, false}}},
		{"cmd 'value' ", []commandToken{{"cmd", true, false}, {"'value'", true, false}}},
		{"cmd value ", []commandToken{{"cmd", true, false}, {"value", true, false}}},
		{"cmd -f", []commandToken{{"cmd", true, false}, {"-f", false, false}}},
		{"cmd -f=value ", []commandToken{{"cmd", true, false}, {"-f", true, true}, {"value", true, false}}},
		{"cmd -f value ", []commandToken{{"cmd", true, false}, {"-f", true, true}, {"value", true, false}}},
		{"cmd -f 'value' ", []commandToken{{"cmd", true, false}, {"-f", true, true}, {"'value'", true, false}}},
		{"cmd -f='value' ", []commandToken{{"cmd", true, false}, {"-f", true, true}, {"'value'", true, false}}},
		{"cmd -f='val", []commandToken{{"cmd", true, false}, {"-f", true, true}, {"'val", false, false}}},
		{"cmd -f", []commandToken{{"cmd", true, false}, {"-f", false, false}}},
		{"cmd -f=", []commandToken{{"cmd", true, false}, {"-f", true, true}}},
		{"cmd -f ", []commandToken{{"cmd", true, false}, {"-f", true, true}}},
		{"cmd", []commandToken{{"cmd", false, false}}},
		{"cmd ", []commandToken{{"cmd", true, false}}},
	}

	for _, test := range tests {
		t.Run(test.cmd, func(tc *testing.T) {
			result := ParseCommand(test.cmd)
			assert.Equal(tc, test.expected, result)
		})

	}
}
