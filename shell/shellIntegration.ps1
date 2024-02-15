$Global:__IsOriginalPrompt = $function:Prompt

function Global:__IsTestingPrompt() {
    return "PS > "
}
if ($env:ISTERM_TESTING -eq "1") {
    $Global:__IsOriginalPrompt = $function:__IsTestingPrompt
}

function Global:__IS-Escape-Value([string]$value) {
    [regex]::Replace($value, '[\\\n;]', { param($match)
            -Join (
                [System.Text.Encoding]::UTF8.GetBytes($match.Value) | ForEach-Object { '\x{0:x2}' -f $_ }
            )
        })
}

function Global:Prompt() {
    $Result = "$([char]0x1b)]6973;PS`a"
    $Result += $Global:__IsOriginalPrompt.Invoke()
    $Result += "$([char]0x1b)]6973;PE`a"
    $Result += if ($pwd.Provider.Name -eq 'FileSystem') { "$([char]0x1b)]6973;CWD;$(__IS-Escape-Value $pwd.ProviderPath)`a" }
    return $Result
}