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

    $npmPrefix = npm config get prefix
    $inshellisense = Join-Path $npmPrefix "\node_modules\@microsoft\inshellisense\build\index.js"
    
    if ($command) {
        Start-Process -NoNewWindow -Wait "node" "$inshellisense -c $command -s pwsh"
    }
    else {
        Start-Process -NoNewWindow -Wait "node" "$inshellisense -s pwsh"
    }

    $executedCommand = node $inshellisense --history
    if ($executedCommand) {
        [Microsoft.PowerShell.PSConsoleReadLine]::AddToHistory($executedCommand)
    }
    [Microsoft.PowerShell.PSConsoleReadLine]::AcceptLine()
}