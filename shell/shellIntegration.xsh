import os

def __is_prompt_start() -> str:
    return "\001" + "\x1b]6973;PS\x07"


def __is_prompt_end() -> str:
    return "\001" + "\x1b]6973;PE\x07" + "\002"


def __is_escape_value(value: str) -> str:
    byte_list = [bytes([byte]).decode("utf-8") for byte in list(value.encode("utf-8"))]
    return "".join(
        [
            "\\x3b" if byte == ";" else "\\\\" if byte == "\\" else byte
            for byte in byte_list
        ]
    )

def __is_update_cwd() -> str:
    return f"\x1b]6973;CWD;{__is_escape_value(os.getcwd())}\x07" + "\002"

$PROMPT_FIELDS['__is_prompt_start'] = __is_prompt_start
$PROMPT_FIELDS['__is_prompt_end'] = __is_prompt_end
$PROMPT_FIELDS['__is_update_cwd'] = __is_update_cwd
if 'ISTERM_TESTING' in ${...}:
    $PROMPT = "> "

$PROMPT = "{__is_prompt_start}{__is_update_cwd}" + $PROMPT + "{__is_prompt_end}"