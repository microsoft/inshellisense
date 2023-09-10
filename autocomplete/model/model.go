package model

type Subcommand struct {
	Name        interface{} //single or array string, required
	Description string
	Args        interface{} //single or array Arg, optional
	Options     []Option
}

type Option struct {
	Name        interface{} //single or array string, required
	Args        interface{} //single or array Arg, optional
	Description string      //single, optional
}

type Arg struct {
	Name        string   //single, optional
	Description string   //single, optional
	Template    Template //single, optional
}

type Template string

const (
	TemplateFilepaths Template = "filepaths"
	TemplateFolders   Template = "folders"
	TemplateHistory   Template = "history"
)

var (
	Templates = []Template{TemplateFilepaths, TemplateFolders, TemplateHistory}
)
