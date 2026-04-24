---
phase: 01-bootstrap-fundacoes
plan: 02
subsystem: ui
tags: [astro, design-system, tailwindcss, typescript, css-tokens, content-collections]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Astro 6.1.9 scaffold with pnpm, Tailwind v4, MDX, tsconfig.json, package.json"
provides:
  - "Código Chama Azul design system wired into Astro via src/styles/global.css import in BaseLayout"
  - "src/layouts/BaseLayout.astro — HTML shell with lang=pt-BR, FOUC-prevention script, ambient bg, named slots"
  - "src/components/Header.astro — .site-nav navigation with brand, nav-links, aria-current detection"
  - "src/components/Footer.astro — .footer .sig with social links (dev.to, GitHub, RSS)"
  - "src/pages/index.astro — homepage with hero, .cards grid, empty-state for pre-Phase-2"
  - "public/favicon.svg — star motif placeholder (cyan #00FFFF on dark #0A0F1E)"
  - "src/content.config.ts — Zod schema for posts collection (D-14 full schema)"
  - "src/content/posts/hello-sertao.md — mock post with source.* shape for Phase 2"
  - "src/lib/consts.ts — SITE_URL, SITE_TITLE, AUTHOR, SOCIAL exports"
  - "pnpm build succeeds with 1 static page emitted to dist/"
affects: [02-sync-pipeline, 03-seo-rss, 04-typography-darkmode, 05-first-post]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Design system CSS: import global.css in BaseLayout.astro to cascade all tokens to all pages"
    - "Named slots: <slot name='header'/> and <slot name='footer'/> for composable page chrome"
    - "Content collections: src/content.config.ts with defineCollection + Zod schema"
    - "FOUC prevention: is:inline script reads localStorage before first paint"
    - "Empty-state pattern: {collection.length > 0 ? <grid/> : <placeholder/>} for pre-Phase-2"

key-files:
  created:
    - src/layouts/BaseLayout.astro
    - src/components/Header.astro
    - src/components/Footer.astro
    - src/pages/index.astro
    - src/content.config.ts
    - src/content/posts/hello-sertao.md
    - src/lib/consts.ts
    - public/favicon.svg
  modified:
    - .planning/ROADMAP.md

key-decisions:
  - "Content collection Zod schema (D-14) created in this plan rather than deferred — required for getCollection() in index.astro to compile"
  - "Mock post hello-sertao.md has draft:true — filtered out in PROD build; empty-state renders correctly"
  - "Font selection: Space Grotesk / Chakra Petch / JetBrains Mono (from design system) replaces Inter / Fira Code from D-09/D-10 in 01-CONTEXT.md — design file is source of truth"
  - "src/lib/consts.ts created here despite being listed as 01-01 deliverable — was not actually committed in 01-01"

patterns-established:
  - "All pages must import BaseLayout and pass Header/Footer via named slots"
  - "Design tokens accessed via CSS custom properties only (--nucleo-eletrico, --abismo-profundo, etc.) — no raw HEX in components"
  - "Card gradient class derived from first tag (p-arq, p-cloud, etc.)"

requirements-completed: [REQ-1.1, REQ-1.2, REQ-1.4]

# Metrics
duration: 5min
completed: 2026-04-24
---

# Phase 01 Plan 02: Design System Integration — Astro Layout Components Summary

**Código Chama Azul design system wired into Astro BaseLayout/Header/Footer with pnpm build producing dist/index.html (lang=pt-BR, ambient backdrop, hero section, cards grid empty-state)**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-24T05:55:51Z
- **Completed:** 2026-04-24T05:59:12Z
- **Tasks:** 6 (plus 3 auto-fixed supporting files)
- **Files modified:** 9 created, 1 modified

## Accomplishments

- All 6 plan tasks completed: ROADMAP update, BaseLayout, Header, Footer, index.astro, favicon.svg
- `pnpm build` succeeds cleanly — emits `dist/index.html` with `lang="pt-BR"` and Sertão content
- Content collection Zod schema established with full Phase 2 pipeline shape (D-14) — Phase 2 can write posts immediately
- Design system CSS (62 custom properties, Space Grotesk/Chakra Petch/JetBrains Mono fonts) cascades to all pages via BaseLayout import

## Task Commits

Each task was committed atomically:

1. **Task 1: Update ROADMAP Phase 1 scope** - `6e4e93e` (docs)
2. **Task 2: Create BaseLayout.astro** - `60366d8` (feat)
3. **Task 3: Create Header.astro** - `83db42e` (feat)
4. **Task 4: Create Footer.astro** - `49c4383` (feat)
5. **Task 5: Create index.astro homepage** - `0b65738` (feat) — includes supporting files
6. **Task 6: Add favicon.svg placeholder** - `cf34669` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `src/layouts/BaseLayout.astro` — HTML shell: lang=pt-BR, global.css import, FOUC script, ambient div, named slots
- `src/components/Header.astro` — .site-nav navigation with brand logo, Início/Posts/Sobre links, aria-current
- `src/components/Footer.astro` — .footer .sig with "Feito com ☁ por sertaoseracloud", social nav
- `src/pages/index.astro` — hero + .cards grid + empty-state for pre-Phase-2, getCollection('posts')
- `src/content.config.ts` — defineCollection with full Zod schema including source.* fields for Phase 2
- `src/content/posts/hello-sertao.md` — mock post (draft:true) with plausible source.* shape
- `src/lib/consts.ts` — SITE_URL, SITE_TITLE, AUTHOR, SOCIAL exports
- `public/favicon.svg` — star/flame SVG placeholder (#00FFFF on #0A0F1E)
- `.planning/ROADMAP.md` — Phase 1 scope updated to include design system and layout components

## Decisions Made

- **Font divergence from 01-CONTEXT.md:** Design context D-09/D-10 specified Inter + Fira Code, but the actual design system file (`blog-design-system/Blog Design System.html`) uses Space Grotesk + Chakra Petch + JetBrains Mono. The design file is treated as the source of truth per plan objective. A TODO comment in global.css notes the self-hosting requirement for Phase production (Pitfall 6).
- **Content collection schema created here:** Plan 01-01 listed `src/content.config.ts` as a deliverable but it was not actually committed. Created in this plan because index.astro requires it for `getCollection('posts')` to compile.
- **src/lib/consts.ts created here:** Similarly not present from 01-01, created as a supporting file in Task 5.
- **Mock post as draft:true:** Empty-state renders in PROD (expected), mock visible only in dev mode (D-16 filter pattern).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Created src/content.config.ts (D-14 Zod schema)**
- **Found during:** Task 5 (index.astro creation)
- **Issue:** `getCollection('posts', ...)` in index.astro requires a content collection definition to compile. File was listed as a 01-01 deliverable but was not committed. Without it, `pnpm build` fails with "Cannot find collection 'posts'".
- **Fix:** Created `src/content.config.ts` with the full D-14 Zod schema including all `source.*` fields needed by Phase 2 sync pipeline.
- **Files modified:** `src/content.config.ts` (new)
- **Verification:** `pnpm build` completes without errors; content sync log shows "Synced content"
- **Committed in:** `0b65738` (Task 5 commit)

**2. [Rule 2 - Missing Critical] Created src/content/posts/hello-sertao.md (D-15 mock post)**
- **Found during:** Task 5 (build verification)
- **Issue:** Astro emits a console warning "The collection 'posts' does not exist or is empty" during build when no posts exist. While not a build error, having a mock post validates the schema shape end-to-end as specified in D-15.
- **Fix:** Created mock post with `draft: true`, plausible `source.*` frontmatter matching D-14 shape.
- **Files modified:** `src/content/posts/hello-sertao.md` (new)
- **Verification:** Build succeeds; in dev mode the post is visible; in PROD the empty-state renders correctly.
- **Committed in:** `0b65738` (Task 5 commit)

**3. [Rule 2 - Missing Critical] Created src/lib/consts.ts (D-20)**
- **Found during:** Task 5 (plan requirements review)
- **Issue:** `src/lib/consts.ts` was listed as a 01-01 deliverable (D-20) but was not committed in that plan. This file is referenced by the plan interface spec and will be needed by Phase 3 (SEO) and Phase 4.
- **Fix:** Created `consts.ts` with `SITE_URL`, `SITE_TITLE`, `AUTHOR`, `SOCIAL` exports matching D-20 spec.
- **Files modified:** `src/lib/consts.ts` (new)
- **Verification:** File exists, exports match D-20 spec.
- **Committed in:** `0b65738` (Task 5 commit)

---

**Total deviations:** 3 auto-fixed (3 Rule 2 missing critical)
**Impact on plan:** All auto-fixes were required deliverables from D-14, D-15, D-20 that were planned in 01-01 but not executed. No scope creep — these are within the Phase 1 scope boundary.

## Known Stubs

- `public/favicon.svg` — placeholder star/flame SVG; Phase 8 will replace with polished brand mark
- `src/pages/index.astro` hero — static text; posts grid depends on Phase 2 sync pipeline delivering real content
- `src/components/Header.astro` `.nav-actions` — shows "☁ PT-BR" text placeholder; Phase 4 adds dark mode toggle, Phase 7 adds search
- Google Fonts import in `global.css` line 16 — flagged with TODO comment for self-hosting (Pitfall 6); must be resolved before production deploy

## Issues Encountered

- `pnpm build` emits a WARNING: `[esbuild css minify] "file" is not a known CSS property` — this is from Tailwind v4's internal `[file:lines]` utility being minified. It is a known Tailwind v4 + esbuild quirk and does not affect build output or runtime behavior. Logged but out of scope for this plan.

## User Setup Required

None — no external service configuration required for this plan.

## Next Phase Readiness

- Phase 2 (Sync Pipeline): `src/content.config.ts` Zod schema is in place with all `source.*` fields the PRBuilder will write. Phase 2 can write `src/content/posts/{slug}.md` immediately.
- Phase 3 (SEO+RSS): `BaseLayout.astro` has OG meta stubs in `<head>` and canonical URL setup. `src/lib/consts.ts` exports `SITE_URL`. Skip-link and analytics snippet can be added to BaseLayout.
- Phase 4 (Dark mode): `[data-theme='dark']` hook is wired in the FOUC-prevention script. CSS vars in `:root` are ready for dark overrides.
- Phase 5 (First Post): `pnpm build` confirmed working. No blockers from this plan.
- **Pending blocker (pre-existing):** Google Fonts import in `global.css` must be replaced with self-hosted WOFF2 before production deploy (Pitfall 6 mitigation). This predates this plan — tracked in global.css TODO comment.

---
*Phase: 01-bootstrap-fundacoes*
*Completed: 2026-04-24*
