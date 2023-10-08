Set-PSReadLineKeyHandler -Chord 'Ctrl+a' -ScriptBlock {
    $command = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$command, [ref]$null)

    $oldPrompt = $function:prompt
    function prompt {"`r"}
    [Microsoft.PowerShell.PSConsoleReadLine]::InvokePrompt()
    $prompt = $oldPrompt

    [Microsoft.PowerShell.PSConsoleReadLine]::ClearKillRing()
    [Microsoft.PowerShell.PSConsoleReadLine]::BeginningOfLine()
    [Microsoft.PowerShell.PSConsoleReadLine]::KillLine()

    $clac = "$env:USERPROFILE\AppData\Roaming\npm\node_modules\@microsoft\clac\build\index.js"
    if ($command) {
        Start-Process -NoNewWindow -Wait "node" "$clac -c $command -s powershell"
    } else {
        Start-Process -NoNewWindow -Wait "node" "$clac -s powershell"
    }

    $executedCommand = node $clac --history
    if ($executedCommand) {
        [Microsoft.PowerShell.PSConsoleReadLine]::AddToHistory($executedCommand)
    }
    [Microsoft.PowerShell.PSConsoleReadLine]::AcceptLine()
}