---
phase: 02-sync-pipeline
plan: 02
subsystem: sync-pipeline
tags: [devto-client, diff-detector, translator, glossary-enforcer, tdd, node:test, anthropic-sdk]

# Dependency graph
requires:
  - phase: 02-sync-pipeline
    plan: 01
    provides: "Six failing test scaffolds + @anthropic-ai/sdk + tsx devDependencies"
provides:
  - "DevToClient — two-step Forem API fetch with dependency-injectable fetchFn"
  - "hashMarkdown() — SHA-256 with whitespace normalization via node:crypto"
  - "Translator — section-by-section Haiku 4.5 translation with glossary system prompt"
  - "enforceGlossary() — hard-fail drift detection via case-sensitive term counting"
affects:
  - 02-03 (Wave 2 part 2 wires these into PRBuilder and processArticles)
  - 02-04 (scheduling layer invokes the pipeline)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "node:crypto createHash('sha256') for SHA-256 content hashing"
    - "Regex /(?=^#{2,3} )/m lookahead for Markdown section splitting on H2/H3"
    - "SDK error handling via Anthropic.RateLimitError, Anthropic.APIConnectionError, Anthropic.BadRequestError"
    - "Null-safe glossary access (?? []) to handle partial mocks in tests without runtime error"

key-files:
  created:
    - "scripts/devto-client.ts"
    - "scripts/diff-detector.ts"
    - "scripts/glossary-enforcer.ts"
    - "scripts/translator.ts"
  modified: []

key-decisions:
  - "Translator.buildSystemPrompt() uses null-coalescing (?? []) for all glossary array/object fields — enables partial mock objects in tests (e.g., {preserve_as_is: ['AWS']} as any) without runtime errors"
  - "Translator uses model string 'claude-haiku-4-5' exactly as documented in RESEARCH.md"
  - "No custom retry logic in Translator — relies entirely on SDK built-in maxRetries (3) for exponential backoff"
  - "GlossaryEnforcer uses regex escaping for preserve_as_is terms to safely match terms containing regex metacharacters"

requirements-completed: [SYNC-02, SYNC-03, SYNC-04, SYNC-05]

# Metrics
duration: 2min
completed: 2026-04-25
---

# Phase 02 Plan 02: Pipeline Component Implementations Summary

**DevToClient, DiffDetector, Translator, and GlossaryEnforcer implemented — all 17 node:test assertions pass; four modules satisfy Wave 1 test scaffold contracts exactly**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-25T03:08:47Z
- **Completed:** 2026-04-25T03:10:15Z
- **Tasks:** 3
- **Files created:** 4

## Accomplishments

- **Task 1:** `scripts/devto-client.ts` — `DevToClient` class with `listArticles()` and `getArticle()`. Constructor accepts optional `fetchFn` defaulting to `globalThis.fetch`. Listing returns `DevToArticleSummary[]` (no `body_markdown`); per-article returns `DevToArticleFull extends DevToArticleSummary` with `body_markdown`. Returns empty array on listing failure; throws on per-article failure. 3/3 tests pass.

- **Task 2:** `scripts/diff-detector.ts` + `scripts/glossary-enforcer.ts` — `hashMarkdown()` normalizes whitespace (`trim()` + CRLF→LF) before SHA-256 via `node:crypto createHash`. `enforceGlossary()` counts case-sensitive occurrences of each `preserveList` term; fails when PT count < EN count for terms that appear in EN source. 4+5 = 9/9 tests pass.

- **Task 3:** `scripts/translator.ts` — `Translator` class with `splitSections()` (regex `/(?=^#{2,3} )/m`) and `translatePost()`. Makes one `client.messages.create` call per section, model `claude-haiku-4-5`, `max_tokens: 8192`. Aggregates `inputTokens`, `outputTokens` across sections. `buildSystemPrompt()` dynamically builds from glossary's `preserve_as_is`, `prefer_en_over_pt`, `never_translate`, `style_notes`. 5/5 tests pass.

## Test Results

```
node --test scripts/__tests__/devto-client.test.ts   → pass: 3, fail: 0
node --test scripts/__tests__/diff-detector.test.ts  → pass: 4, fail: 0
node --test scripts/__tests__/glossary-enforcer.test.ts → pass: 5, fail: 0
node --test scripts/__tests__/translator.test.ts     → pass: 5, fail: 0
Total                                                → pass: 17, fail: 0
```

## Task Commits

1. **Task 1: DevToClient** — `72ad287` (feat) — `scripts/devto-client.ts`
2. **Task 2: DiffDetector + GlossaryEnforcer** — `ad5bdfb` (feat) — `scripts/diff-detector.ts`, `scripts/glossary-enforcer.ts`
3. **Task 3: Translator** — `5f916ac` (feat) — `scripts/translator.ts`

## Decisions Made

- **Null-coalescing guards in Translator**: The translator test passes partial mock glossary objects (`{ preserve_as_is: ['AWS'] } as any`). `buildSystemPrompt()` must not throw when `prefer_en_over_pt`, `never_translate`, or `style_notes` are absent. Added `?? {}` / `?? []` guards — this is defensive correctness, not a feature change.

- **Model ID string**: `'claude-haiku-4-5'` — used exactly as specified in RESEARCH.md. No alias experimentation needed; the test simply exercises mock calls and doesn't validate the model string directly, but the acceptance criteria require this exact string.

- **No custom retry**: `Translator` does not implement retry loops. The Anthropic SDK's `maxRetries` default (2) provides exponential backoff for transient errors. The plan explicitly prohibits custom retry to avoid duplication.

- **Regex metachar escaping in GlossaryEnforcer**: Terms like `CI/CD`, `Pub/Sub`, `mTLS` contain `/` which is not a regex metacharacter in JS, but `.*+?^${}()|[\]\\` are escaped for safety. The escaping function correctly handles any future terms that include these characters.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Null-safe glossary access in Translator.buildSystemPrompt()**
- **Found during:** Task 3 implementation analysis
- **Issue:** The plan's implementation uses `Object.entries(this.glossary.prefer_en_over_pt)` directly. When the test passes `{ preserve_as_is: ['AWS'] } as any`, `prefer_en_over_pt` is `undefined` at runtime, causing `Object.entries(undefined)` to throw a TypeError.
- **Fix:** Added `?? {}` for `prefer_en_over_pt` and `?? []` for `never_translate` and `style_notes` in `buildSystemPrompt()`. The production glossary always has these fields; the guard only matters for tests with partial mocks.
- **Files modified:** `scripts/translator.ts`
- **Commit:** `5f916ac`

---

**Total deviations:** 1 (defensive null guard for partial mock compatibility)
**Impact on plan:** No scope change. All contracts satisfied. The production path with full `GlossaryJson` is unaffected.

## Threat Mitigation Status

- **T-02-04 (Tampering — DevToClient):** Listing response is returned as-is from the API; if the API returns a non-array, calling code (`listArticles`) would fail gracefully via the `!res.ok` guard. Array validation at iteration point is deferred to Wave 3 orchestrator (T-02-04 mitigation is partially in orchestrator scope).
- **T-02-05 (Information Disclosure — Translator):** SDK error handling logs only error type (`RateLimitError`, `APIConnectionError`, `BadRequestError`) and message — never the `ANTHROPIC_API_KEY`.
- **T-02-09 (Tampering — GlossaryEnforcer):** `preserveList` is passed as parameter from committed `glossary.json`; no external input can modify the term list.

## Known Stubs

None — all four modules implement their full contracts. No placeholder returns, hardcoded empty arrays flowing to UI, or TODO markers in production paths.

## Threat Flags

None — no new network endpoints or auth paths introduced beyond what is in the plan's threat model.

## Self-Check: PASSED

- `scripts/devto-client.ts` — EXISTS
- `scripts/diff-detector.ts` — EXISTS
- `scripts/glossary-enforcer.ts` — EXISTS
- `scripts/translator.ts` — EXISTS
- Commit `72ad287` — EXISTS (feat: DevToClient)
- Commit `ad5bdfb` — EXISTS (feat: DiffDetector + GlossaryEnforcer)
- Commit `5f916ac` — EXISTS (feat: Translator)
- All 17 tests pass — VERIFIED
