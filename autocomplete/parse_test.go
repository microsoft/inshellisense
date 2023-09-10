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
		{"cmd --flag value ", []commandToken{{"cmd", true}, {"--flag", true}, {"value", true}}},
		{"cmd --flag 'value' ", []commandToken{{"cmd", true}, {"--flag", true}, {"'value'", true}}},
		{"cmd --flag=value ", []commandToken{{"cmd", true}, {"--flag", true}, {"value", true}}},
		{"cmd --flag='value' ", []commandToken{{"cmd", true}, {"--flag", true}, {"'value'", true}}},
		{"cmd 'value' ", []commandToken{{"cmd", true}, {"'value'", true}}},
		{"cmd value ", []commandToken{{"cmd", true}, {"value", true}}},
		{"cmd -f", []commandToken{{"cmd", true}, {"-f", false}}},
		{"cmd -f=value ", []commandToken{{"cmd", true}, {"-f", true}, {"value", true}}},
		{"cmd -f value ", []commandToken{{"cmd", true}, {"-f", true}, {"value", true}}},
		{"cmd -f 'value' ", []commandToken{{"cmd", true}, {"-f", true}, {"'value'", true}}},
		{"cmd -f='value' ", []commandToken{{"cmd", true}, {"-f", true}, {"'value'", true}}},
		{"cmd -f='val", []commandToken{{"cmd", true}, {"-f", true}, {"'val", false}}},
		{"cmd -f", []commandToken{{"cmd", true}, {"-f", false}}},
		{"cmd -f=", []commandToken{{"cmd", true}, {"-f", true}}},
		{"cmd -f ", []commandToken{{"cmd", true}, {"-f", true}}},
		{"cmd", []commandToken{{"cmd", false}}},
		{"cmd ", []commandToken{{"cmd", true}}},
	}

	for _, test := range tests {
		t.Run(test.cmd, func(tc *testing.T) {
			result := ParseCommand(test.cmd)
			assert.Equal(tc, test.expected, result)
		})

	}
}
