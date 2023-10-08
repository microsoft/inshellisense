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

    $inshellisense = "$env:USERPROFILE\AppData\Roaming\npm\node_modules\@microsoft\inshellisense\build\index.js"
    if ($command) {
        Start-Process -NoNewWindow -Wait "node" "$inshellisense -c $command -s powershell"
    }
    else {
        Start-Process -NoNewWindow -Wait "node" "$inshellisense -s powershell"
    }

    $executedCommand = node $inshellisense --history
    if ($executedCommand) {
        [Microsoft.PowerShell.PSConsoleReadLine]::AddToHistory($executedCommand)
    }
}