# inshellisense

`inshellisense` provides IDE style autocomplete for shells. It's a terminal native runtime for [autocomplete](https://github.com/withfig/autocomplete) which has support for 600+ command line tools. `inshellisense` supports Windows, Linux, & MacOS.

<p align="center"><img alt="demo of inshellisense working" src="/docs/demo.gif" height="450px"/></p>

## Getting Started

### Requirements
- `node >= 16.x`

### Installation

```shell
npm install -g @microsoft/inshellisense
```

### Quickstart

After completing the installation, you can already run `inshellisense --shell <shell>` to start the autocomplete session for your desired shell. Additionally, you can bind `inshellisense` to a keybinding of `CTRL+a` by running the below command. This brings the added advantages of automatically starting the autocomplete session with your current shell and injecting any accepted command into your shell's history.

```shell
inshellisense bind
```

Additionally, inshellisense is also aliased under `is` after install for convenience.

## Integrations

inshellisense supports the following shells:

- [bash](https://www.gnu.org/software/bash/)
- [zsh](https://www.zsh.org/)
- [fish](https://github.com/fish-shell/fish-shell)
- [pwsh](https://github.com/PowerShell/PowerShell)
- [powershell](https://learn.microsoft.com/en-us/powershell/scripting/windows-powershell/starting-windows-powershell) (Windows Powershell)

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
