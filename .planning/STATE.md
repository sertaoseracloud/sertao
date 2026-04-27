---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 04-typography-dark-mode (next)
status: executing
stopped_at: "Phase 3 complete — SEO/RSS/A11y/Lighthouse CI gate delivered; 6 pages build; Lighthouse UAT pending deploy"
last_updated: "2026-04-27T08:30:00Z"
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 12
  completed_plans: 12
  percent: 100
---

# Project State — O Sertão será Cloud

**Last updated:** 2026-04-27
**Status:** In Progress — Phase 3 complete; Phase 4 next

---

## Current Position

- **Current Phase:** 04-typography-dark-mode (next)
- **Previous Phase:** 03-seo-rss-a11y — COMPLETE (4/4 plans, 2026-04-27)
- **Progress:** Phase 1 done; Phase 2 done; Phase 3 done; Phase 4 next

```
Progress: [####################] Phase 1: 3/3 plans complete ✓
Progress: [####################] Phase 2: 5/5 plans complete ✓
Progress: [####################] Phase 3: 4/4 plans complete ✓
```

---

## Decisions

- `@astrojs/mdx` resolved to `^5.0.0` (5.0.4) — pnpm installed latest compatible semver; plan spec had `^4.0.0`
- Tailwind v4 uses `@tailwindcss/vite` Vite plugin, NOT legacy `@astrojs/tailwind` integration
- ESLint explicitly deferred to Phase 2+ (D-24)
- `pnpm build` deferred to Phase 5 — `src/pages/` empty in Phase 1; Astro 6 errors without pages
- Phase 2 PRBuilder uses GitHub REST API directly (not peter-evans/create-pull-request@v7) — required for portability with Claude Code agent scheduling; confirmed by author 2026-04-24
- Phase 2 scheduling: Windows Task Scheduler on developer's PC (scripts/run-sync.ps1, weekly Monday 09:00, StartWhenAvailable); sync-devto.yml uses workflow_dispatch-only as manual fallback; no GH Actions cron
- `.prettierignore` excludes `public/fonts/` to prevent Prettier touching WOFF2 binaries (Phase 3)
- `@astrojs/mdx ^4.0.0` → `^5.0.0` updated in package.json to match what pnpm installed
- Font selection: Space Grotesk / Chakra Petch / JetBrains Mono (from design system file) replaces Inter / Fira Code from D-09/D-10 — design file is source of truth
- Content collection Zod schema (D-14) and mock post (D-15) and consts.ts (D-20) created in plan 01-02 — were listed as 01-01 deliverables but not committed there
- `pnpm build` verified working in plan 01-02 — emits dist/index.html cleanly with lang=pt-BR
- PRBuilder uses GitHub REST API directly (not peter-evans) — 5-step flow: get ref → create branch → read file → PUT file → open draft PR → assign reviewer (02-03)
- ANTHROPIC_API_KEY guard moved inside main() so processArticles can be imported by tests without env var (02-03)
- src/content.config.js created as Node.js re-export using astro/zod — astro:content virtual module not available in node --test runner (02-03)
- GITHUB_TOKEN reviewer assignment is non-fatal; logs warning with note to use GH_PAT secret if needed (02-03)
- node:test built-in chosen over vitest/jest for script unit tests — no additional test framework dependency (02-01)
- Windows Task Scheduler (not GH Actions cron) is the primary sync scheduler — run-sync.ps1 + setup-scheduled-task.ps1; sync-devto.yml has workflow_dispatch only (02-04)
- PSScriptRoot used for dynamic repo-root resolution in both PowerShell scripts — no hardcoded paths (02-04)
- Task registered at user level (no -RunLevel Highest) — no admin privileges needed for sync script (02-04)
- pr-builder.test.ts imports live Zod schema from src/content.config.js — schema drift triggers immediate test failure (02-01)
- Translator.buildSystemPrompt() uses null-coalescing (?? []) for glossary fields to handle partial mocks in tests (02-02)
- GlossaryEnforcer regex-escapes preserve_as_is terms for safe matching of terms with regex metacharacters (02-02)
- SEO.astro is head-only (no html/body) — emits meta/link/script tags only; BaseLayout owns the shell (03-01)
- canonicalUrl prop added to BaseLayout for explicit override so post canonical_url frontmatter flows to SEO (03-01)
- PostLayout uses inline toLocaleDateString('pt-BR') instead of format-date import — avoids cross-plan dependency with 03-03 (03-01)
- Focus ring uses --nucleo-eletrico (#00FFFF) NOT #284068 — dark-first design system; #284068 on #0A0F1E yields ~1.5:1 (fails WCAG); #00FFFF yields 16.5:1 (WCAG AAA) (03-03)
- privacidade.astro last-updated date hardcoded as string — avoids format-date cross-plan import dependency in static file (03-03)
- D-01 (no analytics) implemented by omission — no script analytics tags in any new file (03-03)
- Astro 6 requires `legacy.collectionsBackwardsCompat: true` in astro.config.mjs for `type: 'content'` content collections to load — default is false; without this, getCollection returns empty silently (03-04)
- coverAlt D-16 superRefine uses `astro:content` z (not `astro/zod`) because `collectionsBackwardsCompat` mode requires the original import path (03-04)
- BaseLayout and PostLayout needed `type` prop threaded through to SEO.astro — JSON-LD BlogPosting was not rendering on post pages until this was added (03-04)
- Synced posts (event-driven, practical-guide) had frontmatter exceeding schema limits: description 217 > max(200), title 102 > max(80) — fixed inline; PRBuilder already truncates correctly for future syncs (03-04)

---

## Blockers

- Google Fonts import in `src/styles/global.css` must be replaced with self-hosted WOFF2 before production deploy (Pitfall 6). Tracked in global.css TODO comment. Must be resolved before Phase 5 (First Post Shipped).

---

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01-bootstrap-fundacoes | 01 | 15min | 2 | 10 |
| 01-bootstrap-fundacoes | 02 | 5min | 6 | 9 |
| 02-sync-pipeline | 01 | 12min | 2 | 7 |
| 02-sync-pipeline | 02 | 2min | 3 | 4 |
| 02-sync-pipeline | 03 | 4min | 2 | 5 |
| 02-sync-pipeline | 04 | 2min | 2 | 3 |
| 02-sync-pipeline | 05 | 10min | 2 | 1 |
| 03-seo-rss-a11y | 01 | 6min | 2 | 4 |
| 03-seo-rss-a11y | 03 | 3min | 2 | 5 |

---

## Last Session

- **Timestamp:** 2026-04-26T06:03:00Z
- **Stopped at:** Completed 03-03-PLAN.md — format-date helper, skip-link, focus ring, 404 page, /privacidade stub (D-01, D-11, D-12, D-13, D-14, D-18)
- **Resume file:** .planning/phases/03-seo-rss-a11y/03-04-PLAN.md (Schema enforcement + Lighthouse CI gate)
- **Pending authorial action:** Enable GitHub Pages (Settings > Pages > GitHub Actions) + DNS A records for sertaoseracloud.com
- **Pending authorial action:** Google Fonts import in src/styles/global.css must be replaced with self-hosted WOFF2 before Phase 5
