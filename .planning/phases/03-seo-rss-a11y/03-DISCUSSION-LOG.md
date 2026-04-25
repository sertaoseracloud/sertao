# Phase 3: SEO + RSS + A11y Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 03-seo-rss-a11y
**Areas discussed:** Analytics provider, SEO component structure, RSS feed depth, coverAlt schema enforcement

---

## Analytics Provider

| Option | Description | Selected |
|--------|-------------|----------|
| GoatCounter hosted | Free, no cookies, 1 script tag | |
| Umami Cloud free tier | Free (10k events/mo), no cookies | |
| Skip analytics for now | `/privacidade` stub only, no snippet | ✓ |
| Other | — | |

**User's choice:** Skip analytics for now
**Notes:** `/privacidade` stub will document absence of tracking. Analytics deferred to Phase 9 or when traffic justifies it. GoatCounter remains the leading candidate for when analytics are added.

---

## SEO Component Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone `<SEO.astro>` component | Encapsulates all meta/JSON-LD, BaseLayout and PostLayout consume it | ✓ |
| Enrich BaseLayout in-place | More props to BaseLayout, fewer files | |

**User's choice:** Standalone `<SEO.astro>` component
**Notes:** Consistent with existing component pattern (Header, Footer). PostLayout passes `type="article"` + article fields; BaseLayout passes `type="website"`.

---

## RSS Feed Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Full content | `<content:encoded>` with compiled HTML, full post inline in RSS reader | ✓ |
| Summary + link | Description from frontmatter, click-through to blog | |

**User's choice:** Full content RSS
**Notes:** Target audience (senior Brazilian devs) are heavy RSS users who prefer full posts in their reader. Uses Astro's `compiledContent()`.

---

## `coverAlt` Schema Enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| Required when cover present | Zod `.superRefine()` — required only if `coverImageUrl` is set | ✓ |
| Hard required on all posts | `z.string()` — PRBuilder always provides alt text | |
| Keep optional | `.optional()` — no build gate | |

**User's choice:** Required when cover image present
**Notes:** Posts without a cover image are unaffected. PRBuilder updated to use article title as `coverAlt` fallback. Applies to future pipeline runs (Phase 5+) since Phase 2 pipeline's `downloadCoverImage` is not yet wired.

---

## Claude's Discretion

- Lighthouse CI action version and config
- Skip-link CSS animation style
- `<link rel="alternate" type="application/rss+xml">` placement
- PostLayout creation if it doesn't exist yet
