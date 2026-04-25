---
phase: 02-sync-pipeline
plan: 01
subsystem: testing
tags: [node:test, @anthropic-ai/sdk, tsx, sync-pipeline, tdd]

# Dependency graph
requires:
  - phase: 01-bootstrap-fundacoes
    provides: "src/content.config.ts Zod schema used by pr-builder.test.ts for frontmatter validation"
provides:
  - "Six failing test scaffolds covering all pipeline component contracts"
  - "@anthropic-ai/sdk 0.91.0 and tsx 4.21.0 devDependencies installed"
  - "pnpm test:sync command wired to node --test runner"
  - "pnpm sync:devto command wired to tsx scripts/sync-devto.ts"
affects:
  - 02-02 (Wave 2 implements DevToClient, DiffDetector, Translator against these tests)
  - 02-03 (Wave 2 implements GlossaryEnforcer, PRBuilder, processArticles against these tests)

# Tech tracking
tech-stack:
  added:
    - "@anthropic-ai/sdk 0.91.0 (devDependency)"
    - "tsx 4.21.0 (devDependency)"
  patterns:
    - "node:test + node:assert/strict for all script unit tests (no external test framework)"
    - "Dependency injection pattern for all pipeline components (fetchFn, anthropicClient as constructor params)"
    - "Import from ../componentName.ts (flat scripts/ structure, __tests__/ subdirectory)"

key-files:
  created:
    - "scripts/__tests__/devto-client.test.ts"
    - "scripts/__tests__/diff-detector.test.ts"
    - "scripts/__tests__/translator.test.ts"
    - "scripts/__tests__/glossary-enforcer.test.ts"
    - "scripts/__tests__/pr-builder.test.ts"
    - "scripts/__tests__/sync-pipeline.test.ts"
  modified:
    - "package.json (sync:devto script updated, test:sync added, devDependencies added)"

key-decisions:
  - "node:test built-in chosen over vitest/jest — no additional test framework dependency"
  - "Test files import from ../componentName.ts (Wave 2 places modules at scripts/ root)"
  - "pr-builder.test.ts imports live Zod schema from src/content.config.js — schema drift causes immediate test failure"

patterns-established:
  - "All scripts/__tests__/*.test.ts files use node:test + node:assert/strict"
  - "Mock objects passed via constructor (dependency injection), never instantiated inside components"
  - "circuit breaker test asserts exactly 5 of 10 articles processed with maxTranslations=5"

requirements-completed: [SYNC-01]

# Metrics
duration: 12min
completed: 2026-04-25
---

# Phase 02 Plan 01: Sync Pipeline Foundation Summary

**@anthropic-ai/sdk 0.91.0 + tsx 4.21.0 installed; six node:test scaffold files cover all five pipeline component contracts including Zod schema validation and circuit breaker behavior**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-25T02:53:00Z
- **Completed:** 2026-04-25T03:05:00Z
- **Tasks:** 2
- **Files modified:** 7 (package.json + 6 test files)

## Accomplishments

- Installed `@anthropic-ai/sdk@0.91.0` and `tsx@4.21.0` as devDependencies; pnpm lockfile consistent
- Updated `sync:devto` script from placeholder to `tsx scripts/sync-devto.ts`; added `test:sync` wired to `node --test`
- Created six failing test scaffolds in `scripts/__tests__/` — all import from modules not yet implemented (Wave 2 target)
- `pr-builder.test.ts` imports the live Zod schema from `src/content.config.js` so schema drift causes immediate test failure

## Package Versions Installed

- `@anthropic-ai/sdk`: **0.91.0** (resolved from `^0.91.0`)
- `tsx`: **4.21.0** (resolved from `^4.21.0`)
- No peer dependency warnings from pnpm install (only a Node.js internal `url.parse()` deprecation notice, unrelated)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install devDependencies and update package.json scripts** - `babff32` (feat) — committed in prior session
2. **Task 2: Create six failing test scaffolds** - `f215ee6` (test)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `package.json` - Added `@anthropic-ai/sdk ^0.91.0`, `tsx ^4.21.0` to devDependencies; updated `sync:devto` and `test:sync` scripts
- `scripts/__tests__/devto-client.test.ts` - REQ-01, REQ-02: two-step fetch, body_markdown presence checks
- `scripts/__tests__/diff-detector.test.ts` - REQ-03, REQ-04: SHA-256 normalization, CRLF/LF parity, hex length
- `scripts/__tests__/translator.test.ts` - REQ-05, REQ-06: H2/H3 section splitting, Anthropic mock, token aggregation
- `scripts/__tests__/glossary-enforcer.test.ts` - REQ-07, REQ-08: drift detection, EN/PT counts, case sensitivity
- `scripts/__tests__/pr-builder.test.ts` - REQ-09, REQ-11, REQ-12: Zod schema validation, all four D-04 PR body sections
- `scripts/__tests__/sync-pipeline.test.ts` - REQ-10, REQ-12: circuit breaker (maxTranslations=5), manual_override skip

## Decisions Made

- **node:test built-in**: Chose Node.js built-in test runner over vitest/jest to avoid adding an extra test framework devDependency. Consistent with the ESM-only, minimal-deps project philosophy.
- **Flat import path**: Test files import from `../componentName.ts` (not a full path), establishing that Wave 2 modules live directly under `scripts/` (not a subdirectory).
- **Live Zod schema in pr-builder test**: `pr-builder.test.ts` imports `collections.posts.schema` from `src/content.config.js` directly — this is a guard ensuring PRBuilder output never drifts from the actual content schema.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Task 1 completed in prior session (commit babff32)**
- **Found during:** Plan start
- **Issue:** The previous session commit `babff32` already executed Task 1 (package.json changes and pnpm install). The task was complete but not yet documented in the plan context.
- **Fix:** Verified all Task 1 acceptance criteria pass, recorded the pre-existing commit hash as the Task 1 commit, and proceeded directly to Task 2.
- **Files modified:** None (Task 1 was already complete)
- **Verification:** All 6 grep checks and module directory existence checks passed
- **Committed in:** babff32 (pre-existing commit)

---

**Total deviations:** 1 (pre-existing work recognized, not duplicated)
**Impact on plan:** No scope change. Prior session's commit satisfies all Task 1 acceptance criteria exactly.

## Test Scaffold Status

All six test files intentionally fail at import resolution stage:
- `scripts/__tests__/devto-client.test.ts` → imports `../devto-client.ts` (does not exist yet)
- `scripts/__tests__/diff-detector.test.ts` → imports `../diff-detector.ts` (does not exist yet)
- `scripts/__tests__/translator.test.ts` → imports `../translator.ts` (does not exist yet)
- `scripts/__tests__/glossary-enforcer.test.ts` → imports `../glossary-enforcer.ts` (does not exist yet)
- `scripts/__tests__/pr-builder.test.ts` → imports `../pr-builder.ts` (does not exist yet)
- `scripts/__tests__/sync-pipeline.test.ts` → imports `../sync-devto.ts` (stub exists; `processArticles` export not yet present)

**Expected behavior:** `pnpm test:sync` fails with "Cannot find module" errors until Wave 2 (plans 02-02, 02-03) implements the modules.

## Issues Encountered

None — plan executed cleanly. The 4 pre-existing test files in `scripts/__tests__/` (devto-client, diff-detector, glossary-enforcer, translator) were created in the prior session but left untracked; they were staged and committed as part of Task 2 along with the 2 newly created files.

## User Setup Required

None — no external service configuration required for this plan. ANTHROPIC_API_KEY is needed for Wave 3 execution but not for test scaffolding.

## Known Stubs

None — this plan creates test scaffolds only. No UI rendering, no data flow wiring. Tests intentionally fail until Wave 2 implements the modules.

## Next Phase Readiness

- Wave 1 complete: test infrastructure in place, `pnpm test:sync` command wired
- Plan 02-02 (Wave 2, part 1): implement DevToClient, DiffDetector, Translator to turn tests green
- Plan 02-03 (Wave 2, part 2): implement GlossaryEnforcer, PRBuilder, processArticles to turn remaining tests green
- No blockers for Wave 2 execution

---
*Phase: 02-sync-pipeline*
*Completed: 2026-04-25*
