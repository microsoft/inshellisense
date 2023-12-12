$Global:__IsOriginalPrompt = $function:Prompt

function Global:Prompt() {
    $Result = "$([char]0x1b)]6973;PS`a"
    $Result += $Global:__IsOriginalPrompt.Invoke()
    $Result += "$([char]0x1b)]6973;PE`a"
    return $Result
}