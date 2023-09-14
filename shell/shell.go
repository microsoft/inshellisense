package shell

import (
	_ "embed"
	"fmt"
	"os"
	"path"

	"github.com/adrg/xdg"
)

var (
	SupportedShells = []string{"bash"}
)

const (
	clacHomeFolder = ".clac"
	bashrcFile     = ".bashrc"
)

//go:embed key-bindings.bash
var bashBindings []byte

func CreateBashBinding() error {
	if err := os.MkdirAll(path.Join(xdg.Home, clacHomeFolder), 0770); err != nil {
		return fmt.Errorf("unable to create .clac folder: %w", err)
	}

	f, err := os.Create(path.Join(xdg.Home, clacHomeFolder, "key-bindings.bash"))
	if err != nil {
		return fmt.Errorf("unable to create bash keybindings file: %w", err)
	}

	if _, err = f.Write(bashBindings); err != nil {
		return fmt.Errorf("unable to write to bash keybindings file: %w", err)
	}

	f, err = os.OpenFile(path.Join(xdg.Home, bashrcFile), os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
	if err != nil {
		return fmt.Errorf("unable to append to bashrc: %w", err)
	}

	bindingsPath := "~/.clac/key-bindings.bash"
	content := fmt.Sprintf("\n[ -f %s ] && source %s", bindingsPath, bindingsPath)
	if _, err := f.Write([]byte(content)); err != nil {
		return fmt.Errorf("unable to append to bashrc: %w", err)
	}

	return err
}
