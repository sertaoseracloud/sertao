---
phase: 08-share-og-about
plan: 01
subsystem: ui
tags: [satori, sharp, og-image, astro-endpoint, fontsource, ssg, meta-tags]

# Dependency graph
requires:
  - phase: 03-seo-rss-a11y
    provides: SEO.astro with og:image/twitter:image wired via image prop
  - phase: 04-typography-dark-mode
    provides: "@fontsource/space-grotesk, @fontsource/chakra-petch, @fontsource/jetbrains-mono devDeps with WOFF files in node_modules"
provides:
  - "src/pages/og/[...slug].png.ts — Astro endpoint generating 1200x630 PNG per post at build time"
  - "dist/og/{slug}.png — static OG banner PNGs served by GitHub Pages"
  - "og:image and twitter:image meta tags in every post HTML pointing to SITE_URL/og/{slug}.png"
affects:
  - 08-02-sharebar (uses OG endpoint as social share image)
  - deploy (dist/og/ files must be served by GitHub Pages)

# Tech tracking
tech-stack:
  added:
    - "satori 0.26.0 — HTML/CSS flexbox object tree to SVG string"
    - "sharp 0.34.5 — SVG buffer to PNG buffer conversion"
  patterns:
    - "Astro SSG build-time binary endpoint: export getStaticPaths + async GET returning Response with binary Content-Type"
    - "WOFF font loading for satori: fs.readFileSync at module level from node_modules/@fontsource/*/*-normal.woff (not WOFF2)"
    - "satori object tree: all container divs require display:flex; no CSS vars (hex values only)"
    - "OG image URL construction: SITE_URL + /og/ + post.id.replace(/\\.[^.]+$/, '') + .png"

key-files:
  created:
    - "src/pages/og/[...slug].png.ts — OG image endpoint (getStaticPaths + GET, satori + sharp pipeline)"
  modified:
    - "package.json — satori and sharp added to dependencies"
    - "src/pages/posts/[...slug].astro — image prop wired to SITE_URL/og/slug.png (replaced coverImageUrl)"

key-decisions:
  - "WOFF from node_modules @fontsource used (not WOFF2 from public/fonts/) — satori does not support brotli-compressed WOFF2"
  - "Font files read at module level once (not inside GET) — loaded once at build start, reused for all slug paths"
  - "coverImageUrl replaced unconditionally with OG URL — OG endpoint handles all posts; no fallback needed"
  - "Slug derivation in OG endpoint mirrors [..slug].astro: post.id.replace(/\\.[^.]+$/, '') — ensures URL consistency"

patterns-established:
  - "OG image pattern: src/pages/og/[...slug].png.ts with getStaticPaths + GET, satori + sharp, WOFF from node_modules"
  - "Binary response endpoint: new Response(buffer, { headers: { 'Content-Type': 'image/png' } })"

requirements-completed: [REQ-OG-01, REQ-OG-02, REQ-OG-03]

# Metrics
duration: 3min
completed: 2026-04-29
---

# Phase 8 Plan 01: OG Image Endpoint Summary

**satori + sharp Astro SSG endpoint generating branded 1200x630 OG banners per post, with og:image/twitter:image wired into every post HTML**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-29T21:34:30Z
- **Completed:** 2026-04-29T21:37:39Z
- **Tasks:** 3
- **Files modified:** 3 (+ pnpm-lock.yaml)

## Accomplishments

- satori 0.26.0 and sharp 0.34.5 installed as runtime dependencies
- Astro build-time endpoint at `src/pages/og/[...slug].png.ts` generates one 1200x630 PNG per published post (7 PNGs for 7 posts)
- OG template: dark #0A0F1E background, white Space Grotesk title, 2px cyan #00FFFF separator, author/wordmark bottom row, optional first-tag badge
- Every post HTML now contains `og:image` and `twitter:image` meta tags pointing to `https://sertaoseracloud.com/og/{slug}.png`

## Task Commits

1. **Task 1: Install satori and sharp** - `cba8434` (chore)
2. **Task 2: Create OG image endpoint** - `cf25502` (feat)
3. **Task 3: Wire OG image URL into post pages** - `cda7893` (feat)

## Files Created/Modified

- `src/pages/og/[...slug].png.ts` — Astro endpoint: getStaticPaths (per-post slug) + GET (satori object tree → SVG → PNG via sharp)
- `src/pages/posts/[...slug].astro` — imports SITE_URL, derives slug, passes `${SITE_URL}/og/${slug}.png` as image prop
- `package.json` — satori ^0.26.0 and sharp ^0.34.5 added to dependencies

## Decisions Made

- WOFF files from `node_modules/@fontsource/*/files/*-normal.woff` used instead of `public/fonts/*.woff2` — satori's opentype.js does not support brotli-compressed WOFF2 (confirmed upstream: github.com/vercel/satori/discussions/157)
- Font buffers loaded at module level (once per build start) rather than inside GET handler — avoids re-reading disk on every slug invocation
- `coverImageUrl` prop removed from `[...slug].astro` — OG endpoint provides a branded banner unconditionally for all posts; no fallback image source needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — build succeeded on first attempt. Pre-existing TypeScript errors in `scripts/__tests__/sync-pipeline.test.ts` and `src/components/Search.astro` (pagefind external module) are documented in STATE.md as out-of-scope from prior phases and were not introduced by this plan.

## Known Stubs

None — all 7 published post OG images are fully generated. No placeholder data flows to the endpoint.

## Threat Flags

No new security surface introduced. OG images are intentionally public static files (T-08-03 accepted in plan threat model). satori processes post title as a JS string value, not HTML (T-08-01 accepted).

## Next Phase Readiness

- OG endpoint ready: 08-02 (ShareBar) and 08-03 (/sobre) can proceed in Wave 2
- `dist/og/` will be deployed to GitHub Pages alongside other static assets — no deploy config changes needed
- `SITE_URL` from consts.ts is the correct base URL for all social share links in 08-02

---
*Phase: 08-share-og-about*
*Completed: 2026-04-29*
