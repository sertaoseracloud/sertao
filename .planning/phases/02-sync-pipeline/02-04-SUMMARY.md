---
phase: 02-sync-pipeline
plan: 04
subsystem: sync-pipeline
tags: [windows-task-scheduler, powershell, github-actions, workflow-dispatch, scheduling]

# Dependency graph
requires:
  - phase: 02-sync-pipeline
    plan: 03
    provides: "scripts/sync-devto.ts entry point; pnpm sync:devto command — what run-sync.ps1 invokes"
provides:
  - "scripts/run-sync.ps1: Windows Task Scheduler wrapper — resolves repo root, guards env vars, calls pnpm sync:devto"
  - "scripts/setup-scheduled-task.ps1: one-time registration script for weekly Monday 09:00 task, StartWhenAvailable"
  - ".github/workflows/sync-devto.yml: workflow_dispatch-only GH Actions fallback (no cron)"
affects:
  - 02-05 (E2E gate verifies sync workflow exists and has workflow_dispatch trigger)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Windows Task Scheduler via PowerShell Register-ScheduledTask (no admin required — user-level task)"
    - "PSScriptRoot for dynamic repo-root resolution — no hardcoded paths in task registration"
    - "StartWhenAvailable + MultipleInstances IgnoreNew: catchup on missed runs; prevents concurrent stacking"
    - "workflow_dispatch-only GH Actions workflow (no cron) — local PC is the primary scheduler"

key-files:
  created:
    - "scripts/run-sync.ps1"
    - "scripts/setup-scheduled-task.ps1"
    - ".github/workflows/sync-devto.yml"
  modified: []

key-decisions:
  - "Windows Task Scheduler (not GH Actions cron) is the primary scheduler — confirmed in Phase 2 context decision; sync-devto.yml has workflow_dispatch only"
  - "run-sync.ps1 guards ANTHROPIC_API_KEY and GITHUB_TOKEN with actionable error messages before spending any API calls"
  - "setup-scheduled-task.ps1 uses PSScriptRoot to resolve wrapperPath dynamically — portable across different repo locations"
  - "Task registered at user level (no -RunLevel Highest) — no admin operations in the sync script"

requirements-completed: [SYNC-08, SYNC-09]

# Metrics
duration: 2min
completed: 2026-04-25
---

# Phase 02 Plan 04: Scheduling — Windows Task Scheduler + GH Actions Fallback Summary

**Windows Task Scheduler setup created: run-sync.ps1 wrapper, setup-scheduled-task.ps1 one-time registration, and workflow_dispatch-only sync-devto.yml GH Actions fallback**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-25T03:19:27Z
- **Completed:** 2026-04-25T03:21:45Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- **Task 1:** `scripts/run-sync.ps1` — PowerShell wrapper invoked by Windows Task Scheduler:
  - Resolves repo root dynamically via `Split-Path -Parent $PSScriptRoot` (portable)
  - Guards `ANTHROPIC_API_KEY` and `GITHUB_TOKEN` with actionable error messages before any API calls
  - Calls `pnpm sync:devto` and propagates exit code
  - Timestamps start and completion for Task Scheduler logs

- **Task 1:** `.github/workflows/sync-devto.yml` — GH Actions manual fallback:
  - `workflow_dispatch` trigger only — no cron (Windows Task Scheduler handles scheduling)
  - `max_translations` input with default of 5
  - `permissions: contents: write, pull-requests: write, issues: write`
  - `concurrency.cancel-in-progress: false` (preserves in-flight sync runs)
  - pnpm/action-setup@v4 + setup-node@v4 pattern from deploy.yml

- **Task 2:** `scripts/setup-scheduled-task.ps1` — one-time task registration:
  - Task name: `SertaoSeraCloud-Sync`
  - Schedule: weekly, Monday at 09:00 local time
  - `-StartWhenAvailable` — fires on next PC start if machine was off at trigger time
  - `-MultipleInstances IgnoreNew` — prevents concurrent stacking
  - `-RunOnlyIfNetworkAvailable` — requires network for Forem API + GitHub API
  - Uses `$PSScriptRoot` for dynamic repo-root resolution (T-02-20 mitigation)
  - Includes verification (`Get-ScheduledTask`) and manual test (`Start-ScheduledTask`) instructions

## Architecture: Scheduling

```
Developer's PC
├── Windows Task Scheduler
│   └── SertaoSeraCloud-Sync (weekly Mon 09:00, StartWhenAvailable)
│       └── powershell.exe -File scripts/run-sync.ps1
│           └── pnpm sync:devto  →  scripts/sync-devto.ts
│
└── Manual / emergency fallback
    └── GitHub Actions UI → "Sync dev.to articles (manual)" → workflow_dispatch
        └── pnpm sync:devto (ubuntu-latest, ANTHROPIC_API_KEY + GITHUB_TOKEN secrets)
```

## One-Time Developer Setup Required

Before first scheduled run:
1. Set `ANTHROPIC_API_KEY` as Windows user environment variable (Start → "Edit environment variables for your account")
2. Set `GITHUB_TOKEN` as Windows user environment variable (Fine-grained PAT: Contents+PRs+Issues write on sertaoseracloud/blog_sertao)
3. Run once: `powershell -ExecutionPolicy Bypass -File scripts/setup-scheduled-task.ps1`
4. Verify: `Get-ScheduledTask -TaskName 'SertaoSeraCloud-Sync'`
5. Manual test: `Start-ScheduledTask -TaskName 'SertaoSeraCloud-Sync'`

## Task Commits

1. **Task 1: run-sync.ps1 + sync-devto.yml** — `bd14c2d` (feat)
2. **Task 2: setup-scheduled-task.ps1** — `aa07df2` (feat)

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigation Status

- **T-02-17 (GITHUB_TOKEN disclosure):** User-level env var only; not in source code; minimal PAT scope. MITIGATED.
- **T-02-18 (ANTHROPIC_API_KEY disclosure):** Same pattern. Anthropic $5/month budget alert limits blast radius. MITIGATED.
- **T-02-19 (DoS cost — weekly runs):** MAX_TRANSLATIONS_PER_RUN=5 already enforced in sync-devto.ts; weekly cadence at most 52 runs/year. ACCEPTED.
- **T-02-20 (Tampering — hardcoded path):** `$PSScriptRoot` resolves paths dynamically in both scripts. MITIGATED.
- **T-02-21 (Elevation of privilege):** No `-RunLevel Highest` in Register-ScheduledTask — user-level only. ACCEPTED.
- **T-02-22 (DoS — concurrent runs):** `MultipleInstances IgnoreNew` prevents second run while first is active. MITIGATED.

## Known Stubs

None — all scripts fully implemented with no placeholder logic.

## Threat Flags

None — no new network endpoints or auth paths beyond the plan's threat model.

## Self-Check: PASSED
