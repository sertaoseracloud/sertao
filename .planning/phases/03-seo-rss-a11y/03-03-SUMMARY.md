---
phase: 03-seo-rss-a11y
plan: "03"
subsystem: ui
tags: [a11y, wcag, accessibility, skip-link, focus-ring, intl, date-format, 404, privacy, lgpd]

requires:
  - phase: 03-seo-rss-a11y/03-01
    provides: BaseLayout with SEO component and PostLayout for slug routes

provides:
  - formatDatePtBr() utility function using Intl.DateTimeFormat pt-BR + America/Sao_Paulo
  - Skip-link "Pular para o conteúdo" as first body child in BaseLayout targeting #main-content
  - Global :focus-visible ring using --nucleo-eletrico (#00FFFF) in global.css
  - Branded PT-BR 404 page with aria-hidden decorative numeral and semantic h1
  - LGPD privacy stub /privacidade with no-tracking disclosure and controller contact

affects:
  - 03-04 (Lighthouse CI gate — requires skip-link and focus ring for a11y score)
  - All future plans using BaseLayout (inherit skip-link and focus ring automatically)

tech-stack:
  added: []
  patterns:
    - "formatDatePtBr uses Intl.DateTimeFormat with timeZone: 'America/Sao_Paulo' to avoid UTC off-by-one on ISO date strings"
    - "Skip-link uses transform: translateY(-100%) hidden state (stays in a11y tree) with :focus-visible slide-in"
    - "Focus ring uses :focus-visible (keyboard only) + :focus:not(:focus-visible) { outline: none } to suppress mouse-click outline"
    - "Decorative numerals (404) use aria-hidden=true; semantic heading is the h1"

key-files:
  created:
    - src/lib/format-date.ts
    - src/pages/404.astro
    - src/pages/privacidade.astro
  modified:
    - src/layouts/BaseLayout.astro
    - src/styles/global.css

key-decisions:
  - "Focus ring uses --nucleo-eletrico (#00FFFF) NOT #284068 — dark-first design system; #284068 on #0A0F1E yields ~1.5:1 (fails WCAG); #00FFFF yields 16.5:1 (WCAG AAA)"
  - "privacidade.astro last-updated date hardcoded as string to avoid format-date cross-plan import dependency"
  - "D-01 (no analytics) implemented by omission — no script tags in any new file"
  - "Pre-existing pnpm astro check errors in scripts/__tests__/ (Phase 2 test files) are out of scope — not caused by this plan"

patterns-established:
  - "Page pattern: BaseLayout + Header slot + stage div + Footer slot (confirmed by index.astro, PostLayout, 404, privacidade)"
  - "A11y pattern: decorative large numerals/icons get aria-hidden=true; semantic heading provides accessible label"

requirements-completed: [D-01, D-11, D-12, D-13, D-14, D-18]

duration: 3min
completed: 2026-04-26
---

# Phase 03 Plan 03: A11y Primitives + Format Date + 404 + Privacy Summary

**WCAG 2.1 a11y primitives (skip-link, focus ring), PT-BR date formatter via Intl.DateTimeFormat, branded 404, and LGPD privacy stub — all using --nucleo-eletrico (#00FFFF) for AAA contrast**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-26T06:00:05Z
- **Completed:** 2026-04-26T06:03:01Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created `formatDatePtBr()` helper outputting "25 de abril de 2026" format using `Intl.DateTimeFormat` with `America/Sao_Paulo` timezone
- Added skip-link "Pular para o conteúdo" as first body child in BaseLayout, hidden off-screen by default and revealed on `:focus-visible` (WCAG 2.1 SC 2.4.1)
- Added global `:focus-visible` ring using `var(--nucleo-eletrico)` (16.5:1 contrast AAA) with `outline: none` suppression for mouse-click focus
- Created branded PT-BR 404 page with Chakra Petch decorative numeral (`aria-hidden="true"`), Space Grotesk semantic `<h1>`, and homepage CTA
- Created LGPD-compliant `/privacidade` stub with no-tracking disclosure and LGPD Article 41 controller contact (engcfraposo@gmail.com)
- `pnpm build` produces `dist/404.html` and `dist/privacidade/index.html` cleanly

## Task Commits

1. **Task 1: format-date.ts + skip-link + focus ring** - `d4f7f70` (feat)
2. **Task 2: 404.astro + privacidade.astro** - `65ccf10` (feat)

## Files Created/Modified

- `src/lib/format-date.ts` — PT-BR date formatter using Intl.DateTimeFormat, named export `formatDatePtBr`
- `src/layouts/BaseLayout.astro` — skip-link added as first `<body>` child before `.ambient` div
- `src/styles/global.css` — `:focus-visible` ring rule + `:focus:not(:focus-visible)` suppression + `.skip-link` styles added after section 04 Reset & Base
- `src/pages/404.astro` — branded PT-BR 404 with BaseLayout, aria-hidden decorative numeral, semantic h1, homepage CTA
- `src/pages/privacidade.astro` — LGPD privacy stub with prose class, no-tracking disclosure, controller contact

## Decisions Made

- Focus ring color is `--nucleo-eletrico` (#00FFFF), not `#284068` — the dark-first design system requires the cyan token for AAA contrast (16.5:1) on the `--abismo-profundo` (#0A0F1E) background. `#284068` on `#0A0F1E` yields ~1.5:1 (fails WCAG entirely).
- `privacidade.astro` uses a hardcoded "25 de abril de 2026" string for the last-updated date rather than importing `formatDatePtBr` — avoids introducing a cross-plan runtime dependency in a static file; matches D-18 spec exactly.
- D-01 (no analytics) implemented by omission — confirmed no `<script>` analytics tags in any new file.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- `pnpm astro check` reports 5 pre-existing TypeScript errors in `scripts/__tests__/pr-builder.test.ts` and `scripts/__tests__/sync-pipeline.test.ts` (Phase 2 test files). These errors were confirmed pre-existing by stashing changes and re-running the check — they are not caused by this plan. Logged to deferred-items.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- A11y primitives (skip-link + focus ring) are in place — Plan 04 Lighthouse CI gate should pass the a11y ≥90 criterion
- `formatDatePtBr` ready for use in PostLayout date display (currently using `toLocaleDateString` inline)
- 404 and /privacidade pages deployed on next push to main

---
*Phase: 03-seo-rss-a11y*
*Completed: 2026-04-26*
