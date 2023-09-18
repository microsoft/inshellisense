# clac

clac provides IDE style autocomplete aka `inshellisense` in every shell

https://github.com/cpendery/clac/assets/35637443/031599a2-5240-4b57-bcb1-a10ca8152b30

clac is built on Fig's [autocomplete specs](https://github.com/withfig/autocomplete) which
provide support for 600+ command line tools.

## Supported Integrations

| Shells             | IDEs               | Terminals       | OS      |
| ------------------ | ------------------ | --------------- | ------- |
| zsh                | Visual Studio Code | Terminal        | Mac     |
| bash               | JetBrains Suite    | iTerm/iTerm2    | Windows |
| pwsh (Powershell)  | Android Studio     | Hyper           | Linux   |
| Windows Powershell |                    | Xterm.js & More |

## Getting Started

### Installation

#### MacOS & Linux

```shell
go install github.com/cpendery/clac@latest
```

#### Windows

```shell
choco install clac
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
