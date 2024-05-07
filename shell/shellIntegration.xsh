import os
from xonsh.main import XSH

def __is_prompt_start() -> str:
    return "\001" + "\x1b]6973;PS\x07"


def __is_prompt_end() -> str:
    return "\001" + "\x1b]6973;PE\x07" + "\002"

def __is_escape_value(value: str) -> str:
    byte_list = [bytes([byte]).decode("utf-8") for byte in list(value.encode("utf-8"))]
    return "".join(
        [
            "\\x3b" if byte == ";" else "\\\\" if byte == "\\" else "\\x1b" if byte == "\x1b" else "\x0a" if byte == "\n"else "\\x07" if byte == "\x07" else byte
            for byte in byte_list
        ]
    )

def __is_update_cwd() -> str:
    return f"\x1b]6973;CWD;{__is_escape_value(os.getcwd())}\x07"

__is_original_prompt = $PROMPT
def __is_report_prompt() -> str:
    prompt = ""
    formatted_prompt = XSH.shell.prompt_formatter(__is_original_prompt)
    prompt = "".join([text for  _, text in XSH.shell.format_color(formatted_prompt)])
    return f"\x1b]6973;PROMPT;{__is_escape_value(prompt)}\x07" + "\002"

$PROMPT_FIELDS['__is_prompt_start'] = __is_prompt_start
$PROMPT_FIELDS['__is_prompt_end'] = __is_prompt_end
$PROMPT_FIELDS['__is_update_cwd'] = __is_update_cwd
$PROMPT_FIELDS['__is_report_prompt'] = __is_report_prompt
if 'ISTERM_TESTING' in ${...}:
    $PROMPT = "> "

$PROMPT = "{__is_prompt_start}{__is_update_cwd}{__is_report_prompt}" + $PROMPT + "{__is_prompt_end}"