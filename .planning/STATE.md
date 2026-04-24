# Project State — O Sertão será Cloud

**Last updated:** 2026-04-24
**Status:** In Progress

---

## Current Position

- **Current Phase:** 01-bootstrap-fundacoes
- **Current Plan:** 02 (COMPLETE) → Phase 1 fully complete; next: Phase 2
- **Progress:** 2/2 plans complete in Phase 01

```
Progress: [####################] Phase 1: 2 plans executed (COMPLETE)
```

---

## Decisions

- `@astrojs/mdx` resolved to `^5.0.0` (5.0.4) — pnpm installed latest compatible semver; plan spec had `^4.0.0`
- Tailwind v4 uses `@tailwindcss/vite` Vite plugin, NOT legacy `@astrojs/tailwind` integration
- ESLint explicitly deferred to Phase 2+ (D-24)
- `pnpm build` deferred to Phase 5 — `src/pages/` empty in Phase 1; Astro 6 errors without pages
- `.prettierignore` excludes `public/fonts/` to prevent Prettier touching WOFF2 binaries (Phase 3)
- `@astrojs/mdx ^4.0.0` → `^5.0.0` updated in package.json to match what pnpm installed
- Font selection: Space Grotesk / Chakra Petch / JetBrains Mono (from design system file) replaces Inter / Fira Code from D-09/D-10 — design file is source of truth
- Content collection Zod schema (D-14) and mock post (D-15) and consts.ts (D-20) created in plan 01-02 — were listed as 01-01 deliverables but not committed there
- `pnpm build` verified working in plan 01-02 — emits dist/index.html cleanly with lang=pt-BR

---

## Blockers

- Google Fonts import in `src/styles/global.css` must be replaced with self-hosted WOFF2 before production deploy (Pitfall 6). Tracked in global.css TODO comment. Must be resolved before Phase 5 (First Post Shipped).

---

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01-bootstrap-fundacoes | 01 | 15min | 2 | 10 |
| 01-bootstrap-fundacoes | 02 | 5min | 6 | 9 |

---

## Last Session

- **Timestamp:** 2026-04-24
- **Stopped at:** Completed 01-02-PLAN.md
- **Resume file:** None (complete)
