Set-PSReadLineKeyHandler -Chord 'Ctrl+a' -ScriptBlock {
    $command = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$command, [ref]$null)

    $oldPrompt = $function:prompt
    function prompt { "`r" }
    [Microsoft.PowerShell.PSConsoleReadLine]::InvokePrompt()
    $prompt = $oldPrompt

    [Microsoft.PowerShell.PSConsoleReadLine]::ClearKillRing()
    [Microsoft.PowerShell.PSConsoleReadLine]::BeginningOfLine()
    [Microsoft.PowerShell.PSConsoleReadLine]::KillLine()
    [Microsoft.PowerShell.PSConsoleReadLine]::AcceptLine()

    $sa = "$env:USERPROFILE\AppData\Roaming\npm\node_modules\@microsoft\sa\build\index.js"
    if ($command) {
        Start-Process -NoNewWindow -Wait "node" "$sa -c $command -s powershell"
    }
    else {
        Start-Process -NoNewWindow -Wait "node" "$sa -s powershell"
    }

    $executedCommand = node $sa --history
    if ($executedCommand) {
        [Microsoft.PowerShell.PSConsoleReadLine]::AddToHistory($executedCommand)
    }
}