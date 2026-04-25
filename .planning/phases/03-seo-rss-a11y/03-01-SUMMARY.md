---
phase: 03-seo-rss-a11y
plan: 01
subsystem: seo
tags: [seo, meta-tags, og, twitter-card, json-ld, post-route, layout]
one_liner: "SEO.astro head component with OG/Twitter Card/JSON-LD + PostLayout + dynamic [slug] route replacing inline BaseLayout OG block"

dependency_graph:
  requires: []
  provides:
    - src/components/SEO.astro
    - src/layouts/PostLayout.astro
    - src/pages/posts/[...slug].astro
  affects:
    - src/layouts/BaseLayout.astro

tech_stack:
  added: []
  patterns:
    - "SEO as isolated head component (no html/body — emits only meta/link/script tags)"
    - "JSON-LD BlogPosting via JSON.stringify + set:html for XSS-safe injection"
    - "getStaticPaths + render pattern for dynamic content routes"
    - "inline date formatting (toLocaleDateString pt-BR) instead of external util"
    - "canonicalUrl prop on BaseLayout for explicit override of Astro.url.pathname"

key_files:
  created:
    - src/components/SEO.astro
    - src/layouts/PostLayout.astro
    - src/pages/posts/[...slug].astro
  modified:
    - src/layouts/BaseLayout.astro

decisions:
  - "Inline date formatting in PostLayout (toLocaleDateString pt-BR) instead of importing format-date util — avoids cross-plan dependency; format-date will be created in Plan 03-03"
  - "canonicalUrl prop added to BaseLayout (not in original plan) so explicit canonical_url from post frontmatter flows through PostLayout to SEO component"
  - "Added is:inline to JSON-LD script tag to silence Astro 4000 hint about processed scripts"

metrics:
  duration: "~6 minutes"
  completed_date: "2026-04-25"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 03 Plan 01: SEO Component + PostLayout + [slug] Route Summary

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create SEO.astro component | 31d643f | src/components/SEO.astro |
| 2 | Update BaseLayout + PostLayout + [slug] route | 26c56b9 | src/layouts/BaseLayout.astro, src/layouts/PostLayout.astro, src/pages/posts/[...slug].astro |

## What Was Built

**SEO.astro** (`src/components/SEO.astro`): Head-only component emitting all SEO signals:
- `<title>` following `{title} · O Sertão será Cloud` pattern
- `<meta name="description">` truncated to 155 chars with ellipsis
- `<link rel="canonical">` — uses passed `canonicalUrl` or computes from `Astro.url.pathname`
- Full OG block: og:type, og:url, og:title, og:description, og:locale (pt_BR), og:image (conditional)
- Article OG time tags: og:article:published_time, og:article:modified_time (conditional)
- Twitter Card: summary_large_image when image present, summary otherwise; twitter:site + twitter:creator (@sertaoseracloud)
- JSON-LD BlogPosting block (article type only): headline, description, author, publisher, datePublished, dateModified, mainEntityOfPage, inLanguage pt-BR

**BaseLayout.astro** updated:
- Replaced inline OG block (lines 29-41) with `<SEO>` component
- Added `canonicalUrl` optional prop for explicit override
- Added `<link rel="alternate" type="application/rss+xml">` RSS feed link
- Removed `SITE_TITLE` import (no longer needed — used by SEO.astro internally)

**PostLayout.astro** (`src/layouts/PostLayout.astro`): Article layout wrapping BaseLayout:
- Post header: Chakra Petch date label, H1 title, JetBrains Mono updated notice
- `.stage > article.prose` structure matching design system classes
- Inline date formatting (pt-BR long style) — no external dependency

**[...slug].astro** (`src/pages/posts/[...slug].astro`): Dynamic route:
- `getStaticPaths` with draft filter (PROD hides drafts, dev shows all)
- `post.id.replace(/\.[^.]+$/, '')` slug stripping
- `const { Content } = await render(post)` content rendering

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Functionality] canonicalUrl flow from PostLayout to BaseLayout**
- **Found during:** Task 2
- **Issue:** PostLayout accepted `canonicalUrl` prop but BaseLayout had no mechanism to pass it through to SEO.astro — explicit `canonical_url` from post frontmatter would be silently dropped
- **Fix:** Added `canonicalUrl` optional prop to BaseLayout; updated canonical URL computation to use it when provided; PostLayout passes `{canonicalUrl}` to BaseLayout
- **Files modified:** src/layouts/BaseLayout.astro, src/layouts/PostLayout.astro
- **Commit:** 26c56b9

**2. [Rule 1 - Minor] is:inline on JSON-LD script tag**
- **Found during:** Task 1 (pnpm astro check hint)
- **Issue:** Astro 4000 hint — script with attributes treated as inline without explicit is:inline directive
- **Fix:** Added `is:inline` to the JSON-LD script tag
- **Files modified:** src/components/SEO.astro
- **Commit:** 31d643f

## Known Stubs

None — all data flows are wired. Post `coverImageUrl` field is not yet in the schema (added in Plan 04); `[...slug].astro` uses `(post.data as any).coverImageUrl ?? undefined` as a temporary cast. This is documented in the plan as intentional, not a stub.

## Pre-existing Failures

`pnpm astro check` reports 36 errors — all in `scripts/` directory (node type declarations missing: `node:crypto`, `node:fs/promises`, `Buffer`, `process`). These are pre-existing from Phase 2 and unrelated to this plan. No errors in any `src/` file.

## Self-Check: PASSED

- FOUND: src/components/SEO.astro
- FOUND: src/layouts/PostLayout.astro
- FOUND: src/pages/posts/[...slug].astro
- FOUND: .planning/phases/03-seo-rss-a11y/03-01-SUMMARY.md
- FOUND commit 31d643f: feat(03-01): create SEO.astro component
- FOUND commit 26c56b9: feat(03-01): update BaseLayout + create PostLayout + [slug] route
