# Phase 5: First Post Shipped (GATE) - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

MARCO CRÍTICO: First real dev.to article is synchronized, reviewed, merged, published, indexed on Google, and shareable. Closes ship v1.0.

**What this phase delivers:** End-to-end validation that the entire pipeline (sync → translation → PR → merge → deploy → SEO → social sharing) works with real content on the live domain.

**What it does NOT deliver:** Any new features — this is purely a verification + authorial gate. Any code changes are strictly bug fixes to the existing pipeline.

**Key fact:** GitHub Pages is already enabled and DNS is configured. sertaoseracloud.com is live and resolving. The Phase 1 authorial blocker is cleared.

</domain>

<decisions>
## Implementation Decisions

### GitHub Pages + DNS Status
- **D-01:** GitHub Pages is **already enabled** (Settings → Pages → GitHub Actions source). DNS A records for sertaoseracloud.com are **already configured** and HTTPS is resolving. The Phase 1 authorial blocker is cleared — no waiting checkpoint needed in the plan.
- **D-02:** The deploy workflow (`.github/workflows/deploy.yml`) is already wired and has been triggering on push to `main` since Phase 1. First real post deployment will happen automatically when a translated post PR is merged to `main`.

### First Post Selection
- **D-03:** Any of the already-synced articles in `src/content/posts/` can serve as the first deployed post — the user will choose which specific article's dev.to canonical_url to configure. The 5 existing synced posts are candidates. The plan should document what the author must do on the dev.to side (set `canonical_url` in the article's frontmatter) before running the sync pipeline.
- **D-04:** `hello-sertao.md` (the mock post, `draft: false`, currently live) serves as the visible placeholder until the first real post is merged. It does NOT need to be hidden — it demonstrates the platform is working.

### Sync Pipeline Execution
- **D-05:** First sync will be triggered manually via `workflow_dispatch` (not cron) for maximum control. The author runs the GitHub Actions `sync-devto.yml` workflow manually after adding `canonical_url` to the chosen dev.to article.
- **D-06:** The PR draft opened by the sync pipeline will be reviewed by the author before merging. Review process: check translation quality, verify no glossary terms drifted, optionally correct 0-N terms.

### Lighthouse Threshold
- **D-07:** Lighthouse mobile threshold for Phase 5: **≥90 on all scores** (Performance, A11y, Best Practices, SEO). Keep at 90 — not raised to 95. Rationale: ship v1.0 first; Phase 9 a11y refinements may push to 95.
- **D-08:** The existing CI gate in `lighthouserc.json` + `deploy.yml` is **sufficient** for Phase 5 verification. No separate manual Lighthouse run is needed. The CI step runs automatically after every push to main.

### Post-Mortem + Glossary
- **D-09:** Post-mortem is **lightweight** — no formal doc. After the first PR is reviewed and merged, record any surprises, translation issues, and process notes in STATE.md decisions section.
- **D-10:** If editorial corrections are discovered during PR review (mistranslated terms, etc.), **commit them to `glossary.json` directly in Phase 5** (as `preserve_as_is` entries) before merging the PR. Don't defer glossary updates — fix immediately so all future syncs benefit.
- **D-11:** Glossary update format: add to `.planning/glossary.json` `preserve_as_is` array. Each corrected term should be added with the exact PT-BR form to preserve (e.g., if "Service Bus" was being translated, add "Service Bus" to the list).

### Verification Approach
- **D-12:** Phase 5 verification is largely authorial (run pipeline, review PR, check live URL). The plan should produce an actionable checklist for the author — not automated code. Automated checks: `pnpm build` passes, `dist/` contains post HTML, Lighthouse CI gate on deploy.
- **D-13:** SEO signal verification: after deploy, author manually checks view-source on the live post URL to confirm `<link rel="canonical">`, JSON-LD BlogPosting, OG tags are present. Rich Results Test (https://search.google.com/test/rich-results) is used to validate JSON-LD.
- **D-14:** Google Search Console: author submits the sitemap URL (`https://sertaoseracloud.com/sitemap-index.xml`) to Search Console after first deploy. GSC verification is a manual process (HTML tag method or DNS record) — the plan documents the steps but execution is authorial.
- **D-15:** Social sharing OG test: share the live post URL to LinkedIn/X/WhatsApp to verify OG card renders correctly. Alternatively, use LinkedIn Post Inspector or X Card Validator.

### Claude's Discretion
- Exact article chosen for first post (author decides based on personal preference)
- Whether to add `draft: true` back to `hello-sertao.md` after first real post is live (or keep it as supplementary content)
- Whether to run a sync for all existing synced articles or just the first chosen one
- Exact wording of STATE.md post-mortem notes

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pipeline and sync
- `.planning/ROADMAP.md` §"Phase 5 — First Post Shipped (GATE)" — exact success criteria and scope boundaries
- `docs/sync-pipeline.md` — runbook for the sync pipeline; failure modes and how to recover
- `.planning/glossary.json` — translation glossary; updated during Phase 5 review
- `scripts/sync-devto.ts` — sync entry point (for reference if pipeline debugging needed)

### Deployment and CI
- `.github/workflows/deploy.yml` — deploy workflow; Lighthouse CI step is lines 56-65
- `.github/workflows/sync-devto.yml` — sync trigger workflow (workflow_dispatch only)
- `lighthouserc.json` — Lighthouse CI config (A11y ≥0.9 error, Perf ≥0.9 warn, CLS ≤0.1 warn)

### SEO verification
- `src/components/SEO.astro` — SEO component; emits canonical, OG, Twitter Card, JSON-LD
- `src/content.config.ts` — Zod schema; `canonical_url` field is how the blog side declares canonical

### Prior phase decisions
- `.planning/phases/02-sync-pipeline/02-CONTEXT.md` — D-22: `manual_override` flag; D-23: circuit breaker MAX_TRANSLATIONS_PER_RUN=5
- `.planning/phases/03-seo-rss-a11y/03-CONTEXT.md` — D-19: canonical URL is `sertaoseracloud.com/posts/{slug}` format

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.github/workflows/sync-devto.yml` with `workflow_dispatch` — already wired for manual first run
- `docs/sync-pipeline.md` — runbook documents failure modes and recovery steps
- `.planning/glossary.json` — already has preserve_as_is terms from Phase 2; Phase 5 adds to this list

### Established Patterns
- The sync pipeline PR output goes to `src/content/posts/{slug}.md` with frontmatter including `canonical_url`, `source.*`, `draft: false`
- The Zod schema in `content.config.ts` validates `canonical_url: z.string().url().optional()` — PRBuilder sets this from the dev.to article metadata
- Lighthouse CI is automated: no manual trigger needed after push to main

### Integration Points
- Author adds `canonical_url: https://sertaoseracloud.com/posts/{slug}` to the dev.to article → sync pipeline reads it → PRBuilder writes it to the post frontmatter → SEO.astro renders `<link rel="canonical">`
- `glossary.json` is inlined into the Translator system prompt — updating it before the first sync ensures the corrected terms apply immediately

</code_context>

<specifics>
## Specific Ideas

- The "First Post Shipped" gate should feel ceremonial — it's the culmination of all 4 phases. The STATE.md post-mortem note should capture the date and which article was chosen.
- If the Lighthouse CI fails after the first real post deploy (e.g., a cover image causes CLS issues), the fix belongs in this phase before calling it "shipped."
- Google Search Console verification can be done via HTML file upload to `public/` or DNS TXT record — HTML file is simpler since the repo already deploys to GH Pages.

</specifics>

<deferred>
## Deferred Ideas

- Raise Lighthouse A11y gate to 95 — deferred to Phase 9 (after a11y refinements)
- Formal post-mortem document (`docs/post-mortem-v1.md`) — lightweight STATE.md notes are sufficient for v1.0
- Running sync for all existing articles as a batch — Phase 5 syncs just the first chosen article; batch sync for others is normal cron operation
- Comments, newsletter, search, OG dynamic — Phases 6-9

</deferred>

---

*Phase: 05-first-post-shipped*
*Context gathered: 2026-04-27*
