# sa

`sa` provides IDE style autocomplete, `inshellisense`, for shells. It's a terminal native runtime of for [autocomplete](https://github.com/withfig/autocomplete) which has support for 600+ command line tools. `sa` supports Windows, Linux, & MacOS.

<p align="center"><img alt="demo of sa working" src="https://github.com/microsoft/clac/assets/35637443/544f81dc-dada-40b5-bb1f-a736b4e58e73" height="300px"/></p>

## Getting Started

### Installation

```shell
npm install -g @microsoft/sa
```

### Quickstart

After completing the installation, you can already run `sa --shell <shell>` to start the autocomplete session for your desired shell. Additionally, you can bind `sa` to a keybinding of `CTRL+a` by running the below command. This brings the added advantages of automatically starting the autocomplete session with your current shell and injecting any accepted command into your shell's history.

```shell
sa bind
```

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
