---
phase: 03-seo-rss-a11y
plan: "02"
subsystem: seo
tags: [rss, sitemap, robots-txt, astrojs-rss, astrojs-sitemap, markdown-it, sanitize-html]

# Dependency graph
requires:
  - phase: 01-bootstrap-fundacoes
    provides: Astro 6 + pnpm scaffold, src/lib/consts.ts with SITE_TITLE/SITE_DESCRIPTION/SITE_URL
  - phase: 03-seo-rss-a11y/03-01
    provides: BaseLayout, PostLayout, content collection with posts schema
provides:
  - "@astrojs/sitemap integration in astro.config.mjs — produces dist/sitemap-index.xml at build"
  - "src/pages/rss.xml.ts — full-content RSS 2.0 feed with pt-BR language tag"
  - "public/robots.txt — User-agent: * / Allow: / / Sitemap: sitemap-index.xml"
  - "@astrojs/rss, markdown-it, sanitize-html, @types/markdown-it, @types/sanitize-html installed"
affects:
  - 03-seo-rss-a11y/03-03
  - 03-seo-rss-a11y/03-04
  - phase-05-first-post

# Tech tracking
tech-stack:
  added:
    - "@astrojs/sitemap@3.7.2 — generates sitemap-index.xml at build"
    - "@astrojs/rss@4.0.18 — RSS 2.0 feed builder"
    - "markdown-it@14.1.1 — renders post.body (raw Markdown) to HTML for RSS content"
    - "sanitize-html@2.17.3 — XSS-sanitizes markdown-it HTML output before embedding in RSS"
    - "@types/markdown-it@14.1.2 — TypeScript type declarations for markdown-it (ESM package)"
    - "@types/sanitize-html@2.16.1 — TypeScript type declarations for sanitize-html"
  patterns:
    - "RSS full-content via post.body + markdown-it.render() + sanitize-html — NOT compiledContent() (unavailable on content collection entries in Astro 6)"
    - "sitemap-index.xml (not sitemap.xml) — @astrojs/sitemap always outputs index format"
    - "RSS draft filter: always-on !data.draft (no PROD exception unlike index.astro)"

key-files:
  created:
    - src/pages/rss.xml.ts
    - public/robots.txt
  modified:
    - astro.config.mjs
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "markdown-it ESM package (@types/markdown-it required) — install both markdown-it and @types/markdown-it for TypeScript correctness"
  - "robots.txt references sitemap-index.xml not sitemap.xml — @astrojs/sitemap v3+ always outputs index format"
  - "RSS always filters drafts (!data.draft with no PROD exception) — feed never exposes draft posts"
  - "sanitize-html allowedTags extends defaults with img — permits image display in RSS readers while blocking XSS"

patterns-established:
  - "Pattern: GET endpoint for RSS uses context.site (Astro passes site: from astro.config.mjs at build)"
  - "Pattern: RSS slug = post.id.replace(/\\.[^.]+$/, '') — same extension-stripping as index.astro card hrefs"

requirements-completed:
  - D-06
  - D-07
  - D-08
  - D-09
  - D-10

# Metrics
duration: 3min
completed: 2026-04-25
---

# Phase 3 Plan 02: RSS Feed + Sitemap + robots.txt Summary

**Full-content RSS 2.0 feed (markdown-it + sanitize-html) with pt-BR language tag, @astrojs/sitemap producing dist/sitemap-index.xml, and public/robots.txt pointing to sitemap-index.xml**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-25T22:09:05Z
- **Completed:** 2026-04-25T22:12:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- All 4 packages installed: `@astrojs/sitemap@3.7.2`, `@astrojs/rss@4.0.18`, `markdown-it@14.1.1`, `sanitize-html@2.17.3` — plus type declarations `@types/markdown-it@14.1.2`, `@types/sanitize-html@2.16.1`
- `astro.config.mjs` updated with `sitemap()` in integrations array via `pnpm astro add sitemap` — `pnpm build` now produces `dist/sitemap-index.xml`
- `src/pages/rss.xml.ts` created: full-content GET endpoint using `getCollection('posts', !draft)`, `markdown-it.render(post.body)`, `sanitize-html`, `customData: '<language>pt-BR</language>'`
- `public/robots.txt` created: `User-agent: *` / `Allow: /` / `Sitemap: https://sertaoseracloud.com/sitemap-index.xml`
- Build verification confirmed: `dist/rss.xml` with `<language>pt-BR</language>`, `dist/sitemap-index.xml`, `dist/robots.txt` with correct sitemap-index reference

## Task Commits

1. **Task 1: Install dependencies + configure sitemap + create robots.txt** - `62f7c30` (feat)
2. **Task 2: Create RSS feed endpoint** - `6d9ac6b` (feat)

**Plan metadata:** (to be added in final commit)

## Files Created/Modified

- `astro.config.mjs` — Added `import sitemap from '@astrojs/sitemap'` and `sitemap()` in integrations array
- `public/robots.txt` — New file: `User-agent: *`, `Allow: /`, `Sitemap: https://sertaoseracloud.com/sitemap-index.xml`
- `src/pages/rss.xml.ts` — New file: RSS 2.0 GET endpoint with full content, pt-BR language tag, draft filter
- `package.json` — Added 4 runtime deps + 3 dev deps
- `pnpm-lock.yaml` — Updated lock file

## Decisions Made

- `@types/markdown-it` was not listed in the plan but is required — `markdown-it` is ESM-only (no `index.js`) and ships without bundled type declarations, causing `ts(7016)` in `rss.xml.ts`. Installed `@types/markdown-it@14.1.2` as part of Task 2 (Rule 3 fix).
- Pre-existing TypeScript errors in `scripts/__tests__/` (pr-builder.test.ts, sync-pipeline.test.ts) are out of scope — they predate this plan and are not caused by any changes in plan 03-02.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed @types/markdown-it to fix ts(7016) in rss.xml.ts**
- **Found during:** Task 2 (Create RSS feed endpoint) — `pnpm astro check` step
- **Issue:** `markdown-it` is an ESM package without bundled TypeScript declarations; importing it without `@types/markdown-it` causes `ts(7016): Could not find a declaration file for module 'markdown-it'`
- **Fix:** `pnpm add -D @types/markdown-it` — installed `@types/markdown-it@14.1.2`
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** Re-ran `pnpm astro check`; no errors in `src/pages/rss.xml.ts`
- **Committed in:** `6d9ac6b` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix required for TypeScript correctness. @types/markdown-it is a necessary companion to markdown-it in strict TypeScript projects. No scope creep.

## Issues Encountered

- `pnpm astro check` exits 1 due to 5 pre-existing TypeScript errors in `scripts/__tests__/` files (Phase 2 artifacts). These are unrelated to plan 03-02 changes and are logged to deferred-items below. The plan's acceptance criteria stated `pnpm astro check` exits 0 specifically for `rss.xml.ts` — that file has no errors.

**Deferred (out of scope):**
- `scripts/__tests__/pr-builder.test.ts` ts(2339): `safeParse` does not exist on type union — pre-existing from Phase 2
- `scripts/__tests__/sync-pipeline.test.ts` ts(2322): 3x `openIssue` mock type mismatch — pre-existing from Phase 2

## User Setup Required

None — no external service configuration required. All build artifacts are generated by `pnpm build`.

## Next Phase Readiness

- RSS feed and sitemap are now wired: `pnpm build` produces `dist/rss.xml` and `dist/sitemap-index.xml`
- `dist/robots.txt` correctly references `sitemap-index.xml`
- Ready for Phase 3 Plan 03 (a11y primitives: skip-link, focus ring, `format-date.ts`, 404 page) and Plan 04 (Lighthouse CI + content.config.ts D-16 superRefine)
- Feed will have actual content once Phase 5 (First Post Shipped) publishes non-draft posts

---
*Phase: 03-seo-rss-a11y*
*Completed: 2026-04-25*
