# scripts/setup-scheduled-task.ps1
# Run ONCE to register the weekly dev.to sync task in Windows Task Scheduler.
# Does not require admin — registers under current user account.
#
# Prerequisites before running this script:
#   1. Set ANTHROPIC_API_KEY as a Windows user environment variable
#   2. Set GITHUB_TOKEN as a Windows user environment variable (Fine-grained PAT)
#   See docs/sync-pipeline.md for step-by-step instructions.
#
# To run:
#   cd C:\Repo\blog_sertao
#   powershell -ExecutionPolicy Bypass -File scripts/setup-scheduled-task.ps1
#
# To verify after running:
#   Get-ScheduledTask -TaskName 'SertaoSeraCloud-Sync'
#
# To remove (if you want to unregister):
#   Unregister-ScheduledTask -TaskName 'SertaoSeraCloud-Sync' -Confirm:$false

$ErrorActionPreference = 'Stop'

$taskName    = 'SertaoSeraCloud-Sync'
$repoRoot    = Split-Path -Parent $PSScriptRoot          # resolves to repo root dynamically
$wrapperPath = Join-Path $repoRoot 'scripts\run-sync.ps1'

# Verify the wrapper exists before registering
if (-not (Test-Path $wrapperPath)) {
    Write-Error "Wrapper not found at $wrapperPath. Run this script from the repo root."
    exit 1
}

# Build the action — runs PowerShell with the wrapper script
$action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument "-NonInteractive -ExecutionPolicy Bypass -File `"$wrapperPath`"" `
    -WorkingDirectory $repoRoot

# Weekly trigger — Monday at 09:00 local time
# Change -DaysOfWeek or -At to adjust the schedule
$trigger = New-ScheduledTaskTrigger `
    -Weekly `
    -DaysOfWeek Monday `
    -At '09:00AM'

$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit  (New-TimeSpan -Hours 1) `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -RunOnlyIfNetworkAvailable

# Register under current user (no -RunLevel Highest needed — no admin ops in the script)
Register-ScheduledTask `
    -TaskName  $taskName `
    -Action    $action `
    -Trigger   $trigger `
    -Settings  $settings `
    -Force

Write-Host ""
Write-Host "Task Scheduler entry registered:"
Write-Host "  Name    : $taskName"
Write-Host "  Script  : $wrapperPath"
Write-Host "  Schedule: Weekly, Monday at 09:00 (local time)"
Write-Host "  Catchup : StartWhenAvailable = true (runs on next PC start if missed)"
Write-Host ""
Write-Host "Verify with:"
Write-Host "  Get-ScheduledTask -TaskName '$taskName'"
Write-Host ""
Write-Host "Trigger a manual test run with:"
Write-Host "  Start-ScheduledTask -TaskName '$taskName'"
Write-Host ""
Write-Host "Before the first scheduled run, make sure these are set as Windows user env vars:"
Write-Host "  ANTHROPIC_API_KEY  — from console.anthropic.com > API Keys"
Write-Host "  GITHUB_TOKEN       — Fine-grained PAT (Contents+PRs+Issues write on sertaoseracloud/blog_sertao)"
Write-Host "  See docs/sync-pipeline.md for full setup instructions."
