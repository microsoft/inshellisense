# inshellisense

`inshellisense` provides IDE style autocomplete for shells. It's a terminal native runtime for [autocomplete](https://github.com/withfig/autocomplete) which has support for 600+ command line tools. `inshellisense` supports Windows, Linux, & macOS.

<p align="center"><img alt="demo of inshellisense working" src="/docs/demo.gif"/></p>

## Getting Started

### Requirements

- Node.js 20.X, 18.X, 16.X (16.6.0 >=)

### Installation

```shell
npm install -g @microsoft/inshellisense
```

### Quickstart

After completing the installation, you can run `is` to start the autocomplete session for your desired shell. Additionally, inshellisense is also aliased under `inshellisense` after installation.

### Usage

| Action                                | Command | Description                                      |
| ------------------------------------- | ------- | ------------------------------------------------ |
| Start                                 | `is`    | Start inshellisense session on the current shell |
| Stop                                  | `exit`  | Stop inshellisense session on the current shell  |
| Check If Inside Inshellisense Session | `is -c` | Check if shell inside inshellisense session      |

#### Keybindings

All other keys are passed through to the shell. The keybindings below are only captured when the inshellisense suggestions are visible, otherwise they are passed through to the shell as well. These can be customized in the [config](#configuration).

| Action                    | Keybinding     |
| ------------------------- | -------------- |
| Accept Current Suggestion | <kbd>tab</kbd> |
| View Next Suggestion      | <kbd>↓</kbd>   |
| View Previous Suggestion  | <kbd>↑</kbd>   |
| Dismiss Suggestions       | <kbd>esc</kbd> |

## Integrations

inshellisense supports the following shells:

- [bash](https://www.gnu.org/software/bash/)
- [zsh](https://www.zsh.org/)
- [fish](https://github.com/fish-shell/fish-shell)
- [pwsh](https://github.com/PowerShell/PowerShell)
- [powershell](https://learn.microsoft.com/en-us/powershell/scripting/windows-powershell/starting-windows-powershell) (Windows Powershell)
- [cmd](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/cmd) _(experimental)_
- [xonsh](https://xon.sh/)
- [nushell](https://www.nushell.sh/)

## Configuration

All configuration is done through a [toml](https://toml.io/) file located at `~/.inshellisenserc`. The [JSON schema](https://json-schema.org/) for the configuration file can be found [here](https://github.com/microsoft/inshellisense/blob/main/src/utils/config.ts).

### Keybindings

You can customize the keybindings for inshellisense by adding a `bindings` section to your config file. The following is the default configuration for the [keybindings](#keybindings):

```toml
[bindings.acceptSuggestion]
key = "tab"
# shift and tab are optional and default to false
shift = false
ctrl = false

[bindings.nextSuggestion]
key = "down"

[bindings.previousSuggestion]
key = "up"

[bindings.dismissSuggestions]
key = "escape"
```

Key names are matched against the Node.js [keypress](https://nodejs.org/api/readline.html#readlineemitkeypresseventsstream-interface) events.

### Custom Prompts (Windows)

If you are using a custom prompt in your shell (anything that is not the default PS1), you will need to set up a custom prompt in the inshellisense config file. This is because Windows strips details from your prompt which are required for inshellisense to work. To do this, update your config file in your home directory and add the following configuration:

```toml
[[prompt.bash]]
regex = "(?<prompt>^>\\s*)" # the prompt match group will be used to detect the prompt
postfix = ">" # the postfix is the last expected character in your prompt
```

This example adds custom prompt detection for bash where the prompt is expected to be only `> `. You can add similar configurations for other shells as well as well as multiple configurations for each shell.

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
