package model

type Subcommand struct {
	Name        interface{} //single or array string, required
	Description string
	Args        []Arg
	Options     []Option
	Subcommands []Subcommand
}

type Option struct {
	Name        interface{} //single or array string, required
	Args        interface{} //single or array Arg, optional
	Description string      //single, optional
}

type Arg struct {
	Name        string //single, optional
	Description string //single, optional
	Templates   []Template
}

type Template string

const (
	TemplateFilepaths Template = "filepaths"
	TemplateFolders   Template = "folders"
	TemplateHistory   Template = "history"
	TemplateHelp      Template = "help"
)

var (
	Templates = []Template{TemplateFilepaths, TemplateFolders, TemplateHistory}
)
