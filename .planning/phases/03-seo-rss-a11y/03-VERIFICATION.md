---
phase: 03-seo-rss-a11y
verified: 2026-04-25T10:00:00Z
status: human_needed
score: 15/16 must-haves verified
overrides_applied: 0
gaps:
  - truth: "content.config.ts imports z from 'astro/zod' (not deprecated 'astro:content')"
    status: partial
    reason: "z is still imported from 'astro:content' which is deprecated in Astro 6 — generates ts(6385) deprecation warnings on every z usage in the file. superRefine and coverImageUrl are present and functional; the build and tests pass. The import is incorrect per plan acceptance criteria but not a functional blocker."
    artifacts:
      - path: "src/content.config.ts"
        issue: "Line 1: import { defineCollection, z } from 'astro:content' — z should come from 'astro/zod'. Plan acceptance criterion: 'grep from astro:content returns only defineCollection'. Currently returns both defineCollection and z."
    missing:
      - "Change line 1 of src/content.config.ts to: import { defineCollection } from 'astro:content'; (separate line) import { z } from 'astro/zod';"
deferred:
  - truth: "Github Web Analytics snippet is present in BaseLayout (ROADMAP SC: 'Github Web Analytics snippet em BaseLayout')"
    addressed_in: "Phase 9 (or when traffic justifies — per D-01)"
    evidence: "CONTEXT.md D-01 explicitly defers analytics: 'Skip analytics tracking in Phase 3. No snippet added to BaseLayout. Analytics provider decision deferred to Phase 9 or when traffic justifies it.' Phase 3 /privacidade stub documents absence of tracking as required for LGPD compliance."
human_verification:
  - test: "Lighthouse A11y score on deployed URL"
    expected: "Score >= 90 (gate) on /, /posts/hello-sertao, and /404 — CI will fail if any page scores below 90%"
    why_human: "Lighthouse requires a live deployed URL. The CI gate (treosh/lighthouse-ci-action@v12 in deploy.yml + lighthouserc.json) is wired and will run on next push to main, but the actual score requires an active GitHub Pages deployment at sertaoseracloud.com — cannot verify programmatically without a live deploy."
---

# Phase 3: SEO + RSS + A11y Foundation Verification Report

**Phase Goal:** Qualquer post que passe pela pipeline e publicado com SEO de primeira, RSS feed gerado, e zero violations de a11y no Lighthouse.
**Verified:** 2026-04-25T10:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every page has exactly one `<title>` emitted by SEO.astro following the `{title} · O Sertão será Cloud` pattern | VERIFIED | dist/posts/hello-sertao/index.html: `<title>Hello, Sertão! · O Sertão será Cloud</title>`; dist/index.html: `<title>Início · O Sertão será Cloud</title>` |
| 2 | Post pages render a `<script type="application/ld+json">` BlogPosting block with headline, author, datePublished, mainEntityOfPage | VERIFIED | dist/posts/hello-sertao/index.html contains `{"@context":"https://schema.org","@type":"BlogPosting","headline":"Hello, Sertão!",...,"mainEntityOfPage":{"@type":"WebPage","@id":"https://sertaoseracloud.com/posts/hello-sertao"},"inLanguage":"pt-BR"}` |
| 3 | Twitter Card is `summary_large_image` when post has coverImageUrl, `summary` otherwise | VERIFIED | SEO.astro line 57: `content={image ? 'summary_large_image' : 'summary'}`. hello-sertao (no image) renders `summary` in dist output. |
| 4 | BaseLayout no longer contains inline OG block — SEO.astro is sole emitter | VERIFIED | BaseLayout.astro has no `<meta property="og:` tags directly. Contains `<SEO ... />` component at line 38. |
| 5 | Visiting /posts/hello-sertao renders post content wrapped in PostLayout (not 404) | VERIFIED | dist/posts/hello-sertao/index.html exists; contains article content "Do Sertão para a nuvem"; renders via PostLayout with `<article class="prose">` |
| 6 | `<link rel="canonical">` in each page head reflects the correct post URL | VERIFIED | dist/posts/hello-sertao/index.html: `<link rel="canonical" href="https://sertaoseracloud.com/posts/hello-sertao">` |
| 7 | pnpm build produces dist/sitemap-index.xml | VERIFIED | dist/sitemap-index.xml confirmed present |
| 8 | pnpm build produces dist/rss.xml containing `<language>pt-BR</language>` | VERIFIED | dist/rss.xml present; grep confirms `<language>pt-BR</language>` |
| 9 | public/robots.txt references sitemap-index.xml (not sitemap.xml) | VERIFIED | public/robots.txt line 4: `Sitemap: https://sertaoseracloud.com/sitemap-index.xml` |
| 10 | RSS items contain full post HTML content (not just summaries) | VERIFIED | rss.xml.ts uses `markdown-it.render(post.body) + sanitize-html` to produce full HTML content per `<content:encoded>` |
| 11 | Keyboard users pressing Tab see a "Pular para o conteúdo" skip-link | VERIFIED | BaseLayout.astro body line 60: `<a href="#main-content" class="skip-link">Pular para o conteúdo</a>` as first body child. global.css .skip-link with `transform: translateY(-100%)` hidden state + `:focus-visible` slide-in. Confirmed in dist/index.html output. |
| 12 | All focusable elements show a cyan outline ring on :focus-visible | VERIFIED | global.css line 158-161: `:focus-visible { outline: 2px solid var(--nucleo-eletrico); outline-offset: 3px; }` using `--nucleo-eletrico: #00FFFF` (16.5:1 contrast AAA). |
| 13 | formatDatePtBr returns a PT-BR long date with month name and year | VERIFIED | src/lib/format-date.ts: `Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })` — produces "25 de abril de 2026" format. |
| 14 | pnpm build produces 6 pages including /posts/hello-sertao | VERIFIED | dist/ contains: index.html, 404.html, privacidade/index.html, posts/hello-sertao/, posts/event-driven-architecture-on-azure-vs-aws-service-bus-vs-snssqs-3cml/, posts/practical-guide-building-an-event-driven-infrastructure-on-microsoft-azure-with-terraform-and-1g7k/ |
| 15 | PRBuilder.buildFrontmatter sets coverAlt to article.title when coverImageUrl present and coverAlt null (D-17) + 11 pr-builder tests pass | VERIFIED | pr-builder.ts line 65-67: `if (article.coverImageUrl) { fm.coverImageUrl = article.coverImageUrl; fm.coverAlt = article.coverAlt ?? article.title; }`. `node --test scripts/__tests__/pr-builder.test.ts` → 11/11 pass. |
| 16 | content.config.ts imports z from 'astro/zod' (not deprecated 'astro:content') | PARTIAL | superRefine and coverImageUrl are present and functional. But z is still imported from 'astro:content' generating ts(6385) deprecation warnings throughout the file. Plan acceptance criterion not met. |

**Score:** 15/16 truths verified (16th partial — functional but import not corrected)

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Github Web Analytics snippet in BaseLayout | Phase 9 (or traffic-triggered) | CONTEXT.md D-01: "Skip analytics tracking in Phase 3. No snippet added to BaseLayout. Analytics provider decision deferred to Phase 9 or when traffic justifies it." Phase 3 /privacidade documents absence of tracking as required for LGPD. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/SEO.astro` | All head meta: title, description, canonical, OG, Twitter Card, JSON-LD | VERIFIED | 62 lines; emits all required tags; JSON-LD only when type=article |
| `src/layouts/PostLayout.astro` | Article layout wrapping BaseLayout, type="article" | VERIFIED | Passes `type="article"` to BaseLayout at line 18 |
| `src/pages/posts/[...slug].astro` | Dynamic route with getStaticPaths + render | VERIFIED | getStaticPaths with draft filter; `post.id.replace` slug stripping; `await render(post)` |
| `src/layouts/BaseLayout.astro` | SEO component usage; no inline OG; skip-link; RSS autodiscovery | VERIFIED | Imports SEO; uses `<SEO ... />` in head; skip-link as first body child; `<link rel="alternate" rss+xml>` |
| `src/pages/rss.xml.ts` | Full-content RSS 2.0 with pt-BR language tag | VERIFIED | markdown-it + sanitize-html; `<language>pt-BR</language>` customData; always-on draft filter |
| `public/robots.txt` | User-agent: * / Allow: / / Sitemap: sitemap-index.xml | VERIFIED | Exact content confirmed |
| `astro.config.mjs` | sitemap() in integrations array | VERIFIED | `integrations: [mdx(), sitemap()]` + `legacy.collectionsBackwardsCompat: true` |
| `src/lib/format-date.ts` | formatDatePtBr using Intl.DateTimeFormat pt-BR + America/Sao_Paulo | VERIFIED | Named export confirmed |
| `src/pages/404.astro` | Branded PT-BR 404 with aria-hidden decorative numeral and semantic h1 | VERIFIED | aria-hidden="true" on 404 numeral; `<h1>Página não encontrada</h1>` |
| `src/pages/privacidade.astro` | LGPD stub with no-tracking disclosure and controller contact | VERIFIED | engcfraposo@gmail.com contact; no `<script>` analytics tag |
| `src/styles/global.css` | :focus-visible ring using var(--nucleo-eletrico); .skip-link CSS | VERIFIED | Lines 156-191 confirmed |
| `src/content.config.ts` | coverImageUrl field + superRefine conditional coverAlt enforcement | PARTIAL | superRefine present and functional; coverImageUrl field present; BUT z imported from 'astro:content' (deprecated) not 'astro/zod' |
| `src/content.config.js` | Node.js mirror with same schema | VERIFIED | Imports z from 'astro/zod' (correct); identical schema with superRefine |
| `lighthouserc.json` | accessibility minScore: 0.9 | VERIFIED | `"categories:accessibility": ["error", { "minScore": 0.9 }]` |
| `.github/workflows/deploy.yml` | Lighthouse CI step after deployment using treosh/lighthouse-ci-action@v12 | VERIFIED | Step present after `id: deployment`; audits /, /posts/hello-sertao, /404; uploadArtifacts: true |
| `src/content/posts/hello-sertao.md` | draft: false | VERIFIED | Line 5: `draft: false` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| BaseLayout.astro | SEO.astro | `import SEO from '../components/SEO.astro'` | WIRED | Import at line 4; `<SEO ... />` component at line 38 |
| PostLayout.astro | BaseLayout.astro | `<BaseLayout ... type="article">` | WIRED | type="article" threaded through at line 18 |
| [slug].astro | PostLayout.astro | `import PostLayout` + wraps `<Content />` | WIRED | getStaticPaths + render; PostLayout wraps content |
| rss.xml.ts | getCollection('posts') | `getCollection('posts', !data.draft)` | WIRED | Draft filter always-on; markdown-it renders post.body |
| astro.config.mjs | dist/sitemap-index.xml | `sitemap()` integration at build time | WIRED | `dist/sitemap-index.xml` confirmed in build output |
| robots.txt | sitemap-index.xml | `Sitemap:` directive | WIRED | Exact URL `https://sertaoseracloud.com/sitemap-index.xml` |
| PRBuilder.buildFrontmatter | coverAlt fallback | `article.coverAlt ?? article.title` when coverImageUrl present | WIRED | pr-builder.ts lines 64-67 |
| content.config.ts | superRefine | `.superRefine()` chained after `.object()` | WIRED | Functional; z import is deprecated but operational |
| deploy.yml | Lighthouse CI | `treosh/lighthouse-ci-action@v12` after `id: deployment` | WIRED | Uses `steps.deployment.outputs.page_url` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| [slug].astro | post.data.* | getCollection('posts') + render() | Yes — reads from src/content/posts/*.md via Zod schema | FLOWING |
| rss.xml.ts | posts | getCollection('posts', !data.draft) | Yes — reads from content collection; post.body is raw Markdown | FLOWING |
| SEO.astro | title, description, canonicalUrl | Props from PostLayout/BaseLayout callers | Yes — flows from post frontmatter through [slug].astro → PostLayout → BaseLayout → SEO | FLOWING |
| 404.astro | (static) | No dynamic data | N/A — static page | N/A |
| privacidade.astro | (static) | No dynamic data | N/A — static page | N/A |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Post page has og:type=article | `grep -c "og:type" dist/posts/hello-sertao/index.html` | 1 | PASS |
| Post page has application/ld+json BlogPosting | `grep -c "application/ld+json" dist/posts/hello-sertao/index.html` | 1 | PASS |
| RSS feed has pt-BR language tag | `grep -c "pt-BR" dist/rss.xml` | 1 | PASS |
| robots.txt references sitemap-index.xml | `grep "sitemap-index" dist/robots.txt` | Match found | PASS |
| All 11 pr-builder tests pass | `node --test scripts/__tests__/pr-builder.test.ts` | 11/11 pass, 0 fail | PASS |
| Lighthouse CI step present in deploy.yml | `grep "lighthouse-ci-action" .github/workflows/deploy.yml` | Match on treosh/lighthouse-ci-action@v12 | PASS |
| Skip-link present in built output | `grep "skip-link" dist/index.html` | Match found | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| D-01 | 03-03 | No analytics snippet in any file | SATISFIED | No gtag/plausible/analytics script tags found in any src/ file; privacidade.astro contains only text references to analytics in prose |
| D-02 | 03-01 | SEO.astro with all head meta tags | SATISFIED | src/components/SEO.astro with title, description, canonical, OG, Twitter Card, JSON-LD |
| D-03 | 03-01 | BaseLayout uses SEO component | SATISFIED | BaseLayout imports and uses `<SEO>` component; inline OG block removed |
| D-04 | 03-01 | JSON-LD BlogPosting for posts | SATISFIED | SEO.astro emits BlogPosting when type=article; confirmed in dist/posts/hello-sertao/index.html |
| D-05 | 03-01 | Twitter Card summary_large_image/summary | SATISFIED | SEO.astro line 57 uses image conditional |
| D-06 | 03-02 | Full-content RSS feed | SATISFIED | rss.xml.ts uses markdown-it + sanitize-html for full post HTML |
| D-07 | 03-02 | RSS pt-BR language metadata | SATISFIED | customData includes `<language>pt-BR</language>` |
| D-08 | 03-02 | RSS excludes draft posts | SATISFIED | `!data.draft` filter always-on in getCollection call |
| D-09 | 03-02 | @astrojs/sitemap produces sitemap-index.xml | SATISFIED | sitemap() in integrations; dist/sitemap-index.xml confirmed |
| D-10 | 03-02 | robots.txt references sitemap-index.xml | SATISFIED | Exact Sitemap: directive confirmed |
| D-11 | 03-03 | formatDatePtBr helper | SATISFIED | src/lib/format-date.ts with Intl.DateTimeFormat + America/Sao_Paulo |
| D-12 | 03-03 | Branded 404 page | SATISFIED | src/pages/404.astro with aria-hidden decorative numeral, semantic h1, PT-BR copy |
| D-13 | 03-03 | Skip-link in BaseLayout | SATISFIED | First body child `<a href="#main-content" class="skip-link">Pular para o conteúdo</a>` |
| D-14 | 03-03 | Focus ring using var(--nucleo-eletrico) | SATISFIED | global.css :focus-visible uses var(--nucleo-eletrico) — NOT #284068 |
| D-15 | 03-04 | Lighthouse A11y CI gate | SATISFIED (gate wired) | lighthouserc.json minScore 0.9; deploy.yml Lighthouse step after deployment. Actual score requires live deploy — see human verification. |
| D-16 | 03-04 | coverAlt required when coverImageUrl present | SATISFIED | superRefine in content.config.ts (and .js mirror) enforces this. z import from 'astro:content' is deprecated but functional — see gaps. |
| D-17 | 03-04 | PRBuilder coverAlt fallback to article.title | SATISFIED | buildFrontmatter: `fm.coverAlt = article.coverAlt ?? article.title` when coverImageUrl present |
| D-18 | 03-03 | /privacidade LGPD stub | SATISFIED | privacidade.astro with no-tracking disclosure and engcfraposo@gmail.com contact |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/content.config.ts | 1 | `import { defineCollection, z } from 'astro:content'` — z is deprecated in Astro 6 | Warning | Generates ts(6385) deprecation warnings in pnpm astro check on every z usage in the file. Build and tests pass. superRefine is functional. Plan acceptance criterion "z no longer from astro:content" is not met. |
| src/pages/posts/[...slug].astro | 23 | `(post.data as any).coverImageUrl` — type cast | Info | Intentional temporary cast documented in plan. Will be removable after coverImageUrl is properly typed via content.config.ts. Not a blocker. |

### Human Verification Required

#### 1. Lighthouse A11y Score on Live Deployment

**Test:** After sertaoseracloud.com is live (GitHub Pages enabled with DNS configured — pending authorial action from Phase 1), push to main and check the "Lighthouse CI Accessibility Gate" step in the GitHub Actions run for the deploy workflow.

**Expected:** Each of the three audited URLs (/, /posts/hello-sertao, /404) scores 0.90 or above on Lighthouse Accessibility. The CI step will fail the workflow if any URL scores below 0.90.

**Why human:** Lighthouse requires a live deployed URL that responds to HTTPS requests. The CI gate (`treosh/lighthouse-ci-action@v12` in deploy.yml with `lighthouserc.json`) is wired and will run automatically on the next push to main after GitHub Pages deployment is active. The score cannot be computed from static files alone — it requires running a headless browser against the live deployment.

**Note:** The ROADMAP Phase 3 success criterion mentions "≥95" but CONTEXT.md D-15 explicitly sets the Phase 3 gate at 90 with a note to raise to 95 in Phase 5. The CI gate at 90 is the correct target for this phase.

### Gaps Summary

**1 partial gap** (non-blocking):

The `z` import in `src/content.config.ts` remains on `'astro:content'` (deprecated in Astro 6) instead of `'astro/zod'` as required by the plan's acceptance criteria. This causes ts(6385) deprecation warnings throughout the file during `pnpm astro check`, but does not prevent the build from succeeding, does not break the superRefine logic, and does not affect test execution. The `.js` mirror correctly imports from `'astro/zod'`.

The fix is a one-line change:
- Current: `import { defineCollection, z } from 'astro:content';`
- Required: `import { defineCollection } from 'astro:content';` + `import { z } from 'astro/zod';`

This can be addressed in a gap closure or as part of Phase 4 maintenance. It does not block Phase 5 (First Post Shipped).

---

_Verified: 2026-04-25T10:00:00Z_
_Verifier: Claude (gsd-verifier)_
