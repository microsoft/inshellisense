let __is_escape_value = {|x| $x | str replace --all "\\" "\\\\" | str replace --all ";" "\\x3b" | str replace --all "\n" '\x0a' | str replace --all "\e" "\\x1b" | str replace --all "\a" "\\x07" }
let __is_original_PROMPT_COMMAND = if 'PROMPT_COMMAND' in $env { $env.PROMPT_COMMAND } else { "" }
let __is_original_PROMPT_INDICATOR = if 'PROMPT_INDICATOR' in $env { $env.PROMPT_INDICATOR } else { "" }

let __is_update_cwd = { 
    let pwd = do $__is_escape_value $env.PWD
    $"\e]6973;CWD;($pwd)\a" 
}
let __is_report_prompt = { 
    let __is_indicatorCommandType = $__is_original_PROMPT_INDICATOR | describe
    mut __is_prompt_ind = if $__is_indicatorCommandType == "closure" { do $__is_original_PROMPT_INDICATOR } else { $__is_original_PROMPT_INDICATOR }
    let __is_esc_prompt_ind = do $__is_escape_value $__is_prompt_ind
    $"\e]6973;PROMPT;($__is_esc_prompt_ind)\a"
}
let __is_custom_PROMPT_COMMAND = {
    let promptCommandType = $__is_original_PROMPT_COMMAND | describe
    mut cmd = if $promptCommandType == "closure" { do $__is_original_PROMPT_COMMAND } else { $__is_original_PROMPT_COMMAND }
    let pwd = do $__is_update_cwd
    let prompt = do $__is_report_prompt
    if 'ISTERM_TESTING' in $env {
        $cmd = ""
    }
    $"\e]6973;PS\a($cmd)($pwd)($prompt)"
}
$env.PROMPT_COMMAND = $__is_custom_PROMPT_COMMAND

let __is_original_PROMPT_INDICATOR = if 'PROMPT_INDICATOR' in $env { $env.PROMPT_INDICATOR } else { "" }
let __is_custom_PROMPT_INDICATOR = {
    let indicatorCommandType = $__is_original_PROMPT_INDICATOR | describe
    mut ind = if $indicatorCommandType == "closure" { do $__is_original_PROMPT_INDICATOR } else { $__is_original_PROMPT_INDICATOR }
    if 'ISTERM_TESTING' in $env {
        $ind = "> "
    }
    $"($ind)\e]6973;PE\a"
}
$env.PROMPT_INDICATOR = $__is_custom_PROMPT_INDICATOR