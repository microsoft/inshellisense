function CommandExists {
    param (
        [string]$C
    )
    
    if (Get-Command $C -ErrorAction SilentlyContinue) { 
        return $true
    }
    return $false
}

$npmRoot = if (CommandExists -C "npm") { Invoke-Expression -Command "npm root -g" }
$pnpmRoot = if (CommandExists -C "pnpm") { Invoke-Expression -Command "pnpm root -g" }
$yarnRoot = if (CommandExists -C "yarn") { 
    $globalPath = Invoke-Expression -Command "yarn global dir"
    "$globalPath/node_modules"
 }

$nodeModulesPath = ($npmRoot, $pnpmRoot, $yarnRoot | Where-Object { Test-Path "$_/@microsoft/inshellisense" -PathType Container } | Select-Object -First 1)

if (!$nodeModulesPath) {
    throw "Could not find @microsoft/inshellisense in any of the following package managers: npm, pnpm, yarn"
}

Set-Content -Path "$env:USERPROFILE\.inshellisense\modules-path" -Value $nodeModulesPath

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

    $nodeModulesPath = Get-Content -Path "$env:USERPROFILE\.inshellisense\modules-path"
    $inshellisense = "$nodeModulesPath\@microsoft\inshellisense\build\index.js"
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