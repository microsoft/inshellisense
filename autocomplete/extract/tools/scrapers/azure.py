import asyncio
import os
import re
import subprocess
from collections import defaultdict as dd
from os import path
from urllib.parse import urldefrag

from aiohttp import ClientSession
from bs4 import BeautifulSoup, Tag
from model import Arg, BaseCommand, Option, Subcommand, gen_golang_file
from pydantic import HttpUrl
from tqdm import tqdm


async def get(url: HttpUrl) -> str:
    async with ClientSession() as session:
        async with session.get(str(url)) as resp:
            return await resp.text()


def clean_command_name(tag: Tag | str) -> str:
    t = tag.text if isinstance(tag, Tag) else tag
    return re.sub(r"\(.*\)", "", t).strip()


async def load_root_commands() -> list[BaseCommand]:
    root_url = "https://learn.microsoft.com/en-us/cli/azure/reference-index?view=azure-cli-latest"
    content = await get(root_url)
    soup = BeautifulSoup(content, features="html.parser")
    command_table = soup.find("table")
    command_table_body = command_table.find("tbody")

    commands = []
    for row in command_table_body.find_all("tr"):
        columns = row.find_all("td")
        command = clean_command_name(columns[0])
        description = columns[1].text.strip()
        command_link = columns[0].find("a").get("href")
        command_link = f"https://learn.microsoft.com/en-us/cli/azure/{command_link}"
        if urldefrag(command_link).url == root_url:
            command_link = None
        commands.append(
            BaseCommand(
                command=command,
                description=description,
                command_link=command_link,
            )
        )
    return commands


def is_command(tag: Tag) -> bool:
    if tag.get("id") is None:
        return False
    return tag.name == "h2" and tag.get("id").startswith("az-")


async def load_subcommand_group_urls(url: HttpUrl) -> list[str]:
    base_url = f"https://{url.host}{url.path.rpartition('/')[0]}/"
    content = await get(url)
    soup = BeautifulSoup(content, features="html.parser")
    command_table = soup.find("table")
    command_table_body = command_table.find("tbody")

    pages = set()

    for row in command_table_body.find_all("tr"):
        columns = row.find_all("td")
        command_link = columns[0].find("a").get("href")
        trimmed_url = urldefrag(
            f"{base_url}{command_link}",
        ).url
        pages.add(trimmed_url)
    return list(pages)


def load_required_parameters(
    command: Tag, soup: BeautifulSoup
) -> list[tuple[str, str]]:
    return _load_parameters(command, soup, "-required-parameters")


def load_optional_parameters(
    command: Tag, soup: BeautifulSoup
) -> list[tuple[str, str]]:
    return _load_parameters(command, soup, "-optional-parameters")


def _load_parameters(
    command: Tag, soup: BeautifulSoup, postfix: str
) -> list[tuple[str, str]]:
    has_postfix_params = soup.find(id=f"{command.get('id')}{postfix}") is not None
    if not has_postfix_params:
        return []

    parameters = []
    last_parameter = command
    while True:
        parameter_name = last_parameter.find_next(class_="parameterName")
        if parameter_name is None:
            break

        is_global_parameter = parameter_name.find_parent("details") is not None
        is_parameter_of_current_command = parameter_name.find_previous(is_command).get(
            "id"
        ) == command.get("id")
        is_postfix_parameters = (
            parameter_name.find_previous("h3").get("id").endswith(postfix)
        )

        parameter_description = parameter_name.find_next(class_="parameterInfo")
        if (
            parameter_description is None
            or is_global_parameter
            or not is_parameter_of_current_command
            or not is_postfix_parameters
        ):
            break

        parameters.append(
            (parameter_name.text.strip(), parameter_description.text.strip())
        )
        last_parameter = parameter_name

    return parameters


def is_option(parameter: tuple[str, str]) -> bool:
    return parameter[0].strip().startswith("-") or parameter[0].strip().startswith("--")


def load_option(parameter: tuple[str, str], is_persistent: bool) -> Option:
    [raw_name, raw_description] = parameter
    names = raw_name.strip().split(" ")
    arg_name = (
        sorted(names, key=len, reverse=True)[0].removeprefix("--").removeprefix("-")
    )

    has_no_arg = "default value: false" in raw_description.lower() or (
        is_persistent
        and ("--debug" in names or "--help" in names or "--verbose" in names)
    )

    match = re.findall(r"accepted values:([^\n]+)", raw_description)

    suggestions = (
        [suggestion.strip() for suggestion in match[0].split(",")]
        if len(match) >= 1
        else None
    )
    args = (
        [Arg(name=arg_name, suggestions=suggestions, is_optional=False)]
        if not has_no_arg
        else None
    )

    description_no_accepted_value = re.sub(
        r"accepted values:[^\n]+", "", raw_description
    )
    description_no_default_value = re.sub(
        r"default value:[^\n]+", "", description_no_accepted_value
    )
    description = description_no_default_value.strip()

    return Option(
        name=names,
        description=description,
        is_persistent=is_persistent,
        args=args,
    )


def is_arg(parameter: tuple[str, str]) -> bool:
    return parameter[0].strip().startswith("<")


def load_arg(parameter: tuple[str, str]) -> Arg:
    return Arg(
        name=parameter[0].strip(), description=parameter[1].strip(), is_optional=True
    )


async def load_global_parameters() -> list[tuple[str, str]]:
    content = await get(
        "https://learn.microsoft.com/en-us/cli/azure/reference-index?view=azure-cli-latest"
    )
    soup = BeautifulSoup(content, features="html.parser")
    details = soup.find("h2").find_next("details")

    parameter_names = [name.text for name in details.find_all(class_="parameterName")]
    parameter_descriptions = [
        descrip.text for descrip in details.find_all(class_="parameterInfo")
    ]
    return zip(parameter_names, parameter_descriptions)


def defaultdict():
    return dd(defaultdict)


def _to_subcommand(name: str, cmd_struct: dict | Subcommand | str | None) -> Subcommand:
    if cmd_struct is None or isinstance(cmd_struct, str):
        return None
    if isinstance(cmd_struct, Subcommand):
        return cmd_struct

    subcommands = [
        _to_subcommand(key, cmd_struct.get(key))
        for key in cmd_struct.keys()
        if cmd_struct.get(key) is not None and not isinstance(cmd_struct.get(key), str)
    ]

    description = cmd_struct.get("__description") or ""
    return Subcommand(name=name, description=description, subcommands=subcommands)


async def load_subcommand(base_command: BaseCommand, counter) -> Subcommand:
    if base_command.command_link is None:
        counter.update()
        return Subcommand(
            name=base_command.command,
            description=base_command.description,
            subcommands=[],
        )
    subcommand_group_urls = await load_subcommand_group_urls(base_command.command_link)
    cmd_dict = defaultdict()
    for subcommand_group_url in subcommand_group_urls:
        content = await get(subcommand_group_url)
        soup = BeautifulSoup(content, features="html.parser")
        commands = soup.find_all(is_command)
        subcommand_group_name = soup.find("h1").text.strip()
        subcommand_group_sections = clean_command_name(subcommand_group_name).split(
            " "
        )[2:]
        subcommand_group_description_soup = soup.find(class_="summary")
        subcommand_group_description = (
            subcommand_group_description_soup.text.strip()
            if subcommand_group_description_soup is not None
            else ""
        )
        active_dict = cmd_dict

        for cmd_section in subcommand_group_sections:
            active_dict = active_dict[cmd_section]
        active_dict["__description"] = subcommand_group_description

        for cmd in commands:
            cmd_sections = clean_command_name(cmd).split(" ")[2:]
            name = cmd_sections[-1]
            description = cmd.find_next("p").text
            required_params = load_required_parameters(cmd, soup)
            optional_params = load_optional_parameters(cmd, soup)

            active_dict = cmd_dict
            for cmd_section in cmd_sections[:-1]:
                active_dict = active_dict[cmd_section]

            options = [
                load_option(param, False)
                for param in [*optional_params, *required_params]
                if is_option(param)
            ]
            options = options if len(options) > 0 else None

            args = [
                load_arg(param)
                for param in [*optional_params, *required_params]
                if is_arg(param)
            ]
            args = args if len(args) > 0 else None

            active_dict[name] = Subcommand(
                name=name, description=description, options=options, args=args
            )

    counter.update()
    return Subcommand(
        name=base_command.command,
        description=base_command.description,
        subcommands=[
            _to_subcommand(key, cmd_dict[key])
            for key in cmd_dict
            if cmd_dict.get(key) is not None and not isinstance(cmd_dict.get(key), str)
        ],
    )


async def load_azure_subcommand():
    subcommands = []
    base_commands = await load_root_commands()
    progress = tqdm(total=len(base_commands))
    subcommands = await asyncio.gather(
        *[load_subcommand(command, progress) for command in base_commands]
    )

    global_args = await load_global_parameters()
    options = [load_option(arg, True) for arg in global_args]
    return Subcommand(
        name="az",
        description="Azure CLI",
        subcommands=subcommands,
        options=options,
    )


async def main():
    az_subcommand = await load_azure_subcommand()
    filepath = path.join(os.getcwd(), "autocomplete", "specs", "azure.go")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(
            gen_golang_file(
                az_subcommand, "autocomplete/extract/tools/scrapers/azure.py"
            )
        )
    subprocess.run(["gofmt", "-w", filepath])


if __name__ == "__main__":
    asyncio.run(main())
