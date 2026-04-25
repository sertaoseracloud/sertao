# Phase 3: SEO + RSS + A11y Foundation - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Every post that passes through the sync pipeline is published with correct SEO signals (canonical, OG, Twitter Card, JSON-LD BlogPosting), a full-content RSS feed, sitemap, robots.txt, and zero a11y violations. Phase 3 delivers the discoverability and accessibility floor that Phase 5 (First Post Shipped) depends on.

**In scope:** SEO component, JSON-LD, sitemap, robots.txt, RSS feed, canonical enforcement, formatDatePtBr helper, 404 page, skip-link, focus-visible ring, alt text Zod enforcement, Lighthouse A11y CI gate, `/privacidade` stub.

**Out of scope:** Analytics snippet (deferred), dynamic OG images (Phase 8), `hreflang` between dev.to and blog (explicitly never), full LGPD newsletter flow (Phase 7), Search Console verification (authorial action post-deploy).

</domain>

<decisions>
## Implementation Decisions

### Analytics
- **D-01:** Skip analytics tracking in Phase 3. No snippet added to BaseLayout. `/privacidade` stub documents "sem rastreamento no momento" (LGPD: describes absence of cookies and tracking, lists contact). Analytics provider decision deferred to Phase 9 or when traffic justifies it.

### SEO Component Architecture
- **D-02:** Create standalone `src/components/SEO.astro` component. It encapsulates all `<head>` meta tags: title, description, canonical, OpenGraph (type, url, title, description, locale, image, article fields), Twitter Card, and `<script type="application/ld+json">` JSON-LD block.
- **D-03:** BaseLayout consumes `<SEO>` with `type="website"` (replaces the existing inline OG block). PostLayout consumes `<SEO>` with `type="article"` and passes post-specific fields: `pubDate`, `updatedDate`, `image`, `canonicalUrl` (from frontmatter `canonical_url`).
- **D-04:** JSON-LD schema is `BlogPosting` for posts, rendered only when `type="article"`. Fields: `headline` (title), `author` (from `AUTHOR` in consts.ts), `datePublished` (pubDate ISO), `dateModified` (updatedDate or pubDate), `image` (cover image URL if present), `mainEntityOfPage` (canonical URL), `description`.
- **D-05:** Twitter Card uses `summary_large_image` when `image` is present, `summary` otherwise. `twitter:site` and `twitter:creator` use `@sertaoseracloud`.

### RSS Feed
- **D-06:** Full-content RSS via `src/pages/rss.xml.ts` using `@astrojs/rss`. Each `<item>` includes `<content:encoded>` with the compiled post HTML (`compiledContent()` from Astro content collections). Rationale: target audience (senior Brazilian devs) are heavy RSS users who prefer reading full posts in their reader without click-through.
- **D-07:** RSS feed metadata: `title = SITE_TITLE`, `description = SITE_DESCRIPTION`, `site = SITE_URL`, `language = 'pt-BR'`, `link rel="alternate"` in BaseLayout `<head>`.
- **D-08:** RSS items filtered to exclude `draft: true` posts (same as production build filter).

### Sitemap & robots.txt
- **D-09:** Add `@astrojs/sitemap` integration to `astro.config.mjs`. Produces `sitemap-index.xml` automatically from all non-draft pages. No custom filtering needed at Phase 3 scope.
- **D-10:** `public/robots.txt` referencing sitemap: `Sitemap: https://sertaoseracloud.com/sitemap-index.xml`. `User-agent: *` / `Allow: /`.

### Date Formatting
- **D-11:** Create `src/lib/format-date.ts` exporting `formatDatePtBr(date: Date): string`. Uses `Intl.DateTimeFormat` with `locale: 'pt-BR'` and `timeZone: 'America/Sao_Paulo'`. Format: `{ day: 'numeric', month: 'long', year: 'numeric' }` → "25 de abril de 2026".

### 404 Page
- **D-12:** Create `src/pages/404.astro`. Uses existing BaseLayout + design system tokens. Message in PT-BR. Links back to homepage. No custom illustration required (Phase 9 polish); branded background + typography is sufficient.

### A11y Primitives
- **D-13:** Add skip-link "Pular para o conteúdo" as first focusable element in BaseLayout `<body>`, before the ambient div. Target: `href="#main-content"` (BaseLayout already has `<main id="main-content">`). Visually hidden by default, visible on `:focus-visible`. Style: `--color-text-primary` background, white text, `z-index: 9999`.
- **D-14:** Add global `:focus-visible` ring in `src/styles/global.css`: `outline: 2px solid #284068; outline-offset: 2px;` on all interactive elements. Remove browser default `:focus` outline only when replacing with `:focus-visible`. Do NOT use `outline: none` without this replacement.
- **D-15:** Lighthouse A11y CI gate: add `lhci/github-app` or `treosh/lighthouse-ci-action` step to `.github/workflows/deploy.yml`. Fails PR if A11y score < 90 (ROADMAP says ≥95; gate at 90 during transition, raise to 95 in Phase 5). Targets: `/`, `/posts/hello-sertao` (mock post), `/404`.

### Alt Text Schema Enforcement
- **D-16:** `coverAlt` in `src/content.config.ts` changes from `.optional()` to conditionally required: add `.superRefine()` — if `coverImageUrl` field is non-null/non-empty, `coverAlt` must be a non-empty string. Posts without a cover image are unaffected.
- **D-17:** PRBuilder (`scripts/pr-builder.ts`) updated to set `coverAlt: article.title` as fallback when no explicit alt is provided. This ensures synced posts pass the refine check if they have a cover image.

**Note on coverImageUrl:** The WR-01 code review fix (committed) added `coverImageUrl: article.cover_image` to the `articlesWithDiff` map. PRBuilder's `downloadCoverImage` is still not called from the orchestrator (IN-01 from code review — deferred). Phase 3 schema enforcement applies to posts written by Phase 5+ pipeline runs after the wiring is completed.

### `/privacidade` Stub
- **D-18:** Create `src/pages/privacidade.astro`. Content: this site does not use cookies or tracking; no personal data is collected at this time; if analytics are added in the future, this page will be updated; controller contact: `engcfraposo@gmail.com`. PT-BR prose, branded layout.

### Claude's Discretion
- Exact Lighthouse CI action version and `lighthouserc.json` config
- Skip-link CSS animation/transition (slide-in vs simple reveal)
- Whether to add `<link rel="alternate" type="application/rss+xml">` in BaseLayout or only in `<head>` of index
- PostLayout existence — if it doesn't exist yet, create it in Phase 3 (it was a Phase 1 deliverable but `src/pages/` only has `index.astro`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project constraints & schema
- `.planning/PROJECT.md` — budget zero constraint, WCAG color rules, canonical URL decision (Google sees blog as canonical)
- `.planning/ROADMAP.md` §"Phase 3 — SEO + RSS + A11y Foundation" — success criteria, scope in/out, threat model
- `src/content.config.ts` — current Zod schema (D-16 modifies `coverAlt`)
- `src/lib/consts.ts` — SITE_URL, SITE_TITLE, AUTHOR (used by SEO component and JSON-LD)

### Existing layout integration points
- `src/layouts/BaseLayout.astro` — existing OG/canonical block to be replaced by `<SEO>` component; `<main id="main-content">` is the skip-link target
- `.planning/phases/01-bootstrap-fundacoes/01-CONTEXT.md` §"Paleta & CSS tokens" — D-06 color rules (focus ring must use `#284068`)

### Phase 2 pipeline integration
- `scripts/pr-builder.ts` — needs D-17 update (coverAlt fallback)
- `.planning/phases/02-sync-pipeline/02-REVIEW-FIX.md` — WR-01 fix confirms `coverImageUrl` is now mapped

### Research
- `.planning/research/PITFALLS.md` Pitfall 5 — SEO anti-patterns (canonical + JSON-LD + sitemap all mandatory)
- `.planning/research/PITFALLS.md` Pitfall 8 — analytics LGPD (no cookie banner required)
- `.planning/research/PITFALLS.md` Pitfall 14 — a11y beyond color (skip-link + focus + alt)
- `.planning/research/PITFALLS.md` Pitfall 19 — canonical misconfig (`<link rel="canonical">` in blog HTML)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BaseLayout.astro` — existing OG block (lines 35-41) is the migration target for `<SEO>` component; `canonicalURL` calculation pattern can be reused
- `src/lib/consts.ts` — `SITE_URL`, `SITE_TITLE`, `SITE_DESCRIPTION`, `AUTHOR` are all inputs to SEO component and JSON-LD
- `src/styles/global.css` — `:root` CSS vars including `--color-text-primary: #284068` for focus ring

### Established Patterns
- Component-based composition (Header, Footer, now SEO) — add `src/components/SEO.astro`
- Slot-based layout (`<slot name="header" />`) — BaseLayout uses named slots
- TypeScript props interface pattern (`interface Props { ... }`) — follow same in SEO.astro
- pnpm for package installs — `pnpm astro add sitemap`
- Inline scripts for zero-JS features — skip-link visibility can use CSS only (no JS needed)

### Integration Points
- `BaseLayout.astro <head>` — replace existing inline OG block with `<SEO ... />` import
- `src/pages/*.astro` — 404 page, rss.xml, privacidade are new pages
- `astro.config.mjs` — add `@astrojs/sitemap` integration
- `.github/workflows/deploy.yml` — add Lighthouse CI step after deploy
- `scripts/pr-builder.ts` — add `coverAlt` fallback (D-17)

</code_context>

<specifics>
## Specific Ideas

- Skip-link text: "Pular para o conteúdo" (PT-BR standard)
- JSON-LD `@context`: `"https://schema.org"`, `@type`: `"BlogPosting"` — not `"Article"` (more semantically accurate for blog posts)
- RSS file path: `/rss.xml` (already referenced in `SOCIAL.rss` in consts.ts)
- `formatDatePtBr` timezone: `America/Sao_Paulo` (Brasília time, UTC-3) — author is in Pernambuco (UTC-3) so this is correct
- `/privacidade` controller contact: `engcfraposo@gmail.com` (from user profile)

</specifics>

<deferred>
## Deferred Ideas

- **Analytics tracking snippet** — deferred to Phase 9 or when traffic justifies it. Provider not yet decided. GoatCounter is the leading candidate (free, no cookies, LGPD-safe). `/privacidade` stub acknowledges absence of tracking.
- **Dynamic OG images** — Phase 8 (Share + OG + About)
- **`hreflang`** between dev.to and blog — explicitly NEVER (ROADMAP scope out)
- **Search Console verification** — authorial action post-deploy, not code
- **Lighthouse gate ≥95** — gate set at 90 during Phase 3 (raising to 95 in Phase 5 once real content is available for testing)

</deferred>

---

*Phase: 03-seo-rss-a11y*
*Context gathered: 2026-04-25*
