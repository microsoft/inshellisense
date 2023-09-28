# clac

clac provides IDE style autocomplete aka `inshellisense` in every shell

<p align="center"><img alt="demo of clac working" src="https://github.com/microsoft/clac/assets/35637443/544f81dc-dada-40b5-bb1f-a736b4e58e73" height="300px"/></p>

clac is built on Fig's [autocomplete specs](https://github.com/withfig/autocomplete) which
provide support for 600+ command line tools.

## Supported Integrations

| Shells             | IDEs               | OS      |
| ------------------ | ------------------ | ------- |
| bash               | Visual Studio Code | Mac     |
| Windows Powershell |                    | Windows |
| pwsh (Powershell)  |                    | Linux   |

## Getting Started

### Installation

#### MacOS, Linux, & Windows

```shell
go install github.com/microsoft/clac@latest
```

### Quickstart

After completing the installation, bind `clac` to the terminal you'd like to use
it with via the `clac bind [shell]` command. This will create a custom keybinding
for `CTRL+a` to trigger the autocomplete session & execution.

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
