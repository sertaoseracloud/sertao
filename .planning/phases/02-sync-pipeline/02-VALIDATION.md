---
phase: 2
slug: sync-pipeline
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-24
updated: 2026-05-04
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` (no install — available in Node 22+) |
| **Config file** | none — uses `node --test` runner |
| **Quick run command** | `pnpm test:sync` |
| **Full suite command** | `pnpm test:sync` |
| **Estimated runtime** | ~5 seconds (unit tests with mocked API clients) |
| **Node version** | ≥22.12.0 (Node 24 tested; native TypeScript stripping) |

**Note:** `pnpm test:sync` uses bare `node --test` (no tsx loader). Node 24+ strips TypeScript natively. If running Node 22.12, add `--experimental-strip-types` flag — but NOT `--import tsx/esm` as it breaks `astro/zod` imports in `pr-builder.test.ts`.

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:sync`
- **After every plan wave:** Run `pnpm test:sync`
- **Before `/gsd-verify-work`:** Full suite must be green + E2E manual run by author
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| DevToClient listing | 02-02 | 2 | REQ-01 | Pitfall A | Never read body_markdown from listing | unit (mock fetch) | `pnpm test:sync` | ✅ | ✅ green |
| DevToClient per-article | 02-02 | 2 | REQ-02 | Pitfall A | Two-step fetch always used | unit (mock fetch) | `pnpm test:sync` | ✅ | ✅ green |
| DiffDetector hash match | 02-02 | 2 | REQ-03 | Pitfall C | Same content → same hash | unit | `pnpm test:sync` | ✅ | ✅ green |
| DiffDetector whitespace normalize | 02-02 | 2 | REQ-04 | Pitfall C | CRLF/trailing space → same hash | unit | `pnpm test:sync` | ✅ | ✅ green |
| Translator section split | 02-02 | 2 | REQ-05 | — | H2/H3 boundaries create sections | unit | `pnpm test:sync` | ✅ | ✅ green |
| Translator section assemble | 02-02 | 2 | REQ-06 | — | Sections re-joined after translation | unit (mock Anthropic) | `pnpm test:sync` | ✅ | ✅ green |
| GlossaryEnforcer drift detect | 02-02 | 2 | REQ-07 | D-09 / Pitfall D | count_PT < count_EN → fail | unit | `pnpm test:sync` | ✅ | ✅ green |
| GlossaryEnforcer pass | 02-02 | 2 | REQ-08 | D-09 | count_PT >= count_EN → pass | unit | `pnpm test:sync` | ✅ | ✅ green |
| PRBuilder frontmatter | 02-03 | 3 | REQ-09 | V5 input validation | Zod schema validates output | unit | `pnpm test:sync` | ✅ | ✅ green |
| Canonical lint check | 02-03 | 3 | REQ-11 | D-06/D-07 | Non-blocking; GH Issue opened | unit | `pnpm test:sync` | ✅ | ✅ green |
| manual_override skip | 02-03/02-01 | 3 | REQ-12 | D-03 | Article skipped entirely | unit | `pnpm test:sync` | ✅ | ✅ green |
| Circuit breaker | 02-01/02-03 | 1/3 | REQ-10 | D-08 / Pitfall 17 | Stop after MAX_TRANSLATIONS_PER_RUN=5 | unit | `pnpm test:sync` | ✅ | ✅ green |
| E2E: real dev.to article → PR | 02-05 | final | REQ-E2E | — | Draft PR created with translation | e2e (manual) | `pnpm sync:devto` (author runs) | manual gate | ✅ approved |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `pnpm add -D @anthropic-ai/sdk tsx` — installed (SUMMARY 02-01)
- [x] `scripts/__tests__/devto-client.test.ts` — covers REQ-01, REQ-02 (3/3 pass)
- [x] `scripts/__tests__/diff-detector.test.ts` — covers REQ-03, REQ-04 (4/4 pass)
- [x] `scripts/__tests__/translator.test.ts` — covers REQ-05, REQ-06 (5/5 pass)
- [x] `scripts/__tests__/glossary-enforcer.test.ts` — covers REQ-07, REQ-08 (5/5 pass)
- [x] `scripts/__tests__/pr-builder.test.ts` — covers REQ-09, REQ-11, REQ-12 (7/7 pass)
- [x] `scripts/__tests__/sync-pipeline.test.ts` — covers REQ-10 (3/3 pass)
- [x] `package.json` `"test:sync"` script wired to `node --test 'scripts/__tests__/**/*.test.ts'`

**Total: pass: 27, fail: 0** (verified 2026-04-25)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Status |
|----------|-------------|------------|--------|
| One real dev.to article → draft PR with translated markdown | REQ-E2E (ROADMAP success criteria) | Requires live Forem API, ANTHROPIC_API_KEY secret, GitHub Actions permissions — cannot mock | ✅ approved 2026-04-25 (SYNC-11) |
| Reviewer assignment (`sertaoseracloud`) appears on PR | D-05 | Depends on GITHUB_TOKEN permissions | ✅ documented in runbook (docs/sync-pipeline.md Pitfall B) |
| Budget alert confirmed at $5/mo on Anthropic console | Pitfall 17 | External console configuration — authorial action | pending (authorial action required) |

---

## Validation Audit 2026-04-25

| Metric | Count |
|--------|-------|
| Requirements total | 13 |
| COVERED (automated) | 12 |
| COVERED (manual gate approved) | 1 (REQ-E2E) |
| MISSING | 0 |
| PARTIAL | 0 |
| Gaps resolved during audit | 1 (WR-04 regression: reverted tsx/esm loader that broke astro/zod imports) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** verified 2026-04-25

---

## Validation Audit 2026-05-04

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Suite result | 31/31 pass (Node 24.14.1, `pnpm test:sync`) |
| Status | NYQUIST-COMPLIANT — no gaps, all tests green |
