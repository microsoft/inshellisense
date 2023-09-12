package model

type Subcommand struct {
	Name           []string //single or array string, required
	Description    string
	Args           []Arg
	Options        []Option
	Subcommands    []Subcommand
	FilterStrategy FilterStrategy
}

func (s Subcommand) GetName() []string {
	return s.Name
}

func (s Subcommand) GetDescription() string {
	return s.Description
}

type Option struct {
	Name         []string //single or array string, required
	Args         []Arg    //single or array Arg, optional
	Description  string   //single, optional
	IsPersistent bool
	ExclusiveOn  []string
}

func (o Option) GetName() []string {
	return o.Name
}

func (o Option) GetDescription() string {
	return o.Description
}

type Arg struct {
	Name           string //single, optional
	Description    string //single, optional
	Templates      []Template
	Suggestions    []Suggestion
	FilterStrategy FilterStrategy
	Generator      *Generator
	IsVariadic     bool
	IsOptional     bool
	IsCommand      bool
}

type Suggestion struct {
	Name        []string
	Description string
}

type Generator struct {
	Script      string
	Function    func() string
	PostProcess func(string) []Suggestion
	Template    []Template
}

type Template string

const (
	TemplateFilepaths Template = "filepaths"
	TemplateFolders   Template = "folders"
	TemplateHistory   Template = "history"
	TemplateHelp      Template = "help"
)

type FilterStrategy string

const (
	FilterStrategyPrefix FilterStrategy = "prefix"
	FilterStrategyFuzzy  FilterStrategy = "fuzzy"
	FilterStrategyEmpty  FilterStrategy = ""
)

var (
	Templates = []Template{TemplateFilepaths, TemplateFolders, TemplateHistory}
)
