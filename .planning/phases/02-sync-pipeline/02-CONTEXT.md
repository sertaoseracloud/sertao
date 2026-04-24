# Phase 2: Dev.to Sync Pipeline — Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Automate fetching articles from dev.to via the Forem API, translating EN→PT-BR via Claude Haiku 4.5 with glossary enforcement, and opening PR drafts for editorial review — so that running `pnpm sync:devto` (or the cron in `.github/workflows/sync-devto.yml`) produces a reviewable PR per new or updated article.

**In scope:**
- `scripts/sync-devto.ts` with all pipeline components: DevToClient, DiffDetector, Translator, GlossaryEnforcer, PRBuilder
- `.github/workflows/sync-devto.yml` (cron `0 3 * * *` + `workflow_dispatch`)
- Cover image download to `src/content/posts/images/`
- `docs/sync-pipeline.md` runbook
- End-to-end test with 1 real dev.to article

**Out of scope:**
- Webhook sync (dev.to private beta — v2+)
- Diff-aware update of existing markdown (v2 — MVP overwrites)
- Multi-source beyond dev.to
- `manual_override` conflict resolution (MVP: skip)

</domain>

<decisions>
## Implementation Decisions

### Translation chunking
- **D-01:** Split posts **section-by-section on H2/H3 headings**. Each section is one Haiku call. This balances cost (fewer calls than paragraph-mode), context coherence (each section is a self-contained unit), and retry granularity (only re-translate the failed section on error). Whole-post risks context window overflow on long posts; paragraph-mode is too chatty.

### Re-sync behavior
- **D-02:** On re-sync (changed `source.hash`), **always create a new PR draft**. Do not search for or update existing open PRs. Author closes/merges old PRs manually. Simpler implementation; appropriate for low-frequency edits on a solo blog.
- **D-03:** When `manual_override: true` is set on an existing post, **skip that article entirely**. Log a skip notice (article ID + slug + reason). Do not touch the file. This protects hand-edited posts from being overwritten by the sync pipeline.

### PR body content
- **D-04:** PR description must include **all four** of the following sections:
  1. **Source** — article title + dev.to URL + `synced_at` timestamp
  2. **Translation stats** — sections translated, Haiku model (`claude-haiku-4-5`), token estimate
  3. **Glossary enforcement** — list of `preserve_as_is` terms found/missing in PT-BR output; PASS or WARN badge
  4. **Canonical URL lint** — green ✓ if `canonical_url` on dev.to starts with `https://sertaoseracloud.com/posts/`; ⚠ warning with fix instructions if not
- **D-05:** PR is opened as a **draft** and **assigns the repo author as reviewer** (`sertaoseracloud`). This triggers a GitHub review-request notification, appropriate for a solo blog where the author must always review translations before merge.

### Canonical URL lint
- **D-06:** If the dev.to article is missing a `canonical_url` pointing to `https://sertaoseracloud.com/posts/` — **open a GitHub Issue** with instructions to set the canonical URL in the dev.to article settings, AND **still create the PR draft** (non-blocking). Translation proceeds; SEO fix can happen after the PR merges.
- **D-07:** Canonical URL check: passes if `canonical_url` **starts with `https://sertaoseracloud.com/posts/`**. Does not require an exact slug match — handles minor slug differences between dev.to and the blog (e.g., `hello-world` vs `hello-world-1`).

### Circuit breaker (from ROADMAP — locked)
- **D-08:** `MAX_TRANSLATIONS_PER_RUN=5`. If more than 5 articles would be translated in one run, process the 5 oldest-unsynced and stop. Remaining articles are picked up by the next cron run.

### GlossaryEnforcer (from ROADMAP — locked)
- **D-09:** Hard fail the sync for an individual article if glossary drift is detected (`count_PT < count_EN` for any `preserve_as_is` term). Log the failing terms. Open a GitHub Issue. Do NOT create a PR for that article — a malformed translation must not reach editorial review. Other articles in the same run continue.

### Claude's Discretion
- Exact retry logic for Haiku API errors (3x with exponential backoff is standard)
- Temp file handling during section-by-section assembly
- Exact GitHub Issue body format for canonical lint warnings and glossary failures
- Cover image filename convention (`{slug}.{ext}` is sensible default)
- Whether to use `p-limit` or native Promise.all for concurrent section translations
- Exact PR title format (e.g., `[sync] {article title} (dev.to #{id})`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project constraints & pipeline shape
- `.planning/PROJECT.md` — core value, budget constraints, out-of-scope decisions (no auto-merge, no webhook sync)
- `.planning/ROADMAP.md` §"Phase 2 — Dev.to Sync Pipeline (MVP)" — full success criteria, scope in/out, threat model
- `.planning/research/SUMMARY.md` §"Phase 2" — stack research, pitfall synthesis relevant to the pipeline

### Schema (source of truth for what PRBuilder must write)
- `src/content.config.ts` — Zod schema for `source.*` fields — PRBuilder output MUST match exactly
- `src/content/posts/hello-sertao.md` — example frontmatter shape the sync script must produce

### Glossary & translation
- `.planning/glossary.json` — `preserve_as_is` terms GlossaryEnforcer checks; `version` field for logging
- `.planning/research/PITFALLS.md` Pitfall 15 — translation drift details and mitigation strategy
- `.planning/research/PITFALLS.md` Pitfall 16 — rate limit / exponential backoff requirements
- `.planning/research/PITFALLS.md` Pitfall 17 — cost control / circuit breaker details
- `.planning/research/PITFALLS.md` Pitfall 19 — canonical URL misconfig details (informs D-06/D-07)

### Existing GitHub Actions pattern
- `.github/workflows/deploy.yml` — existing Actions workflow; `sync-devto.yml` should follow the same pnpm/Node setup steps (pnpm/action-setup@v4, setup-node@v4 with cache)

### External authoritative docs
- Forem API — `https://developers.forem.com/api/v1#tag/articles/operation/getArticles` — `GET /api/articles?username=sertaoseracloud` + per-article `body_markdown`
- `peter-evans/create-pull-request@v7` — PR creation action used by PRBuilder
- Anthropic SDK — `@anthropic-ai/sdk` — Haiku 4.5 (`claude-haiku-4-5`) messages API
- `.planning/research/STACK.md` §"Amendment — 2026-04-22" — Claude Haiku SDK specifics

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/content.config.ts` — Zod schema is the spec for PRBuilder output; sync script can import and validate against it in tests
- `src/lib/consts.ts` — `SOCIAL.devto` has the dev.to username (`sertaoseracloud`); `SITE_URL` is the canonical base used in D-07
- `.github/workflows/deploy.yml` — pnpm + Node 22 setup steps to copy verbatim into `sync-devto.yml`
- `.planning/glossary.json` — already exists; Translator reads it as system-prompt context; GlossaryEnforcer reads `preserve_as_is` array

### Established Patterns
- pnpm + Node 22 + TypeScript strict: all scripts under `scripts/` follow the same toolchain as the Astro app
- GitHub Actions secrets pattern: `GITHUB_TOKEN` already used by deploy workflow; `ANTHROPIC_API_KEY` follows the same pattern
- Draft PR via `peter-evans/create-pull-request@v7` is ROADMAP-locked; do not deviate to `gh pr create` CLI

### Integration Points
- **PRBuilder → `src/content/posts/{slug}.md`**: file written by the script; frontmatter must satisfy `src/content.config.ts` Zod schema (validated before commit)
- **PRBuilder → `src/content/posts/images/{slug}.{ext}`**: cover image destination
- **`sync:devto` script → `.github/workflows/sync-devto.yml`**: cron workflow calls `pnpm sync:devto`; same entry point used for local runs
- **Phase 3 → canonical_url**: SEO component in Phase 3 reads `canonical_url` frontmatter; PRBuilder must write it correctly from D-07 logic

</code_context>

<specifics>
## Specific Ideas

- **PR title format:** `[sync] {article title} (dev.to #{id})` — makes sync PRs easy to filter in the PR list
- **Glossary enforcement badge in PR body:** a simple PASS ✓ / WARN ⚠ line with the list of drifted terms underneath — scannable at a glance without reading the full diff
- **GitHub Issue title for canonical lint:** `[canonical] Set canonical_url for "{title}" on dev.to` — consistent naming makes Issues easy to find and close

</specifics>

<deferred>
## Deferred Ideas

- **Script output verbosity flag** (`--verbose` / `--quiet`) — reasonable addition but not discussed; Claude's discretion on default verbosity (summary output by default is sensible)
- **GlossaryEnforcer threshold configuration** — for now hard fail on any drift (D-09); configurable threshold is a v2 concern
- **Dry-run mode** (`--dry-run`) — useful for testing but not scoped in ROADMAP MVP; can be added as a quick flag if the executor sees fit
- **`www.sertaoseracloud.com` canonical handling** — out of scope per Phase 1 deferred ideas; apex-only for now

</deferred>

---

*Phase: 02-sync-pipeline*
*Context gathered: 2026-04-24*
