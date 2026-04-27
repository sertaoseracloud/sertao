---
phase: 04-typography-dark-mode
plan: 02
subsystem: ui
tags: [shiki, dual-theme, dark-mode, theme-toggle, syntax-highlighting, rehype-code-titles, astro, tailwind]

# Dependency graph
requires:
  - phase: 04-typography-dark-mode/04-01
    provides: "[data-theme='light'] token block in global.css, self-hosted WOFF2 fonts, FOUC script with localStorage"
provides:
  - "ThemeToggle.astro component with sun/moon SVG icons, localStorage persistence, PT-BR aria-labels"
  - "Shiki dual-theme config (houston dark + github-light) with defaultColor: false and 4 transformers"
  - "Shiki dual-theme CSS activation (.astro-code dark default + [data-theme='light'] override)"
  - "Transformer annotation CSS: .diff.add/.remove, .has-focused/.focused, .highlighted"
  - ".rehype-code-title styles with JetBrains Mono and design system tokens"
  - ".copy-code-btn global styles ready for Plan 03 CopyCode island"
  - "Header.astro with ThemeToggle wired into .nav-actions (PT-BR placeholder removed)"
affects: [04-03-plan, plan-03-copycode, post-layout, prose-rendering]

# Tech tracking
tech-stack:
  added: ["@shikijs/transformers@4.0.2", "rehype-code-titles@1.2.1"]
  patterns: ["Shiki dual-theme with defaultColor: false (no @media, only data-theme selectors)", "FOUC-safe ThemeToggle via Astro-bundled script (no client: directive)"]

key-files:
  created:
    - src/components/ThemeToggle.astro
  modified:
    - astro.config.mjs
    - src/styles/global.css
    - src/components/Header.astro
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "HTMLElement used for icon element type casts in ThemeToggle.astro — SVGElement cast causes TS2352 type overlap error; HTMLElement provides .style.display which is all that is needed"
  - "Pre-existing sync-pipeline.test.ts TS errors (3x ts(2322) openIssue mock type mismatch) are out-of-scope deferred items from Phase 2 — not introduced by this plan"
  - ".copy-code-btn CSS added in Plan 02 (alongside other code block styles in global.css) — Plan 03 CopyCode.astro will inject the DOM element that uses this class"

patterns-established:
  - "Shiki dual-theme pattern: dark is CSS default (no selector), light uses [data-theme='light'] selector — never @media prefers-color-scheme"
  - "ThemeToggle pattern: Astro-bundled <script> block (not client: directive, not is:inline) reads data-theme and writes localStorage + HTML attribute"
  - "applyTheme(getTheme()) called on mount to sync icons to pre-set theme (FOUC-safe)"

requirements-completed: [D-09, D-10, D-11, D-12, D-13, D-14, D-15, D-16, D-19]

# Metrics
duration: 6min
completed: 2026-04-27
---

# Phase 04 Plan 02: ThemeToggle + Shiki Dual-Theme Summary

**Shiki dual-theme (houston/github-light) with 4 transformers, ThemeToggle sun/moon toggle with localStorage persistence, and complete code block CSS system including copy-button infrastructure**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-27T21:18:41Z
- **Completed:** 2026-04-27T21:24:58Z
- **Tasks:** 3
- **Files modified:** 5 (+ pnpm-lock.yaml)

## Accomplishments

- Shiki configured with `defaultColor: false`, houston (dark) + github-light (light) themes, and 4 notation transformers (Diff, Highlight, Focus, MetaHighlight)
- `ThemeToggle.astro` created with 40x40px touch target, sun/moon SVGs, localStorage persistence, and both PT-BR aria-labels toggling on click
- All code block CSS added to global.css: dual-theme activation, diff/focus/highlight annotations, `.rehype-code-title` styles, and `.copy-code-btn` infrastructure for Plan 03

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps + configure Shiki dual-theme in astro.config.mjs** - `3f2fecb` (feat)
2. **Task 2: Add Shiki CSS + transformer annotations + code block styles to global.css** - `1f27829` (feat)
3. **Task 3: Create ThemeToggle.astro + wire into Header.astro** - `3ffed6e` (feat)

## Files Created/Modified

- `src/components/ThemeToggle.astro` — Dark/light mode toggle button; sun/moon SVGs; Astro-bundled script; localStorage + data-theme attribute management
- `astro.config.mjs` — Shiki dual-theme config with defaultColor: false, 4 transformers, rehypeCodeTitles in rehypePlugins
- `src/styles/global.css` — Sections 10b–10e: Shiki dual-theme activation CSS, transformer annotation CSS, .rehype-code-title styles, .copy-code-btn global styles
- `src/components/Header.astro` — Imports and renders ThemeToggle in .nav-actions; PT-BR placeholder span removed
- `package.json` — Added @shikijs/transformers and rehype-code-titles as devDependencies

## Decisions Made

- **HTMLElement over SVGElement for icon casts** — `document.getElementById()` returns `HTMLElement | null`; casting to `SVGElement` triggers TS2352 "type overlap" error since neither type sufficiently overlaps. Using `HTMLElement` is correct because we only call `.style.display` which is available on `HTMLElement`.
- **Pre-existing test errors deferred** — `scripts/__tests__/sync-pipeline.test.ts` has 3 pre-existing TS2322 errors (openIssue mock type mismatch) that pre-date this plan. Confirmed by stash test. Out of scope per deviation rule scope boundary.
- **`.copy-code-btn` CSS in Plan 02** — Added here alongside other code block CSS in global.css rather than in Plan 03, since it belongs with the code block style system. Plan 03 will create the `CopyCode.astro` component that injects the DOM element.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed SVGElement cast to HTMLElement in ThemeToggle.astro**
- **Found during:** Task 3 (ThemeToggle.astro creation)
- **Issue:** Plan spec used `as SVGElement` cast from `document.getElementById()` return type `HTMLElement | null`, causing TS2352 type overlap error in `pnpm astro check`
- **Fix:** Changed both icon element type casts to `as HTMLElement` — `.style.display` is available on `HTMLElement` which is all the code uses
- **Files modified:** `src/components/ThemeToggle.astro`
- **Verification:** `pnpm astro check` shows zero errors in .astro files after fix
- **Committed in:** `3ffed6e` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — Bug)
**Impact on plan:** Essential TypeScript correctness fix. No scope creep.

## Issues Encountered

- Pre-existing `sync-pipeline.test.ts` TS2322 errors (3 errors) — confirmed pre-existing by reverting CSS changes and re-running `pnpm astro check`. These are in the Phase 2 sync pipeline test file, not in any .astro component, and are outside the scope of this plan. Logged to deferred items.

## User Setup Required

None — no external service configuration required. Theme toggle is fully client-side.

## Known Stubs

None — ThemeToggle reads/writes real localStorage and real HTML data-theme attribute. No placeholder data.

## Threat Flags

No new security-relevant surfaces beyond the plan's threat model:
- T-04-04: localStorage 'theme' value — mitigated (only controls CSS via data-theme attribute selector, no eval/innerHTML/navigation)
- T-04-05: Shiki build-time processing — accepted (no user input in production)

## Next Phase Readiness

- Phase 04-03 (CopyCode island): `.copy-code-btn` CSS class is ready; Plan 03 creates `CopyCode.astro` which queries `.astro-code` blocks and appends DOM button elements using this class
- Dual-theme Shiki is active — all markdown code blocks render with houston (dark) or github-light (light) theme based on `data-theme` attribute
- ThemeToggle in Header.astro gives users the toggle; FOUC script from 04-01 ensures correct initial theme

## Self-Check

- [x] `src/components/ThemeToggle.astro` — file exists
- [x] `astro.config.mjs` — `defaultColor: false`, `houston`, `github-light`, `rehypeCodeTitles`, `collectionsBackwardsCompat: true` all present
- [x] `src/styles/global.css` — `.astro-code` (6 matches), `--shiki-dark` with `!important`, `[data-theme="light"]` override, `.rehype-code-title`, `.copy-code-btn`, `.diff.add`, `.diff.remove`, `.has-focused`
- [x] `src/components/Header.astro` — `import ThemeToggle`, `<ThemeToggle />` in `.nav-actions`, no `☁ PT-BR` placeholder
- [x] Commits: `3f2fecb`, `1f27829`, `3ffed6e` — all present in git log
- [x] `pnpm build` — exits 0, 6 pages built
- [x] Zero `@media (prefers-color-scheme)` in Shiki CSS sections

## Self-Check: PASSED

---
*Phase: 04-typography-dark-mode*
*Completed: 2026-04-27*
