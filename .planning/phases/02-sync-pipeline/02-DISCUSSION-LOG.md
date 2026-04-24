# Phase 2: Dev.to Sync Pipeline — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 02-sync-pipeline
**Areas discussed:** Re-sync behavior, PR body content, Translation chunking, Canonical URL lint

---

## Re-sync behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Always new PR draft | Each re-sync opens a fresh draft PR; author closes old ones manually | ✓ |
| Replace existing open PR | Push a new commit to an existing open PR for that slug | |
| Overwrite file, no new PR | Update file but leave existing PR unchanged | |

**User's choice:** Always new PR draft
**Notes:** Simpler implementation; appropriate for low-frequency edits on a solo blog.

---

## manual_override behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Skip entirely | Don't touch the file; log a skip notice | ✓ |
| Sync frontmatter only | Update source.hash/synced_at but leave body untouched | |
| Warn and overwrite | Proceed with sync, log loud warning; clobber visible in PR diff | |

**User's choice:** Skip entirely
**Notes:** Protects hand-edited posts from being clobbered by the pipeline.

---

## PR body content

| Option | Description | Selected |
|--------|-------------|----------|
| Source link + title | Article title, dev.to URL, synced_at timestamp | ✓ |
| Translation stats | Sections translated, model used, token estimate | ✓ |
| Glossary enforcement result | preserve_as_is terms found/missing, PASS/WARN badge | ✓ |
| Canonical URL lint status | ✓ or ⚠ with fix instructions | ✓ |

**User's choice:** All four sections
**Notes:** Full editorial context in every PR — no need to cross-reference other tools.

---

## PR reviewer assignment

| Option | Description | Selected |
|--------|-------------|----------|
| Draft only, no reviewer | No review request; author checks PR list when ready | |
| Assign author as reviewer | Request review from repo owner; triggers GitHub notification | ✓ |

**User's choice:** Assign author as reviewer
**Notes:** Solo blog; every translation needs author review before merge.

---

## Translation chunking

| Option | Description | Selected |
|--------|-------------|----------|
| Section-by-section on H2/H3 | One Haiku call per heading section | ✓ |
| Paragraph-by-paragraph | One Haiku call per paragraph; max retry granularity | |
| Whole post in one call | Single Haiku call per article; simplest but overflow risk | |

**User's choice:** Section-by-section on H2/H3
**Notes:** Balanced cost and coherence. Retry only the failed section.

---

## Canonical URL lint action

| Option | Description | Selected |
|--------|-------------|----------|
| Open GitHub Issue + still create PR | Non-blocking; lint visible in both Issue and PR body | ✓ |
| Block sync entirely until fixed | Skip article until dev.to canonical_url is set | |
| Warn in PR body only | No Issue; warning inside PR description only | |

**User's choice:** Open GitHub Issue + still create PR
**Notes:** Non-blocking is pragmatic — author can fix canonical_url after the PR is merged.

---

## Canonical URL match strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Domain + /posts/ prefix | Passes if starts with https://sertaoseracloud.com/posts/ | ✓ |
| Exact URL match | Must exactly equal https://sertaoseracloud.com/posts/{slug} | |

**User's choice:** Domain + /posts/ prefix
**Notes:** Tolerates minor slug differences between dev.to and blog.

---

## Claude's Discretion

- Retry logic for Haiku API errors
- Temp file handling during section assembly
- GitHub Issue/PR body exact format
- Cover image filename convention
- Concurrency strategy for section translations
- PR title format
- Script default output verbosity

## Deferred Ideas

- `--verbose` / `--quiet` output flags
- GlossaryEnforcer configurable threshold (v2)
- `--dry-run` mode
