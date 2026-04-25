---
phase: 02
slug: 02-sync-pipeline
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-25
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| dev machine → npm registry | pnpm install fetches @anthropic-ai/sdk and tsx from public npm | Package manifests + integrity hashes |
| script → Forem API (dev.to) | Outbound HTTPS; unauthenticated for public articles | Article metadata + body_markdown |
| Forem API response → Translator | Untrusted article body sent to Haiku as `role: user` | Article markdown (untrusted input) |
| script → Anthropic API | ANTHROPIC_API_KEY authenticates Haiku translation calls | Article content + translated output |
| Translator → PRBuilder | Translated markdown written to src/content/posts/ | Translated markdown + frontmatter |
| PRBuilder → GitHub REST API | GITHUB_TOKEN authenticates branch/PR/issue creation | Post content + token |
| Windows Task Scheduler → run-sync.ps1 | Scheduled invocation of PowerShell wrapper | ANTHROPIC_API_KEY + GITHUB_TOKEN (user env vars) |
| E2E test → real Anthropic API | First production call with real key; costs real money (~$0.06/article) | Article content |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-02-01 | Tampering | package.json | mitigate | Semver ranges pinned (`^0.91.0`, `^4.21.0`); pnpm lockfile provides integrity hash | closed |
| T-02-02 | Information Disclosure | test files | accept | Test files contain only mock data; no real API keys or secrets committed | closed |
| T-02-03 | Tampering | pr-builder.test.ts schema | mitigate | Test imports live Zod schema from `src/content.config.js`; schema drift causes immediate test failure | closed |
| T-02-04 | Tampering | DevToClient listing response | mitigate | Non-2xx listing throws immediately (WR-02 fix); array assumption at orchestrator via `map()` — non-array throws at iteration | closed |
| T-02-05 | Information Disclosure | Translator SDK errors | mitigate | SDK error handling logs only error type and status code; ANTHROPIC_API_KEY never logged | closed |
| T-02-06 | Tampering (Prompt Injection) | Translator | accept | Article body is `role: user` only; system prompt is repo-committed glossary; Haiku output is markdown; no code execution path; low-value personal blog | closed |
| T-02-07 | Denial of Service (cost) | Translator circuit breaker | mitigate | Circuit breaker enforced in processArticles (D-08, MAX_TRANSLATIONS_PER_RUN=5); implemented in Wave 3 | closed |
| T-02-08 | Spoofing | DevToClient | accept | Forem API for public articles is unauthenticated; no API key to spoof; 404 on non-existent article throws and is caught | closed |
| T-02-09 | Tampering | GlossaryEnforcer | mitigate | preserveList sourced from `.planning/glossary.json` in committed repo; changes require a git commit; no external input path | closed |
| T-02-10 | Information Disclosure | sync-devto.ts env guard | mitigate | ANTHROPIC_API_KEY checked for presence inside `main()` only; value never logged; error messages log key type only | closed |
| T-02-11 | Tampering (Prompt Injection) | Translator via sync-devto.ts | accept | Same as T-02-06; personal blog low-value target | closed |
| T-02-12 | Denial of Service (cost) | sync-devto.ts circuit breaker | mitigate | MAX_TRANSLATIONS_PER_RUN=5 enforced before any Haiku call; `Number()` conversion applied; validated by test | closed |
| T-02-13 | Tampering | PRBuilder file write | mitigate | Writes only to `postsDir/{slug}.md`; slug from Forem API is alphanumeric + hyphens; no path traversal vector | closed |
| T-02-14 | Information Disclosure | PRBuilder GitHub REST | mitigate | GITHUB_TOKEN passed via `Authorization: Bearer` header only; never logged; reviewer failure logs status code only | closed |
| T-02-15 | Spoofing | Cover image download | mitigate | `downloadCoverImage` checks `res.ok` before writing bytes; feature currently inactive (not called from orchestrator) — no active attack surface | closed |
| T-02-16 | Tampering | Frontmatter serialization | mitigate | String fields wrapped in `JSON.stringify` (WR-03 code review fix applied); Astro Zod schema re-validates at build time | closed |
| T-02-17 | Information Disclosure | GITHUB_TOKEN in Windows env | mitigate | User-level env vars only; not in source code; minimal PAT scope (Contents + PRs + Issues) | closed |
| T-02-18 | Information Disclosure | ANTHROPIC_API_KEY in Windows env | mitigate | User-level env vars only; Anthropic $5/month budget alert limits blast radius | closed |
| T-02-19 | Denial of Service (cost) | Weekly Task Scheduler cadence | accept | MAX_TRANSLATIONS_PER_RUN=5 circuit breaker; weekly cadence = 52 runs/year max | closed |
| T-02-20 | Tampering | setup-scheduled-task.ps1 path | mitigate | `$PSScriptRoot` resolves paths dynamically; no hardcoded paths that attacker could redirect | closed |
| T-02-21 | Elevation of Privilege | Task Scheduler registration | accept | No `-RunLevel Highest`; user-level task only; cannot perform admin operations | closed |
| T-02-22 | Denial of Service | Concurrent Task Scheduler runs | mitigate | `MultipleInstances IgnoreNew` prevents a second run while first is active | closed |
| T-02-23 | Information Disclosure | docs/sync-pipeline.md | accept | Runbook documents architecture only; no secrets; repo is public; no sensitive info | closed |
| T-02-24 | Denial of Service (cost) | E2E test run | mitigate | max_translations=5 circuit breaker; $5 budget alert configured (SYNC-09); E2E used 1-2 articles at ~$0.06 each | closed |
| T-02-25 | Tampering | E2E translated post frontmatter | mitigate | Astro Zod schema validates at `pnpm build`; malformed frontmatter causes build failure, not silent corruption | closed |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-01 | T-02-02 | Test files contain only mock data; no secrets; safe to commit | sertaoseracloud | 2026-04-25 |
| AR-02-02 | T-02-06 | Prompt injection via article body: `role: user` only, glossary system prompt is repo-committed, Haiku output is markdown, no code execution path; personal blog is low-value target | sertaoseracloud | 2026-04-25 |
| AR-02-03 | T-02-08 | Forem API unauthenticated for public articles; no API key to spoof; worst case is 404 thrown and caught | sertaoseracloud | 2026-04-25 |
| AR-02-04 | T-02-11 | Same rationale as AR-02-02 (duplicate entry via separate plan) | sertaoseracloud | 2026-04-25 |
| AR-02-05 | T-02-19 | Circuit breaker limits cost; 52 runs/year at $0.06 × 5 articles = ~$15.60/year maximum; $5/month budget alert provides early warning | sertaoseracloud | 2026-04-25 |
| AR-02-06 | T-02-21 | Task registers at user level only; no admin operations in sync script; principle of least privilege satisfied | sertaoseracloud | 2026-04-25 |
| AR-02-07 | T-02-23 | Runbook in public repo documents architecture but contains no secrets; acceptable for an open-source personal blog | sertaoseracloud | 2026-04-25 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-25 | 25 | 25 | 0 | Claude (gsd-security-auditor / orchestrator) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-25
