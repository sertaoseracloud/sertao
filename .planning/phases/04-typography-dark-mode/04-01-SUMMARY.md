---
phase: 04-typography-dark-mode
plan: 01
subsystem: ui
tags: [fonts, woff2, tailwindcss-typography, dark-mode, fouc, self-hosted-fonts, fontsource]

# Dependency graph
requires:
  - phase: 03-seo-rss-a11y
    provides: BaseLayout.astro shell, global.css design tokens, .prettierignore with public/fonts/ exclusion
provides:
  - Self-hosted WOFF2 fonts in public/fonts/ (Space Grotesk, Chakra Petch, JetBrains Mono)
  - @font-face declarations in global.css replacing Google Fonts CDN
  - "[data-theme=light] token block in global.css for branded light theme"
  - "@tailwindcss/typography @plugin directive in global.css"
  - Font preload link for space-grotesk-400.woff2 in BaseLayout.astro
  - Extended FOUC script with prefers-color-scheme fallback in BaseLayout.astro
affects:
  - 04-02 (ThemeToggle component depends on [data-theme] attribute + [data-theme=light] tokens)
  - 04-03 (CopyCode performance gate depends on self-hosted fonts and typography plugin baseline)
  - 05-first-post-shipped (Google Fonts CDN blocker resolved — previously tracked in STATE.md)

# Tech tracking
tech-stack:
  added:
    - "@fontsource/space-grotesk ^5.2.10 (devDep — WOFF2 source files only)"
    - "@fontsource/chakra-petch ^5.2.7 (devDep — WOFF2 source files only)"
    - "@fontsource/jetbrains-mono ^5.2.8 (devDep — WOFF2 source files only)"
    - "@tailwindcss/typography ^0.5.19 (devDep — @plugin directive in global.css)"
  patterns:
    - "Fontsource devDeps used as WOFF2 source files only — no CSS imports; all font declarations are manual @font-face"
    - "font-display: swap on all 9 @font-face blocks — FOUT graceful fallback; preload prevents body text FOUT"
    - "FOUC prevention: is:inline script reads localStorage first, falls back to prefers-color-scheme, dark is CSS default"
    - "@tailwindcss/typography @plugin placed before .prose class rules to establish plugin baseline"

key-files:
  created:
    - public/fonts/space-grotesk-400.woff2
    - public/fonts/space-grotesk-500.woff2
    - public/fonts/space-grotesk-600.woff2
    - public/fonts/chakra-petch-400.woff2
    - public/fonts/chakra-petch-500.woff2
    - public/fonts/chakra-petch-600.woff2
    - public/fonts/chakra-petch-700.woff2
    - public/fonts/jetbrains-mono-400.woff2
    - public/fonts/jetbrains-mono-400-italic.woff2
  modified:
    - package.json (4 new devDependencies)
    - src/styles/global.css (Google Fonts removed; 9 @font-face added; @plugin added; [data-theme=light] block added)
    - src/layouts/BaseLayout.astro (font preload link; extended FOUC script)

key-decisions:
  - "Fontsource packages are devDeps only — no CSS imports, just WOFF2 binary source; all declarations are manual @font-face blocks with explicit unicode-range for PT-BR Latin coverage"
  - "Only space-grotesk-400.woff2 is preloaded — critical-path body font; other weights/families load async via font-display: swap (acceptable FOUT tradeoff per T-04-03)"
  - "Dark mode is CSS default (no data-theme attribute needed); FOUC script only sets attribute for stored value or light system preference"
  - "pre-existing pnpm astro check errors in scripts/__tests__/sync-pipeline.test.ts (openIssue type mismatch) are out of scope for this plan — deferred to deferred-items"

patterns-established:
  - "Self-hosted font pattern: Fontsource devDep → copy WOFF2 to public/fonts/ → manual @font-face in global.css"
  - "Light theme override pattern: [data-theme=light] block placed between :root block end and 03b aliases section in global.css"
  - "Theme init pattern: is:inline FOUC script checks localStorage then prefers-color-scheme; dark requires no attribute"

requirements-completed:
  - D-01
  - D-02
  - D-03
  - D-04
  - D-05
  - D-06
  - D-07
  - D-08
  - D-11
  - D-12
  - D-18

# Metrics
duration: 5min
completed: 2026-04-27
---

# Phase 04 Plan 01: Font Self-Hosting + Light Theme + Typography Plugin Summary

**Nine WOFF2 fonts self-hosted from Fontsource, Google Fonts CDN eliminated, branded [data-theme=light] token block and @tailwindcss/typography plugin added, FOUC script extended with prefers-color-scheme fallback**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-27T21:11:17Z
- **Completed:** 2026-04-27T21:15:27Z
- **Tasks:** 3
- **Files modified:** 12 (9 WOFF2 binaries + package.json + global.css + BaseLayout.astro)

## Accomplishments
- Closed the Google Fonts CDN blocker tracked in STATE.md — zero `fonts.googleapis.com` references in `pnpm build` dist/ output
- Self-hosted 9 WOFF2 files for Space Grotesk (400/500/600), Chakra Petch (400/500/600/700), JetBrains Mono (400 normal + 400 italic) — same origin, no external CDN dependency
- Added branded [data-theme="light"] block with 8 token overrides (D-05–D-08): warm paper background (#F5F0E8), dark navy text, cobalt accent — prerequisite for Plan 02 ThemeToggle
- Added @tailwindcss/typography @plugin directive (D-18) — baseline for Plan 02 Shiki integration
- Extended FOUC script with prefers-color-scheme fallback (D-11, D-12) — respects system preference on first visit before any localStorage value exists

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Fontsource packages and copy WOFF2 files** - `a65f056` (chore)
2. **Task 2: Replace Google Fonts @import with @font-face blocks + light theme + typography plugin** - `c8817f1` (feat)
3. **Task 3: Add font preload link and extend FOUC script** - `cbefcd0` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `public/fonts/space-grotesk-400.woff2` — Critical-path body font 400 weight (13 KB)
- `public/fonts/space-grotesk-500.woff2` — Body font medium weight
- `public/fonts/space-grotesk-600.woff2` — Body font semibold weight
- `public/fonts/chakra-petch-400.woff2` — Display/label font regular
- `public/fonts/chakra-petch-500.woff2` — Display/label font medium
- `public/fonts/chakra-petch-600.woff2` — Display/label font semibold
- `public/fonts/chakra-petch-700.woff2` — Display/label font bold
- `public/fonts/jetbrains-mono-400.woff2` — Monospace code font normal (21 KB)
- `public/fonts/jetbrains-mono-400-italic.woff2` — Monospace code font italic (22 KB)
- `package.json` — 4 new devDependencies (@fontsource/* x3, @tailwindcss/typography)
- `src/styles/global.css` — Removed Google Fonts @import; added 9 @font-face blocks, @plugin directive, [data-theme="light"] block
- `src/layouts/BaseLayout.astro` — Added font preload link, extended is:inline FOUC script

## Decisions Made
- Fontsource packages are devDeps only — no CSS imports; WOFF2 files are copied to public/fonts/ and declared via manual @font-face. This keeps the font serving path fully under our control.
- Only space-grotesk-400.woff2 is preloaded (critical path); remaining 8 fonts load async via `font-display: swap`. T-04-03 FOUT tradeoff accepted per plan threat model.
- Dark mode remains the CSS default (no `data-theme` attribute = dark); FOUC script only sets `data-theme` when localStorage has a stored value or system preference is `light`.

## Deviations from Plan

None — plan executed exactly as written.

The `pnpm astro check` acceptance criterion noted 3 pre-existing TypeScript errors in `scripts/__tests__/sync-pipeline.test.ts` (openIssue type mismatch from Phase 2). These errors existed before this plan's changes and are outside this task's scope. They are logged to deferred-items.

## Issues Encountered
- `pnpm astro check` exits with code 1 due to 3 pre-existing TypeScript errors in Phase 2 sync pipeline tests. Confirmed pre-existing by stash test. Not caused by this plan's changes.

## User Setup Required
None — no external service configuration required. All fonts are served from the same origin as the app.

## Next Phase Readiness
- Plan 02 (ThemeToggle + Shiki) can now begin: `[data-theme="light"]` tokens are defined, `@tailwindcss/typography` plugin is activated, FOUC script sets `data-theme` correctly
- Google Fonts CDN blocker is resolved — production deploy is unblocked on the font side
- The `[data-theme="light"]` block uses warm paper palette (#F5F0E8 background, #0A0F1E text, #284068 accents) — Plan 02 ThemeToggle must set `data-theme="light"` to activate these tokens

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `public/fonts/space-grotesk-400.woff2` | FOUND |
| `public/fonts/jetbrains-mono-400-italic.woff2` | FOUND |
| `04-01-SUMMARY.md` | FOUND |
| commit `a65f056` (Task 1) | FOUND |
| commit `c8817f1` (Task 2) | FOUND |
| commit `cbefcd0` (Task 3) | FOUND |
| commit `63320bc` (metadata) | FOUND |
| `pnpm build` exits 0 | PASSED |
| Zero `fonts.googleapis.com` in dist/ | PASSED |
| 9 WOFF2 files in public/fonts/ | PASSED |

---
*Phase: 04-typography-dark-mode*
*Completed: 2026-04-27*
