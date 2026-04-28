---
phase: 06-comments-search
plan: "03"
subsystem: ui
tags:
  - astro
  - tag-pages
  - getStaticPaths
  - tag-cloud
  - navigation
  - ssg

dependency_graph:
  requires:
    - phase: 06-comments-search
      plan: "01"
      provides: phase-6-css-foundations (.tag-cloud, .tag--cloud, .tag-count, .tag, .tag-row classes)
    - phase: 06-comments-search
      plan: "02"
      provides: tag-chips-in-post-header (PostLayout wired, tag.toLowerCase() pattern established)
  provides:
    - tag-index-page (/tags/ with sorted tag cloud and post counts)
    - tag-filter-pages (/tags/[tag] dynamic SSG routes per unique tag)
    - tag-chips-as-links (homepage index.astro <a> chips linking to /tags/{tag})
  affects:
    - src/pages/index.astro
    - src/pages/tags/index.astro
    - src/pages/tags/[tag].astro

tech-stack:
  added: []
  patterns:
    - "Map<string, number> + Set<string> per-post dedup for tag aggregation in /tags/ index"
    - "getStaticPaths with tagMap: Map<string, typeof posts> for dynamic tag route generation"
    - ".toLowerCase() applied in THREE places: getStaticPaths param, index.astro href, [tag].astro href (T-06-09)"
    - "Same getCollection draft filter pattern across all tag pages: import.meta.env.PROD ? !data.draft : true"

key-files:
  created:
    - src/pages/tags/index.astro
    - src/pages/tags/[tag].astro
  modified:
    - src/pages/index.astro

key-decisions:
  - "tag.toLowerCase() applied in all three locations (getStaticPaths, index.astro hrefs, [tag].astro hrefs) for URL normalization — Pitfall 5 / T-06-09 prevention"
  - "Set<string> per-post dedup prevents double-counting a tag that appears multiple times in post.data.tags"
  - "card-media prefix uses tags?.[0]?.toLowerCase() ?? 'arq' to avoid p-AWS class mismatch with CSS"
  - "Sort: count descending then a.localeCompare(b) for equal-count alphabetical stability"

requirements-completed:
  - D-12
  - D-13
  - D-14
  - D-15
  - D-16

duration: 2min
completed: "2026-04-28"
---

# Phase 06 Plan 03: Tag Chips, /tags/ Index, and /tags/[tag] Dynamic Routes Summary

**Homepage tag chips converted to `<a>` navigation links, /tags/ index with sorted tag cloud (13 unique tags, post counts), and /tags/[tag].astro generating 13 static tag filter pages — pnpm build 24 pages, dist/pagefind/ populated, all tests green.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-28T21:05:13Z
- **Completed:** 2026-04-28T21:07:12Z
- **Tasks:** 2
- **Files modified:** 3 (index.astro modified, tags/index.astro created, tags/[tag].astro created)

## Accomplishments

- `src/pages/index.astro` tag chips upgraded from `<span class="tag">` to `<a href="/tags/{tag}" class="tag">` with `.toLowerCase()` on href and display text; slice increased 2→3 (D-12)
- `src/pages/tags/index.astro` created: aggregates all unique lowercase tags using Map+Set dedup, sorted by count desc then alpha, renders `.tag-cloud` with `.tag-count` post counts (D-13)
- `src/pages/tags/[tag].astro` created: `getStaticPaths` generates 13 static paths from real post content, posts sorted newest-first, markup mirrors index.astro for visual consistency (D-14)
- Tag normalization (`.toLowerCase()`) applied in all three locations (T-06-09 / Pitfall 5 mitigated)
- Draft filter applied in both new pages: `import.meta.env.PROD ? !data.draft : true` (T-06-10 mitigated)
- `pnpm build` exits 0: 24 pages generated, 13 tag directories in dist/tags/
- `pnpm test:sync`: 31/31 pass (Phase 2 suite unaffected)
- Pagefind indexed 24 pages, 2180 words, dist/pagefind/pagefind.js + pagefind-ui.js + pagefind-ui.css present

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert index.astro tag chips + create /tags/ index page** - `fd055df` (feat)
2. **Task 2: Create /tags/[tag].astro + final build verification** - `4b0f7f8` (feat)

**Plan metadata:** committed in final docs commit.

## Files Created/Modified

- `src/pages/index.astro` — tag chip `<span>` → `<a href="/tags/{tag}">` with .toLowerCase(), slice 2→3
- `src/pages/tags/index.astro` — /tags/ index: Map+Set aggregation, sorted tag cloud, pt-BR copywriting
- `src/pages/tags/[tag].astro` — /tags/[tag] dynamic route: getStaticPaths with tagMap, post cards identical to index.astro

## Decisions Made

- **Triple normalization (T-06-09):** `.toLowerCase()` applied in (1) `getStaticPaths` param generation, (2) `index.astro` chip hrefs, (3) `[tag].astro` chip hrefs. Without this, a tag "AWS" in frontmatter generates `/tags/aws` path but chip links to `/tags/AWS` → 404.
- **Per-post Set dedup:** A post listing the same tag twice would inflate counts without the `seen` Set. Added for correctness.
- **card-media normalization:** `tags?.[0]?.toLowerCase() ?? 'arq'` prevents `p-AWS` class (no CSS match) — consistent with index.astro pattern.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — build succeeded on first attempt, all 13 tag directories generated correctly.

## User Setup Required

None — no external service configuration required for this plan. (The Giscus stub issue from Plan 01/02 is carried forward separately.)

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `data-repo-id="REPLACE_WITH_REPO_ID"` | src/components/CommentsEmbed.astro | 19 | Carried from Plan 01 — requires GitHub Discussions setup |
| `data-category-id="REPLACE_WITH_CATEGORY_ID"` | src/components/CommentsEmbed.astro | 21 | Same — no blocking impact on tag pages (different feature) |

## Threat Flags

No new threat surface beyond the plan's `<threat_model>`. All mitigations applied:
- T-06-09 (Tampering / case mismatch): `.toLowerCase()` in all three tag URL locations
- T-06-10 (Info Disclosure / draft posts): draft filter in both `tags/index.astro` and `tags/[tag].astro`
- T-06-11 (DoS / empty tag pages): posts with `tags: []` silently skipped — no empty pages generated
- T-06-12 (Spoofing / SEO canonical): BaseLayout handles canonical automatically

## Next Phase Readiness

Phase 6 is complete:
- Readers can comment via GitHub identity (Giscus — pending authorial Discussions setup)
- Search posts by free text (Pagefind Ctrl+K modal — fully functional)
- Browse posts by tag (/tags/ cloud + /tags/{tag} filter pages — fully functional)

Authorial action still pending (carried from Plan 01): enable GitHub Discussions, create "Comments" category, run giscus.app wizard, substitute placeholders in CommentsEmbed.astro.

---

## Self-Check

| Item | Status |
|------|--------|
| src/pages/index.astro (tag chips as `<a>`) | FOUND |
| src/pages/tags/index.astro | FOUND |
| src/pages/tags/[tag].astro | FOUND |
| commit fd055df (Task 1) | FOUND |
| commit 4b0f7f8 (Task 2) | FOUND |
| dist/tags/index.html | FOUND |
| dist/tags/ subdirectories (13 tags) | FOUND |
| dist/pagefind/pagefind.js | FOUND |
| dist/pagefind/pagefind-ui.js | FOUND |
| dist/pagefind/pagefind-ui.css | FOUND |
| pnpm test:sync 31/31 pass | VERIFIED |

## Self-Check: PASSED

---
*Phase: 06-comments-search*
*Completed: 2026-04-28*
