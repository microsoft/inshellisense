Set-PSReadLineKeyHandler -Chord 'Ctrl+a' -ScriptBlock {
    $command = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$command, [ref]$null)

    $oldPrompt = $function:prompt
    function prompt {" `n"}
    [Microsoft.PowerShell.PSConsoleReadLine]::InvokePrompt()
    $prompt = $oldPrompt

    [Microsoft.PowerShell.PSConsoleReadLine]::ClearKillRing()
    [Microsoft.PowerShell.PSConsoleReadLine]::BeginningOfLine()
    [Microsoft.PowerShell.PSConsoleReadLine]::KillLine()

    if ($command) {
        Start-Process -NoNewWindow -Wait ".\clac" "$command"
    } else {
        Start-Process -NoNewWindow -Wait ".\clac"
    }

    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = ".\clac"
    $pinfo.RedirectStandardError = $true
    $pinfo.RedirectStandardOutput = $true
    $pinfo.UseShellExecute = $false
    $pinfo.Arguments = "-o"
    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $pinfo
    $p.Start() | Out-Null
    $p.WaitForExit()
    $stdout = $p.StandardOutput.ReadToEnd()

    [Microsoft.PowerShell.PSConsoleReadLine]::AcceptLine()

    $cmd,$args = $stdout -split ' ',2
    if ($cmd.Trim() -and $args.Trim()) {
         Start-Process -NoNewWindow -Wait "$cmd" "$args"
    } elseif ($cmd.Trim()) {
        Start-Process -NoNewWindow -Wait "$cmd"
    }
}