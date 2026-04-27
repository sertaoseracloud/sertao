---
plan: 03-04
phase: 03-seo-rss-a11y
status: complete
started: 2026-04-26T03:00:00Z
completed: 2026-04-27T08:20:00Z
tasks_completed: 2
tasks_total: 2
requirements_addressed:
  - D-15
  - D-16
  - D-17
self_check: PASSED
---

# Plan 03-04 Summary — Schema Enforcement + Lighthouse CI Gate

## What Was Built

### Task 1: Schema + PRBuilder + Tests (D-16, D-17)
- `src/content.config.ts`: changed `z` import to `astro/zod`, added `coverImageUrl: z.string().url().optional()` field, added `superRefine` conditional validation — fails build if post has `coverImageUrl` without `coverAlt`
- `src/content.config.js`: mirrored schema changes (Node.js re-export for test runner)
- `scripts/pr-builder.ts`: added `coverImageUrl?: string` to `PostFrontmatter` interface; fixed `buildFrontmatter` to set `coverAlt = article.coverAlt ?? article.title` when `coverImageUrl` present; added `coverImageUrl` to `serializeFrontmatter`
- `scripts/__tests__/pr-builder.test.ts`: added 4 new test cases covering D-16 (schema rejects missing alt, accepts present alt) and D-17 (fallback to title, preserves explicit alt) — 11/11 tests pass

### Task 2: Lighthouse CI Gate (D-15)
- `lighthouserc.json`: `categories:accessibility` minScore 0.9
- `.github/workflows/deploy.yml`: `treosh/lighthouse-ci-action@v12` step after `Deploy to GitHub Pages`; audits `/`, `/posts/hello-sertao`, `/404`; `uploadArtifacts: true`
- `src/content/posts/hello-sertao.md`: `draft: false` — post now builds and URL returns 200

## Deviations & Fixes

**Root cause investigation (post-execution):** `pnpm build` produced 0 post pages despite all Phase 3 plans completing. Investigation revealed:
- Astro 6 has `legacy.collectionsBackwardsCompat: false` by default — `type: 'content'` in `defineCollection` is silently ignored
- Fix: Added `legacy: { collectionsBackwardsCompat: true }` to `astro.config.mjs`
- Two synced posts had frontmatter exceeding schema constraints (description 217/200, title 102/80) — fixed inline
- `BaseLayout.astro` and `PostLayout.astro` were not passing `type="article"` through to `SEO.astro` — JSON-LD BlogPosting was never rendered on post pages. Fixed by threading `type` and `updatedDate` props through the BaseLayout → SEO chain.

## Key Files

| File | Change |
|------|--------|
| `astro.config.mjs` | Added `legacy.collectionsBackwardsCompat: true` |
| `src/content.config.ts` | `coverImageUrl` + `superRefine`; legacy type:content mode |
| `src/content.config.js` | Mirrored schema changes |
| `scripts/pr-builder.ts` | D-17 coverAlt fallback + coverImageUrl in interface/serialize |
| `scripts/__tests__/pr-builder.test.ts` | 4 new test cases (11 total passing) |
| `lighthouserc.json` | A11y gate ≥90% |
| `.github/workflows/deploy.yml` | Lighthouse CI step |
| `src/content/posts/hello-sertao.md` | `draft: false` |
| `src/layouts/BaseLayout.astro` | `type` + `updatedDate` props threaded to SEO |
| `src/layouts/PostLayout.astro` | Passes `type="article"` to BaseLayout |

## Verification

- `pnpm build` → 6 pages (index, 3 posts, 404, privacidade)
- `dist/posts/hello-sertao/index.html` contains `og:type content="article"` ✓
- `dist/posts/hello-sertao/index.html` contains `application/ld+json` BlogPosting ✓
- `node --test scripts/__tests__/pr-builder.test.ts` → 11/11 pass ✓
- `lighthouserc.json` + `deploy.yml` Lighthouse step committed ✓
