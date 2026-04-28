---
phase: 06-comments-search
plan: "02"
subsystem: ui
tags:
  - pagefind
  - giscus
  - search
  - modal
  - astro
  - tag-chips
dependency_graph:
  requires:
    - phase: 06-comments-search
      plan: "01"
      provides: pagefind-devdep, phase-6-css-foundations, giscus-theme-bridge, comments-embed-component
  provides:
    - search-component
    - search-modal-ctrl-k
    - comments-wired-in-post-layout
    - tag-chips-in-post-header
  affects:
    - src/components/Header.astro
    - src/layouts/PostLayout.astro
    - src/pages/posts/[...slug].astro
    - src/components/Search.astro
    - astro.config.mjs

tech-stack:
  added: []
  patterns:
    - "Dynamic runtime import for pagefind-ui.js — externalized via rollupOptions.external so Rollup skips build-time resolution"
    - "Plain Astro script block (no client: directive) for Search.astro — consistent with ThemeToggle/CopyCode pattern"
    - "Lazy Pagefind initialization on first modal open — only loads pagefind bundle when user opens search"

key-files:
  created:
    - src/components/Search.astro
  modified:
    - src/components/Header.astro
    - src/layouts/PostLayout.astro
    - src/pages/posts/[...slug].astro
    - astro.config.mjs

key-decisions:
  - "rollupOptions.external added for /pagefind/pagefind-ui.js — Rollup cannot resolve the file at build time (only exists after pagefind CLI runs post-build); externalizing is the correct fix per Vite docs"
  - "CommentsEmbed has NO client: directive in PostLayout — is:inline on the Giscus script (from Plan 01) handles lazy loading natively via data-loading=lazy"
  - "tag.toLowerCase() applied at render time for tag chip hrefs — ensures consistent lowercase paths matching getStaticPaths output (Pitfall 5 prevention, T-06-08)"
  - "Search left of ThemeToggle in .nav-actions per D-11 — order: Search → ThemeToggle"

requirements-completed:
  - D-02
  - D-03
  - D-06
  - D-07
  - D-10
  - D-11

duration: 15min
completed: "2026-04-28"
---

# Phase 06 Plan 02: Wave 2 — Search Component + Header + PostLayout Wiring Summary

**Search.astro created with Ctrl+K modal and lazy Pagefind initialization; CommentsEmbed and tag chips wired into PostLayout; Header updated with Search left of ThemeToggle; pnpm build succeeds with dist/pagefind/ populated.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-28T18:00:00Z
- **Completed:** 2026-04-28T18:01:34Z
- **Tasks:** 2
- **Files modified:** 5 (Search.astro created, Header.astro, PostLayout.astro, [slug].astro, astro.config.mjs)

## Accomplishments

- `src/components/Search.astro` created: magnifying-glass icon button, full-viewport modal overlay, Ctrl+K/Cmd+K shortcut, Escape to close, backdrop click to close, lazy Pagefind default-UI initialization on first open, PT-BR copywriting ("Buscar posts...")
- `Header.astro` updated: Search imported and rendered left of ThemeToggle in `.nav-actions` (D-11 satisfied)
- `PostLayout.astro` updated: CommentsEmbed in `.comments-section` with `<h2>Comentários</h2>`, tag chips in article header linking to `/tags/{tag}`, `tags?: string[]` prop added
- `[...slug].astro` updated: `tags={post.data.tags}` passed to PostLayout
- `astro.config.mjs` updated: `rollupOptions.external` added to externalize pagefind runtime (Rule 3 auto-fix)
- `pnpm build` exits 0: 10 pages indexed, `dist/pagefind/pagefind-ui.js` and `pagefind-ui.css` present

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Search.astro** - `833c4b8` (feat)
2. **Task 2: Wire Search into Header + CommentsEmbed + tag chips** - `0a4ccbd` (feat)

## Files Created/Modified

- `src/components/Search.astro` — search icon button + modal overlay + Pagefind lazy initialization (NEW)
- `src/components/Header.astro` — added Search import and `<Search />` left of ThemeToggle
- `src/layouts/PostLayout.astro` — added CommentsEmbed, tags prop, tag chips in article header
- `src/pages/posts/[...slug].astro` — added `tags={post.data.tags}` to PostLayout call
- `astro.config.mjs` — added `build.rollupOptions.external` to externalize pagefind runtime files

## Decisions Made

- **rollupOptions.external for pagefind:** Vite/Rollup errors when it encounters `import('/pagefind/pagefind-ui.js')` because the file doesn't exist at compile time (pagefind CLI generates it post-build). Externalizing tells Rollup to leave the import as-is for runtime resolution. This is the idiomatic fix.
- **CommentsEmbed without client: directive:** Plan specifies no `client:` directive since CommentsEmbed is a plain Astro component using `is:inline` Giscus script with native `data-loading="lazy"`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Externalized pagefind runtime imports in astro.config.mjs**

- **Found during:** Task 2 (pnpm build verification)
- **Issue:** Vite/Rollup failed to resolve `import('/pagefind/pagefind-ui.js')` at build time — the pagefind bundle only exists after `pagefind --site dist` runs (second step of build script). Error: `[vite]: Rollup failed to resolve import "/pagefind/pagefind-ui.js"`
- **Fix:** Added `build.rollupOptions.external: ['/pagefind/pagefind-ui.js', '/pagefind/pagefind.js']` to `astro.config.mjs` so Rollup skips resolution and leaves the dynamic import for browser runtime
- **Files modified:** `astro.config.mjs`
- **Verification:** `pnpm build` exits 0, `dist/pagefind/pagefind-ui.js` present, 10 pages indexed
- **Committed in:** `0a4ccbd` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 3 — blocking build error)
**Impact on plan:** Essential fix — pagefind runtime files cannot exist at compile time by design. No scope creep.

## Issues Encountered

- Vite 7 + Rollup strict resolution: dynamic imports from `/pagefind/` path fail at build time because the pagefind CLI hasn't run yet when `astro build` executes. Resolved by externalizing the paths.

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `data-repo-id="REPLACE_WITH_REPO_ID"` | src/components/CommentsEmbed.astro | 19 | Authorial prerequisite (carried from Plan 01): enable GitHub Discussions + run giscus.app config wizard |
| `data-category-id="REPLACE_WITH_CATEGORY_ID"` | src/components/CommentsEmbed.astro | 21 | Same — requires Discussions category ID from giscus.app |

**Impact:** CommentsEmbed renders the section structure but Giscus iframe will not load until real IDs are substituted. Search and tag chips are fully functional.

## Threat Flags

No new threat surface beyond the plan's `<threat_model>`. All T-06-0x mitigations applied:
- T-06-05 (Spoofing): `role="dialog"` + `aria-modal="true"` + `aria-label="Busca"` on search modal
- T-06-08 (Elevation of Privilege): `tag.toLowerCase()` at render time for consistent lowercase /tags/ paths

## Next Phase Readiness

- Phase 06-03 (Tag Pages) is ready: `/tags/` index and `/tags/[tag].astro` dynamic route can be built now that tag chips link to `/tags/{tag}`
- Authorial prerequisite still pending: substitute `REPLACE_WITH_REPO_ID` and `REPLACE_WITH_CATEGORY_ID` in CommentsEmbed.astro once GitHub Discussions is enabled and giscus.app config wizard is run

---

## Self-Check

Verifying files and commits...

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/components/Search.astro | FOUND |
| src/components/Header.astro (Search import) | FOUND |
| src/layouts/PostLayout.astro (CommentsEmbed + tags) | FOUND |
| src/pages/posts/[...slug].astro (tags prop) | FOUND |
| astro.config.mjs (rollupOptions.external) | FOUND |
| commit 833c4b8 (Task 1) | FOUND |
| commit 0a4ccbd (Task 2) | FOUND |
| dist/pagefind/pagefind-ui.js | FOUND |
| dist/pagefind/pagefind-ui.css | FOUND |

---
*Phase: 06-comments-search*
*Completed: 2026-04-28*
