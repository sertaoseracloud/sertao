---
phase: 02-sync-pipeline
plan: 03
subsystem: sync-pipeline
tags: [pr-builder, sync-devto, pipeline-orchestrator, circuit-breaker, github-rest-api, tdd, node:test]

# Dependency graph
requires:
  - phase: 02-sync-pipeline
    plan: 02
    provides: "DevToClient, DiffDetector, Translator, GlossaryEnforcer — all four consumed by processArticles"
  - path: src/content.config.ts
    provides: "Zod schema — PRBuilder frontmatter output validated against this schema in tests"
provides:
  - "PRBuilder class: buildFrontmatter, writePost, buildPrBody, openGitHubPr, openGitHubIssue"
  - "processArticles() orchestrator: circuit breaker, manual_override skip, glossary drift handling, canonical lint"
  - "SyncArticle and PipelineHandlers TypeScript interfaces"
  - "src/content.config.js: Node.js-compatible Zod schema re-export for test isolation"
  - ".github/SYNC_PR_BODY.md: PR body template placeholder"
affects:
  - 02-04 (GH Actions workflow and scheduling invoke sync-devto.ts entry point)
  - 02-05 (E2E gate verifies pnpm test:sync passes — now 27/27)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GitHub REST API directly for branch creation, file commit, draft PR, reviewer assignment, and issue creation (not peter-evans/create-pull-request@v7)"
    - "YAML frontmatter serialized via JSON.stringify for string fields (T-02-16 tamper mitigation)"
    - "isMain guard pattern: process.argv[1] check defers main() to direct execution only — preserves test import"
    - "astro/zod import path for Node.js-compatible Zod schema (avoids astro:content virtual module)"

key-files:
  created:
    - "scripts/pr-builder.ts"
    - "scripts/types.ts"
    - "scripts/sync-devto.ts"
    - ".github/SYNC_PR_BODY.md"
    - "src/content.config.js"
  modified: []

key-decisions:
  - "GitHub REST API used instead of peter-evans/create-pull-request@v7 — enables per-article PR creation in a loop from TypeScript, consistent with D-05 and RESEARCH.md Option B"
  - "ANTHROPIC_API_KEY guard moved inside main() (not module top-level) — allows test files to import processArticles without ANTHROPIC_API_KEY being set"
  - "src/content.config.js created as Node.js re-export using astro/zod — astro:content is an Astro virtual module unavailable in plain Node.js test runner; this file mirrors the Zod schema exactly and must be kept in sync"
  - "GITHUB_TOKEN reviewer assignment failure is non-fatal (logs warning) — GITHUB_TOKEN cannot assign reviewers; GH_PAT with pull-requests:write scope needed per RESEARCH.md Pitfall B"

requirements-completed: [SYNC-01, SYNC-06, SYNC-07]

# Metrics
duration: 4min
completed: 2026-04-25
---

# Phase 02 Plan 03: PRBuilder + Pipeline Orchestrator Summary

**PRBuilder and sync-devto.ts orchestrator implemented via GitHub REST API; all 27 node:test assertions pass across 6 test files including full circuit breaker and manual_override validation**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-25T03:12:51Z
- **Completed:** 2026-04-25T03:16:35Z
- **Tasks:** 2
- **Files created:** 5

## Accomplishments

- **Task 1:** `scripts/pr-builder.ts` — `PRBuilder` class with:
  - `buildFrontmatter()` producing Zod-valid frontmatter (passes `collections.posts.schema.safeParse`)
  - `writePost()` writing YAML-serialized markdown to `src/content/posts/{slug}.md`
  - `buildPrBody()` with all four D-04 sections (Source, Translation Stats, Glossary Enforcement, Canonical URL Lint)
  - `openGitHubPr()` via GitHub REST API: branch creation → file commit → draft PR → reviewer assignment
  - `openGitHubIssue()` for glossary drift (D-09) and canonical lint failures (D-06)
  - `checkCanonical()` returning true only for URLs starting with `https://sertaoseracloud.com/posts/`

- **Task 1 (supporting):** `scripts/types.ts` with `SyncArticle` and `PipelineHandlers` interfaces

- **Task 1 (supporting):** `src/content.config.js` Node.js-compatible Zod schema re-export (see Deviations)

- **Task 1 (supporting):** `.github/SYNC_PR_BODY.md` placeholder (D-04 section headers)

- **Task 2:** `scripts/sync-devto.ts` — `processArticles()` orchestrator:
  - D-03: skips `manualOverride:true` articles, calls `handlers.onSkip`
  - D-08: circuit breaker stops at `handlers.maxTranslations` translated articles
  - D-09: glossary drift opens issue and skips PR for affected article; continues with others
  - D-06: canonical lint opens issue non-blocking (PR still created)
  - `main()` deferred to direct execution via `isMain` guard — enables `processArticles` import in tests

## Test Results

```
node --test scripts/__tests__/devto-client.test.ts    → pass: 3, fail: 0
node --test scripts/__tests__/diff-detector.test.ts   → pass: 4, fail: 0
node --test scripts/__tests__/glossary-enforcer.test.ts → pass: 5, fail: 0
node --test scripts/__tests__/pr-builder.test.ts      → pass: 7, fail: 0
node --test scripts/__tests__/sync-pipeline.test.ts   → pass: 3, fail: 0
node --test scripts/__tests__/translator.test.ts      → pass: 5, fail: 0
pnpm test:sync (all six files)                        → pass: 27, fail: 0
```

## Task Commits

1. **Task 1: PRBuilder** — `a9fac18` (feat) — `scripts/pr-builder.ts`, `scripts/types.ts`, `.github/SYNC_PR_BODY.md`, `src/content.config.js`
2. **Task 2: Pipeline orchestrator** — `a18b1a8` (feat) — `scripts/sync-devto.ts`

## Architecture Notes

### PR Creation: GitHub REST API (not peter-evans action)

`PRBuilder.openGitHubPr()` uses five sequential GitHub REST API calls:
1. GET `repos/{repo}/git/ref/heads/{base}` — get base branch SHA
2. POST `repos/{repo}/git/refs` — create `sync/{slug}-{runId}` branch
3. GET file content (local read of already-written post file)
4. PUT `repos/{repo}/contents/src/content/posts/{slug}.md` — commit file to branch
5. POST `repos/{repo}/pulls` — open draft PR with D-04 body
6. POST `repos/{repo}/pulls/{number}/requested_reviewers` — assign `sertaoseracloud` (non-fatal)

This is Option B from RESEARCH.md — gives full TypeScript control for multi-article runs vs. the GH Actions loop limitation with peter-evans.

### GITHUB_TOKEN Reviewer Assignment Limitation (RESEARCH.md Pitfall B)

The reviewer assignment step (step 6) non-fatally logs a warning when `GITHUB_TOKEN` is used. `GITHUB_TOKEN` cannot assign reviewers to PRs in most repo configurations. The recommended workaround is setting a `GH_PAT` repository secret with `pull-requests:write` scope. This is documented in the warning message.

## Decisions Made

- **GitHub REST API over peter-evans**: Direct REST API calls enable per-article processing in a TypeScript loop. The peter-evans Action would require a workflow YAML loop which is awkward and doesn't map cleanly to the multi-article pipeline architecture.

- **ANTHROPIC_API_KEY guard in main(), not module scope**: Moving the `process.exit(1)` guard inside `main()` allows `processArticles` to be imported by test files without requiring `ANTHROPIC_API_KEY` to be set. The guard still fires for actual sync runs.

- **`src/content.config.js` Node.js re-export**: The test file imports `collections.posts.schema` from `src/content.config.js`. The original `.ts` file imports from `astro:content` (virtual Astro module, not resolvable by Node.js). Created a `.js` companion using `astro/zod` (available in Node.js) with the identical Zod schema — this is a correctness requirement so PR output stays validated against the real schema.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Created src/content.config.js to resolve import failure in pr-builder.test.ts**
- **Found during:** Task 1 GREEN phase (test run)
- **Issue:** `pr-builder.test.ts` imports `from '../../src/content.config.js'` but only `content.config.ts` exists. `content.config.ts` imports from `astro:content` — an Astro virtual module unavailable in Node.js `--test` runner, causing `ERR_MODULE_NOT_FOUND`.
- **Fix:** Created `src/content.config.js` that uses `import { z } from 'astro/zod'` (available in Node.js) and exports `collections.posts.schema` with the identical Zod schema definition. This file mirrors `content.config.ts` and must be kept in sync.
- **Files modified:** `src/content.config.js` (created)
- **Commit:** `a9fac18`

**2. [Rule 1 - Bug] Moved ANTHROPIC_API_KEY guard inside main() to enable test imports**
- **Found during:** Task 2 implementation — sync-pipeline.test.ts imports processArticles
- **Issue:** The plan placed the environment guard at module top level with `process.exit(1)`. When `sync-pipeline.test.ts` does `import { processArticles } from '../sync-devto.ts'`, the module-level guard fires and kills the test process.
- **Fix:** Moved `ANTHROPIC_API_KEY` check and `process.exit(1)` inside `main()`. Added `isMain` guard using `process.argv[1]` to conditionally call `main()` only when the script is executed directly.
- **Files modified:** `scripts/sync-devto.ts`
- **Commit:** `a18b1a8`

---

**Total deviations:** 2 (both Rule 1 bugs fixed automatically — test infrastructure correctness)
**Impact on plan:** No scope change. All contracts satisfied. The fixes are necessary for the test contracts to work as designed in Plan 02-01.

## Threat Mitigation Status

- **T-02-10 (Information Disclosure — API key logging):** `ANTHROPIC_API_KEY` checked for presence inside `main()`; value never logged. Error message logs key type only.
- **T-02-12 (DoS cost — circuit breaker):** `MAX_TRANSLATIONS_PER_RUN=5` enforced in `processArticles` before any Haiku call. `Number()` conversion applied. Validated by `sync-pipeline.test.ts`.
- **T-02-13 (Tampering — file write):** `PRBuilder.writePost()` only writes to `postsDir/{slug}.md`. Slug comes from Forem API and is alphanumeric + hyphens. No path traversal vector.
- **T-02-14 (Information Disclosure — GITHUB_TOKEN):** Token passed via `Authorization: Bearer` header. Never logged. Reviewer failure logs status code only.
- **T-02-16 (Tampering — frontmatter):** All string fields serialized via `JSON.stringify`. Astro Zod schema re-validates at build time (second gate).

## Known Stubs

None — all four methods implemented with full logic. No placeholder returns or hardcoded empty values flowing to UI.

## Threat Flags

None — no new network endpoints or auth paths beyond the plan's threat model.

## Self-Check: PASSED
