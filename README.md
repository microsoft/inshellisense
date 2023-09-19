# clac

clac provides IDE style autocomplete aka `inshellisense` in every shell

<p align="center"><img alt="demo of clac working" src="https://github.com/cpendery/clac/assets/35637443/544f81dc-dada-40b5-bb1f-a736b4e58e73" height="300px"/></p>

clac is built on Fig's [autocomplete specs](https://github.com/withfig/autocomplete) which
provide support for 600+ command line tools.

## Supported Integrations

| Shells             | IDEs               |  OS      |
| ------------------ | ------------------ | -------- |
| zsh                | Visual Studio Code |  Mac     |
| bash               | JetBrains Suite    |  Windows |
| pwsh (Powershell)  | Android Studio     |  Linux   |
| Windows Powershell |                    |          |

## Getting Started

### Installation

#### MacOS, Linux, & Windows

```shell
go install github.com/cpendery/clac@latest
```

### Quickstart

After completing the installation, bind `clac` to the terminal you'd like to use
it with via the `clac bind [shell]` command. This will create a custom keybinding
for `CTRL+a` to trigger the autocomplete session & execution.

## Inspirations

- [syft](https://github.com/anchore/syft) & [grype](https://github.com/anchore/grype)
- [fig](https://github.com/withfig/autocomplete)
- [warp](https://www.warp.dev/)
- [fzf](https://github.com/junegunn/fzf)
- [bubbletea](https://github.com/charmbracelet/bubbletea)
