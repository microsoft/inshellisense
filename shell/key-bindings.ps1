Set-PSReadLineKeyHandler -Chord "Ctrl+a" -ScriptBlock {
    [Microsoft.PowerShell.PSConsoleReadLine]::ClearKillRing()
    [Microsoft.PowerShell.PSConsoleReadLine]::BeginningOfLine()
    [Microsoft.PowerShell.PSConsoleReadLine]::KillLine()
    [Microsoft.PowerShell.PSConsoleReadLine]::Insert('.\clac.exe "')
    [Microsoft.PowerShell.PSConsoleReadLine]::Yank()
    [Microsoft.PowerShell.PSConsoleReadLine]::Insert('" ; .\clac.exe -o | iex')
    [Microsoft.PowerShell.PSConsoleReadLine]::AcceptLine()
}