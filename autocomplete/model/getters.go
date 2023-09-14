package model

func (t TermSuggestion) GetName() []string {
	return []string{t.Name}
}

func (t TermSuggestion) GetDescription() string {
	return t.Description
}

func (t TermSuggestion) GetType() TermSuggestionType {
	return t.Type
}

func (o Option) GetName() []string {
	return o.Name
}

func (o Option) GetDescription() string {
	return o.Description
}

func (o Option) GetType() TermSuggestionType {
	return TermSuggestionTypeOption
}

func (s Suggestion) GetName() []string {
	return s.Name
}

func (s Suggestion) GetDescription() string {
	return s.Description
}

func (s Suggestion) GetType() TermSuggestionType {
	return TermSuggestionTypeDefault
}

func (s Subcommand) GetName() []string {
	return s.Name
}

func (s Subcommand) GetDescription() string {
	return s.Description
}

func (s Subcommand) GetType() TermSuggestionType {
	return TermSuggestionTypeSubcommand
}
