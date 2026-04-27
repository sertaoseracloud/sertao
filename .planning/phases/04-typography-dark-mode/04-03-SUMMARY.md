---
phase: 04-typography-dark-mode
plan: "03"
subsystem: ui
tags: [astro, copy-code, clipboard, lighthouse, lighthouse-ci, performance]

# Dependency graph
requires:
  - phase: 04-typography-dark-mode/04-02
    provides: ".copy-code-btn CSS class in global.css, .prose pre.astro-code position:relative"

provides:
  - CopyCode.astro island — appends Copiar/✓/Erro button to every .prose pre.astro-code block
  - lighthouserc.json extended with Performance >=0.9 (warn) and CLS <=0.1 (warn) CI gate assertions

affects:
  - future post pages (all use PostLayout.astro)
  - CI Lighthouse runs (deploy.yml treosh/lighthouse-ci-action@v12 reads lighthouserc.json)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Astro plain-script component: <script> in .astro file runs client-side automatically — no client: hydration directive needed or valid"
    - "DOM-injection pattern: createElement + className = 'global-css-class' for elements that CSS cannot reach via scoped styles"
    - "Clipboard API with try/catch: navigator.clipboard.writeText in try, show error state in catch (T-04-08 mitigation)"

key-files:
  created:
    - src/components/CopyCode.astro
  modified:
    - src/layouts/PostLayout.astro
    - lighthouserc.json

key-decisions:
  - "client:visible removed from <CopyCode /> usage — Astro component <script> tags run client-side automatically; client:visible is only for framework components (React/Svelte/etc.) and produces a build-time warning when applied to Astro components (Rule 1 auto-fix)"
  - "lighthouserc.json Performance and CLS use warn not error — network-dependent scores in CI cause false failures; warn flags catastrophic regressions without blocking deploys on minor variance"

patterns-established:
  - "DOM-injection button pattern: create button via document.createElement, set className to existing global CSS class, append to pre — avoids scoped style limitation"

requirements-completed:
  - D-17
  - D-20

# Metrics
duration: 5min
completed: 2026-04-25
---

# Phase 04 Plan 03: CopyCode Island + Lighthouse Performance Gate Summary

**PT-BR clipboard copy button (Copiar/Erro/checkmark) injected into all code blocks via DOM scripting, plus Lighthouse Performance >=0.9 and CLS <=0.1 CI gate assertions added to lighthouserc.json**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-25T18:28:00Z
- **Completed:** 2026-04-25T18:31:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- CopyCode.astro creates a button per `.prose pre.astro-code` block with PT-BR labels (Copiar / ✓ 1.5s / Erro 1.5s), clipboard API with try/catch error handling per T-04-08
- PostLayout.astro now imports and renders CopyCode on every post page
- lighthouserc.json extended with Performance warn >=0.9 and CLS warn <=0.1; deploy.yml reads this automatically via `configPath: ./lighthouserc.json`
- pnpm build exits 0 with no Astro-component-specific warnings

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CopyCode.astro island and add to PostLayout.astro** - `6f33321` (feat)
2. **Task 2: Extend lighthouserc.json with Performance and CLS assertions** - `50daa94` (feat)

**Plan metadata:** TBD (docs commit)

## Files Created/Modified
- `src/components/CopyCode.astro` - DOM-injection island: queries `.prose pre.astro-code`, appends `.copy-code-btn` button per block with Copiar/✓/Erro states and 1.5s reset timeouts
- `src/layouts/PostLayout.astro` - Added `import CopyCode` and `<CopyCode />` after `</article>` inside `.stage` div
- `lighthouserc.json` - Added `categories:performance` warn >=0.9 and `cumulative-layout-shift` warn <=0.1 alongside existing accessibility error >=0.9

## Decisions Made
- `client:visible` removed from `<CopyCode />` — Astro's own `<script>` blocks are bundled client-side automatically; `client:` directives only apply to framework component hydration (React/Svelte/Vue). Using `client:visible` on an Astro component produces a runtime build warning ("Astro components do not render in the client and should not have a hydration directive"). Removed as Rule 1 auto-fix.
- `warn` (not `error`) for Performance and CLS in lighthouserc.json — CI network conditions cause Lighthouse perf score variance; `warn` surfaces regressions without blocking green deploys on minor fluctuations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed client:visible hydration directive from Astro component usage**
- **Found during:** Task 1 (build output review)
- **Issue:** Plan spec called for `<CopyCode client:visible />` but Astro 6 emits a build warning for each post page: "You are attempting to render `<CopyCode client:visible />`, but CopyCode is an Astro component. Astro components do not render in the client and should not have a hydration directive." The prior_wave_context note in the prompt also stated "CopyCode.astro uses NO client: directive". The `client:visible` pattern is correct for React/Svelte islands, not for Astro-native components with `<script>` blocks.
- **Fix:** `<CopyCode />` with no directive. The `<script>` in CopyCode.astro is bundled by Astro's Vite pipeline and executes client-side on page load — functionally identical to the intended behavior.
- **Files modified:** `src/layouts/PostLayout.astro`
- **Verification:** `pnpm build` exits 0 with no CopyCode-related warnings; script DOM queries run client-side.
- **Committed in:** `6f33321` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — Astro hydration directive misuse)
**Impact on plan:** Fix required for a clean build; functional behavior (client-side script injection of copy buttons) is identical. No scope creep.

## Issues Encountered
- Pre-existing `pnpm astro check` exit code 1 due to 3x `ts(2322)` type errors in `scripts/__tests__/sync-pipeline.test.ts` (openIssue mock type mismatch). Confirmed out-of-scope per STATE.md decisions — predates Phase 4, not introduced by this plan. `pnpm build` exits 0 regardless.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 is now complete (3/3 plans done: 04-01 fonts, 04-02 dark mode + Shiki, 04-03 CopyCode + Lighthouse gate)
- All design system deliverables from the typography/dark-mode phase are shipped
- Lighthouse CI gate is active for Performance and CLS on next deploy
- Pending authorial actions: Enable GitHub Pages (Settings > Pages > GitHub Actions) + DNS A records for sertaoseracloud.com

---
## Self-Check: PASSED

- FOUND: src/components/CopyCode.astro
- FOUND: lighthouserc.json
- FOUND: .planning/phases/04-typography-dark-mode/04-03-SUMMARY.md
- FOUND commit: 6f33321 (Task 1 — CopyCode island + PostLayout)
- FOUND commit: 50daa94 (Task 2 — lighthouserc.json)

---

*Phase: 04-typography-dark-mode*
*Completed: 2026-04-25*
