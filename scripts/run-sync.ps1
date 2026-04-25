# scripts/run-sync.ps1
# Weekly sync wrapper — invoked by Windows Task Scheduler.
# Requires ANTHROPIC_API_KEY and GITHUB_TOKEN to be set as Windows user environment variables.

$ErrorActionPreference = 'Stop'

# Resolve repo root from this script's location (scripts/ -> parent = repo root)
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "[sync] Starting dev.to sync at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "[sync] Working directory: $repoRoot"

# Verify required env vars are present before spending any API calls
if (-not $env:ANTHROPIC_API_KEY) {
    Write-Error "[sync] ANTHROPIC_API_KEY is not set. Set it via: Start -> Edit environment variables for your account"
    exit 1
}
if (-not $env:GITHUB_TOKEN) {
    Write-Error "[sync] GITHUB_TOKEN is not set. Set it via: Start -> Edit environment variables for your account"
    exit 1
}

# Run the sync pipeline
& pnpm sync:devto
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "[sync] Completed successfully at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
} else {
    Write-Error "[sync] Failed with exit code $exitCode"
    exit $exitCode
}
