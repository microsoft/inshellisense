let __is_original_PROMPT_COMMAND = $env.PROMPT_COMMAND
let __is_custom_PROMPT_COMMAND = {
    let promptCommandType = $__is_original_PROMPT_COMMAND | describe
    let cmd = if $promptCommandType == "closure" { do $__is_original_PROMPT_COMMAND } else { $__is_original_PROMPT_COMMAND }
    $"\e]6973;PS\a($cmd)"
}
$env.PROMPT_COMMAND = $__is_custom_PROMPT_COMMAND

let __is_original_PROMPT_INDICATOR = $env.PROMPT_INDICATOR
let __is_custom_PROMPT_INDICATOR = {
    let indicatorCommandType = $__is_original_PROMPT_INDICATOR | describe
    let ind = if $indicatorCommandType == "closure" { do $__is_original_PROMPT_INDICATOR } else { $__is_original_PROMPT_INDICATOR }
    $"($ind)\e]6973;PE\a"
}
$env.PROMPT_INDICATOR = $__is_custom_PROMPT_INDICATOR