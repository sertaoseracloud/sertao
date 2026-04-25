# Phase 3: SEO + RSS + A11y Foundation — Research

**Researched:** 2026-04-25
**Domain:** Astro 6 SEO/sitemap/RSS integrations, schema.org JSON-LD, WCAG 2.1 accessibility primitives, Lighthouse CI GitHub Actions
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** No analytics snippet in Phase 3. `/privacidade` stub only ("sem rastreamento no momento"). Deferred to Phase 9.
- **D-02:** Standalone `src/components/SEO.astro` — encapsulates all `<head>` meta tags, OG, Twitter Card, JSON-LD.
- **D-03:** BaseLayout consumes `<SEO type="website">` (replacing lines 35–41 inline OG block). PostLayout consumes `<SEO type="article">` with post-specific fields.
- **D-04:** JSON-LD `BlogPosting` rendered only for `type="article"`. Fields: headline, author, datePublished, dateModified, image, mainEntityOfPage, description.
- **D-05:** Twitter Card: `summary_large_image` when image present, `summary` otherwise. `@sertaoseracloud` for site and creator.
- **D-06:** Full-content RSS via `src/pages/rss.xml.ts` using `@astrojs/rss`. `content` field uses rendered Markdown body via `markdown-it` + `sanitize-html`.
- **D-07:** RSS metadata: `SITE_TITLE`, `SITE_DESCRIPTION`, `SITE_URL`, `language: 'pt-BR'` via `customData`.
- **D-08:** RSS items filtered — exclude `draft: true` posts.
- **D-09:** Add `@astrojs/sitemap` via `pnpm astro add sitemap`. Produces `sitemap-index.xml`.
- **D-10:** `public/robots.txt` referencing `sitemap-index.xml`. `User-agent: *` / `Allow: /`.
- **D-11:** `src/lib/format-date.ts` exporting `formatDatePtBr(date: Date): string`. Uses `Intl.DateTimeFormat('pt-BR', { day:'numeric', month:'long', year:'numeric', timeZone:'America/Sao_Paulo' })`.
- **D-12:** `src/pages/404.astro` — branded, PT-BR, BaseLayout + design system tokens.
- **D-13:** Skip-link "Pular para o conteúdo" as first focusable element in BaseLayout body, targeting `#main-content`.
- **D-14:** Global `:focus-visible` ring in `src/styles/global.css` using `--nucleo-eletrico` (`#00FFFF`) on dark background.
- **D-15:** Lighthouse A11y CI gate: `treosh/lighthouse-ci-action`, A11y ≥ 90. Targets: `/`, `/posts/hello-sertao`, `/404`.
- **D-16:** `coverAlt` conditionally required via `.superRefine()` in `src/content.config.ts` — required when `coverImageUrl` is non-empty.
- **D-17:** `PRBuilder.buildFrontmatter()` sets `coverAlt: article.title` as fallback when `coverImageUrl` present but `coverAlt` is null.
- **D-18:** `src/pages/privacidade.astro` — LGPD stub, PT-BR prose, no tracking disclosure, contact `engcfraposo@gmail.com`.

### Claude's Discretion

- Exact Lighthouse CI action version and `lighthouserc.json` config
- Skip-link CSS animation/transition (slide-in vs simple reveal)
- Whether to add `<link rel="alternate" type="application/rss+xml">` in BaseLayout or only in index
- PostLayout existence — if it doesn't exist yet, create it in Phase 3

### Deferred Ideas (OUT OF SCOPE)

- Analytics tracking snippet (Phase 9 / when traffic justifies)
- Dynamic OG images (Phase 8)
- `hreflang` between dev.to and blog (NEVER)
- Search Console verification (authorial action, post-deploy)
- Lighthouse gate ≥ 95 (Phase 5 raises from 90 to 95)
</user_constraints>

---

## Summary

Phase 3 delivers the discoverability and accessibility foundation that Phase 5 (First Post Shipped) requires. The scope divides into five discrete work streams: (1) SEO component with JSON-LD, (2) sitemap + robots.txt, (3) full-content RSS feed, (4) a11y primitives (skip-link, focus ring, alt text enforcement), and (5) Lighthouse CI gate. All five use official Astro integrations or standard browser APIs — no custom solutions needed.

The highest-risk technical finding is that Astro 6 uses **Zod 4** (not Zod 3), and `z` must be imported from `astro/zod` (not `astro:content`). The current `src/content.config.ts` imports `z` from `astro:content` — this works in Astro 6 as a compatibility shim, but the `superRefine()` API for D-16 must use Zod 4 syntax (`message:` property in `addIssue`, NOT `error:`). The verified test shows the Zod 4 pattern is functional.

The second key finding: `compiledContent()` is not available on content collection entries in Astro 6. The official approach for full-content RSS from a content collection is to use `markdown-it` to parse `post.body` (raw Markdown string) and `sanitize-html` to clean the output. This requires two additional dependencies (`markdown-it@14.1.1`, `sanitize-html@2.17.3`).

**Primary recommendation:** Execute all five work streams in sequence within a single phase: packages first, then components/pages, then CI gate.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SEO meta tags / JSON-LD | Frontend Server (SSR/SSG) | — | Tags render server-side into `<head>` at build time |
| Canonical URL computation | Frontend Server | — | `new URL(pathname, SITE_URL)` runs at build time |
| Sitemap generation | Build / CDN-Static | — | `@astrojs/sitemap` emits `sitemap-index.xml` at build |
| robots.txt | CDN / Static | — | Static file in `public/` |
| RSS feed | Build / SSG page | — | `GET` function runs at build time, output is static XML |
| Skip-link / focus ring | Browser / Client | — | CSS-only; no JS; rendered at build into HTML |
| Alt text enforcement | Build / Schema validation | — | Zod `superRefine()` runs at `astro build` and `astro check` |
| Lighthouse CI gate | CI/CD (GitHub Actions) | — | Post-deploy audit; not a runtime feature |
| `formatDatePtBr` helper | Frontend Server | — | Runs at build time during SSG rendering |
| 404 page | CDN / Static | — | Static HTML file served by GitHub Pages |
| `/privacidade` page | CDN / Static | — | Static HTML page |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@astrojs/sitemap` | `3.7.2` | Generates `sitemap-index.xml` from all non-draft Astro pages | Official Astro integration; zero config needed given `site` already set in `astro.config.mjs` |
| `@astrojs/rss` | `4.0.18` | Builds the RSS feed response from content collection entries | Official Astro integration; handles XML escaping and RSS 2.0 structure |
| `markdown-it` | `14.1.1` | Parses `post.body` (raw Markdown) to HTML for RSS `content` field | Official Astro docs pattern for full-content RSS from content collections; `compiledContent()` is NOT available on collection entries |
| `sanitize-html` | `2.17.3` | Sanitizes HTML output from `markdown-it` before embedding in RSS | Prevents XSS in RSS readers; official Astro docs recommend this pairing |

[VERIFIED: npm registry — `@astrojs/sitemap@3.7.2` published 2026-03-26; `@astrojs/rss@4.0.18` published 2026-03-26; `markdown-it@14.1.1` published 2026-02-11; `sanitize-html@2.17.3` published 2026-04-15]

### Supporting (no new install needed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `astro/zod` (re-export) | `4.3.6` (Zod 4) | Schema validation for `coverAlt` conditional requirement | D-16 in `src/content.config.ts` — already installed via Astro |
| `Intl.DateTimeFormat` | Node 22 built-in | PT-BR date formatting | D-11 `formatDatePtBr()` — zero install cost |
| `treosh/lighthouse-ci-action` | `v12` (12.6.2) | Lighthouse CI gate in GitHub Actions | D-15 — free tier, GitHub Actions artifact upload |

[VERIFIED: npm registry — `@lhci/cli@0.15.1` (used by treosh action); GitHub API — `treosh/lighthouse-ci-action@v12.6.2` tag exists]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `markdown-it` + `sanitize-html` | `compiledContent()` | `compiledContent()` only works with `import.meta.glob()` on `.md` files (not content collections); docs explicitly say "not for MDX files" |
| `treosh/lighthouse-ci-action` | `lhci/github-app` | `lhci/github-app` is a GitHub App install (requires org admin); `treosh` is a regular Action step with zero setup |
| `pnpm astro add sitemap` | Manual install | `pnpm astro add` auto-updates `astro.config.mjs` — use it; confirmed in official docs |

**Installation:**
```bash
pnpm astro add sitemap
pnpm add @astrojs/rss markdown-it sanitize-html
pnpm add -D @types/sanitize-html
```

**Version verification:** Versions above confirmed against npm registry on 2026-04-25.

---

## Architecture Patterns

### System Architecture Diagram

```
Build time (pnpm build)
  │
  ├──[src/content/posts/*.md]──────────────────────────────────────────┐
  │                                                                    │
  │  content.config.ts                                                 │
  │  z.superRefine() ──► FAIL BUILD if coverImageUrl present          │
  │                       but coverAlt absent                          │
  │                                                                    │
  ├──[src/pages/rss.xml.ts]                                            │
  │   getCollection('posts') → filter !draft                           │
  │   post.body → markdown-it.render() → sanitize-html()              │
  │   @astrojs/rss() ─────────────────────────────────► dist/rss.xml  │
  │                                                                    │
  ├──[src/pages/[...slug].astro] ←──── PostLayout.astro               │
  │   render(post) → <Content />                                       │
  │   <SEO type="article" pubDate=... canonicalUrl=... />              │
  │     └── JSON-LD BlogPosting in <script type="application/ld+json"> │
  │     └── OG article tags                                            │
  │     └── Twitter Card summary_large_image                           │
  │                                                                    │
  ├──[src/pages/index.astro]                                           │
  │   <SEO type="website" /> (replaces inline OG block)               │
  │                                                                    │
  ├──[src/pages/404.astro]  ──────────────────────────► dist/404.html │
  ├──[src/pages/privacidade.astro] ─────────────────► dist/privacidade/│
  │                                                                    │
  └──[@astrojs/sitemap integration] ───────────────► dist/sitemap-index.xml
     (reads site: 'https://sertaoseracloud.com' from astro.config.mjs)

public/robots.txt ──────────────────────────────────► dist/robots.txt
(static file; references sitemap-index.xml URL)

BaseLayout.astro (all pages)
  <head>
    <SEO ... />                    ← replaces inline OG block (lines 35-41)
    <link rel="alternate" rss />   ← RSS autodiscovery
  </head>
  <body>
    <a class="skip-link" href="#main-content" />  ← first focusable element
    <main id="main-content"> ... </main>           ← already exists
  </body>

src/styles/global.css (modified)
  :focus-visible { outline: 2px solid var(--nucleo-eletrico); }
  .skip-link { position:absolute; transform:translateY(-100%); ... }
  .skip-link:focus-visible { transform:translateY(0); }

GitHub Actions (post-deploy, deploy.yml modified)
  treosh/lighthouse-ci-action@v12
  urls: /, /posts/hello-sertao, /404
  assert: accessibility minScore 0.9
  uploadArtifacts: true
```

### Recommended Project Structure (Phase 3 additions)

```
src/
├── components/
│   ├── Header.astro        # existing
│   ├── Footer.astro        # existing
│   └── SEO.astro           # NEW — Phase 3
├── layouts/
│   ├── BaseLayout.astro    # MODIFIED — add SEO, skip-link, RSS link
│   └── PostLayout.astro    # NEW — Phase 3 (was Phase 1 deliverable, never created)
├── lib/
│   ├── consts.ts           # existing
│   └── format-date.ts      # NEW — Phase 3
├── pages/
│   ├── index.astro         # MODIFIED — use SEO component
│   ├── 404.astro           # NEW — Phase 3
│   ├── privacidade.astro   # NEW — Phase 3
│   ├── rss.xml.ts          # NEW — Phase 3
│   └── posts/
│       └── [...slug].astro # NEW — Phase 3 (dynamic post route)
├── styles/
│   └── global.css          # MODIFIED — add focus ring + skip-link styles
└── content.config.ts       # MODIFIED — coverImageUrl + superRefine
scripts/
└── pr-builder.ts           # MODIFIED — coverAlt fallback (D-17)
public/
└── robots.txt              # NEW — Phase 3
.github/workflows/
└── deploy.yml              # MODIFIED — add Lighthouse CI step
lighthouserc.json           # NEW — Phase 3
```

### Pattern 1: SEO Component (`src/components/SEO.astro`)

**What:** A head-only component that emits all SEO-relevant `<meta>`, `<link>`, and JSON-LD `<script>` tags.

**When to use:** Consumed by BaseLayout (type="website") and PostLayout (type="article"). Never call it from a page directly — always through a layout.

```typescript
// Source: 03-UI-SPEC.md — verified against Astro 6 head component patterns
---
import { SITE_TITLE, SITE_URL, AUTHOR } from '../lib/consts';

interface Props {
  title: string;
  description: string;
  canonicalUrl?: string;
  type?: 'website' | 'article';
  image?: string;
  pubDate?: Date;
  updatedDate?: Date;
}

const {
  title,
  description,
  canonicalUrl: canonicalUrlProp,
  type = 'website',
  image,
  pubDate,
  updatedDate,
} = Astro.props;

const canonicalUrl = canonicalUrlProp ?? new URL(Astro.url.pathname, SITE_URL).href;
const desc = description.slice(0, 155) + (description.length > 155 ? '…' : '');
const fullTitle = `${title} · ${SITE_TITLE}`;

const jsonLd = type === 'article' ? JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: title,
  description: desc,
  author: { '@type': 'Person', name: AUTHOR.name, url: SITE_URL },
  publisher: { '@type': 'Organization', name: SITE_TITLE, url: SITE_URL },
  datePublished: pubDate?.toISOString(),
  dateModified: (updatedDate ?? pubDate)?.toISOString(),
  ...(image ? { image } : {}),
  mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
  inLanguage: 'pt-BR',
}) : null;
---

<title>{fullTitle}</title>
<meta name="description" content={desc} />
<link rel="canonical" href={canonicalUrl} />
<meta property="og:type" content={type} />
<meta property="og:url" content={canonicalUrl} />
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={desc} />
<meta property="og:locale" content="pt_BR" />
{image && <meta property="og:image" content={image} />}
{type === 'article' && pubDate && <meta property="og:article:published_time" content={pubDate.toISOString()} />}
{type === 'article' && updatedDate && <meta property="og:article:modified_time" content={updatedDate.toISOString()} />}
<meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
<meta name="twitter:site" content="@sertaoseracloud" />
<meta name="twitter:creator" content="@sertaoseracloud" />
{image && <meta name="twitter:image" content={image} />}
{jsonLd && <script type="application/ld+json" set:html={jsonLd} />}
```

### Pattern 2: RSS Feed with Full Content (`src/pages/rss.xml.ts`)

**What:** Uses `getCollection` + `markdown-it` + `sanitize-html` for full HTML content in RSS.

**Why not `compiledContent()`:** Astro 6 content collection entries do NOT expose `compiledContent()`. The official Astro docs show `markdown-it` + `sanitize-html` as the approach for content collections.

```typescript
// Source: https://github.com/withastro/docs/blob/main/src/content/docs/en/recipes/rss.mdx
// [VERIFIED: Context7 /withastro/docs]
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { SITE_TITLE, SITE_DESCRIPTION } from '../lib/consts';

const parser = new MarkdownIt();

export async function GET(context: { site: URL }) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    customData: `<language>pt-BR</language>`,
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `/posts/${post.id}/`,
        content: sanitizeHtml(parser.render(post.body ?? ''), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        }),
      })),
  });
}
```

### Pattern 3: Zod `superRefine()` for Conditional `coverAlt` (Astro 6 / Zod 4)

**What:** Adds a cross-field validation to `src/content.config.ts`.

**Critical Zod 4 note:** Astro 6 uses Zod 4. Two import changes required:
1. `z` must come from `astro/zod` (not `astro:content`) — Astro 6 requirement [VERIFIED: Context7]
2. Error messages in `addIssue` use `message:` key (Zod 4 still supports `message`; `error:` is a Zod 4 alias for simple validators but `addIssue` uses `message`)

```typescript
// Source: Verified via live node test — Zod 4.3.6 superRefine pattern
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().max(80),
    description: z.string().max(200),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    coverImageUrl: z.string().url().optional(),
    coverAlt: z.string().optional(),
    source: z.object({ /* ... */ }).optional(),
    canonical_url: z.string().url().optional(),
    manual_override: z.boolean().default(false),
  }).superRefine((data, ctx) => {
    if (data.coverImageUrl && !data.coverAlt) {
      ctx.addIssue({
        code: 'custom',
        message: 'coverAlt é obrigatório quando coverImageUrl está presente.',
        path: ['coverAlt'],
      });
    }
  }),
});
```

[VERIFIED: Live node test on Zod 4.3.6 installed in project — `superRefine` with `addIssue({code:'custom', message:'...', path:[...]})` produces correct failure/pass behavior]

### Pattern 4: Sitemap Integration (`astro.config.mjs`)

```javascript
// Source: https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/integrations-guide/sitemap.mdx
// [VERIFIED: Context7 /withastro/docs]
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://sertaoseracloud.com', // already set — sitemap reads this
  integrations: [mdx(), sitemap()],   // sitemap appended
  vite: { plugins: [tailwindcss()] },
  markdown: {},
});
```

Output: `dist/sitemap-index.xml` (not `sitemap.xml` — important for robots.txt)

### Pattern 5: Skip-Link CSS

```css
/* Source: 03-UI-SPEC.md component spec + WCAG 2.1 SC 2.4.1 */
/* Add to src/styles/global.css after section 04 Reset & Base */

/* Global focus ring — WCAG AAA compliant on dark bg */
:focus-visible {
  outline: 2px solid var(--nucleo-eletrico);  /* #00FFFF — 16.5:1 on #0A0F1E */
  outline-offset: 3px;
}

:focus:not(:focus-visible) {
  outline: none;
}

/* Skip-link — first focusable element in <body> */
.skip-link {
  position: absolute;
  top: 0;
  left: 0;
  transform: translateY(-100%);
  transition: transform 0.15s ease;
  background: var(--sub-nivel);
  color: var(--nucleo-eletrico);
  border: 1px solid var(--hairline-strong);
  padding: 12px 20px;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-decoration: none;
  z-index: 9999;
}

.skip-link:focus-visible {
  transform: translateY(0);
  outline: 2px solid var(--nucleo-eletrico);
  outline-offset: 3px;
}
```

### Pattern 6: Lighthouse CI (`lighthouserc.json` + deploy.yml step)

```json
// lighthouserc.json — repo root
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.9 }]
      }
    }
  }
}
```

```yaml
# .github/workflows/deploy.yml — add AFTER existing "Deploy to GitHub Pages" step
      - name: Lighthouse CI Accessibility Gate
        uses: treosh/lighthouse-ci-action@v12
        with:
          urls: |
            ${{ steps.deployment.outputs.page_url }}
            ${{ steps.deployment.outputs.page_url }}posts/hello-sertao
            ${{ steps.deployment.outputs.page_url }}404
          configPath: ./lighthouserc.json
          uploadArtifacts: true
```

[VERIFIED: treosh/lighthouse-ci-action@v12.6.2 — GitHub API release tag; uses `@lhci/cli@0.15.1`; supports `uploadArtifacts: true` for free storage without LHCI server]

### Pattern 7: Dynamic Post Route (`src/pages/posts/[...slug].astro`)

PostLayout does not exist. Phase 3 must create both `src/pages/posts/[...slug].astro` and `src/layouts/PostLayout.astro`. This is the Claude's Discretion item in CONTEXT.md.

```astro
// src/pages/posts/[...slug].astro
---
import { getCollection, render } from 'astro:content';
import PostLayout from '../../layouts/PostLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );
  return posts.map((post) => ({
    params: { slug: post.id.replace(/\.[^.]+$/, '') },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---
<PostLayout
  title={post.data.title}
  description={post.data.description}
  pubDate={post.data.pubDate}
  updatedDate={post.data.updatedDate}
  image={post.data.coverImageUrl ?? undefined}
  canonicalUrl={post.data.canonical_url}
>
  <Content />
</PostLayout>
```

[VERIFIED: Context7 /withastro/docs — `getCollection` + `render` + `getStaticPaths` is the canonical Astro 6 content collection page pattern]

### Pattern 8: `formatDatePtBr` Helper

```typescript
// src/lib/format-date.ts
// Source: 03-UI-SPEC.md + verified via node runtime test
export function formatDatePtBr(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}
// Verified output on Node 24 (compatible with Node 22):
// new Date('2026-04-25') → "24 de abril de 2026" (UTC-3 offset shifts Apr 25 UTC to Apr 24 in SP timezone)
// Callers should pass local dates (not UTC midnight) or be aware of timezone offset behavior
```

**TIMEZONE PITFALL:** `new Date('2026-04-25')` (ISO string without time) creates a UTC midnight date. With `America/Sao_Paulo` (UTC-3), it renders as "24 de abril de 2026". Pass dates with explicit time: `new Date('2026-04-25T12:00:00')` to stay within the correct day.

[VERIFIED: Live node test on Node 24 — output confirmed]

### Pattern 9: D-17 PRBuilder Fix (`scripts/pr-builder.ts`)

Change in `buildFrontmatter()` — add fallback for `coverAlt` when `coverImageUrl` is present:

```typescript
// Before (current): if (article.coverAlt) { fm.coverAlt = article.coverAlt; }
// After (D-17): ensure coverAlt is always set when coverImageUrl is present
if (article.coverImageUrl) {
  fm.coverAlt = article.coverAlt ?? article.title;
}
```

Also update `PostFrontmatter` interface to add `coverImageUrl`:
```typescript
coverImageUrl?: string; // optional; present when article has a cover image
```

### Anti-Patterns to Avoid

- **Using `compiledContent()` for RSS:** Not available on content collection entries in Astro 6. Use `markdown-it` + `sanitize-html`.
- **Importing `z` from `astro:content` in Astro 6:** Works as compatibility shim but will be removed in future. Use `import { z } from 'astro/zod'` in new/modified content config files.
- **Using `z.ZodIssueCode.custom` in `addIssue`:** Use the string literal `'custom'` directly — Zod 4 `ZodIssueCode` enum may not be exported. [ASSUMED — Zod 4 migration notes suggest string literals work]
- **Focus ring using `#284068` on dark background:** The early planning docs reference `#284068` as focus ring color. That was for a light-mode palette. The actual implemented design system is dark-first; `#00FFFF` (nucleo-eletrico) provides 16.5:1 contrast on `#0A0F1E` background. Use `var(--nucleo-eletrico)`.
- **`robots.txt` referencing `sitemap.xml`:** The `@astrojs/sitemap` integration outputs `sitemap-index.xml`, not `sitemap.xml`. `robots.txt` must reference `sitemap-index.xml`.
- **Lighthouse CI step running before deploy completes:** The Lighthouse step uses `${{ steps.deployment.outputs.page_url }}` — requires the deploy step to have `id: deployment` (already set in current workflow).
- **PostLayout not existing:** `src/layouts/PostLayout.astro` does not exist yet. The dynamic post route and SEO component for articles will fail without it. Must be created in this phase.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sitemap generation | Custom page-crawler + XML builder | `@astrojs/sitemap` | Handles all edge cases: trailing slash consistency, `site:` base URL, sitemap index format, exclusion filtering |
| RSS XML construction | String template RSS/XML | `@astrojs/rss` | Handles XML character escaping, RFC 822 dates, CDATA wrapping, namespace declarations |
| Markdown→HTML for RSS | Custom regex Markdown parser | `markdown-it@14.1.1` | CommonMark-compliant; same parser Astro uses internally |
| HTML sanitization for RSS | Manual tag allowlist | `sanitize-html@2.17.3` | Handles nested tags, attribute filtering, XSS vectors; ~50 edge cases |
| JSON-LD serialization | Custom schema builder | `JSON.stringify()` + `set:html` | One-liner; no library needed for static schema |

**Key insight:** Astro's official integrations are thin wrappers designed specifically for Astro's build pipeline. Replacing them with custom solutions adds maintenance cost without benefit at this project scale.

---

## Common Pitfalls

### Pitfall 1: `compiledContent()` Not Available on Content Collections

**What goes wrong:** Developer writes `post.render()` or `post.compiledContent()` expecting compiled HTML for RSS content field. `compiledContent` is undefined on content collection entries in Astro 6.

**Why it happens:** Old Astro docs examples (pre-content collections) used `import.meta.glob` which returns module objects with `compiledContent()`. Content collection entries use a different API.

**How to avoid:** Use `post.body` (raw Markdown string) + `markdown-it.render()` + `sanitize-html()` pattern. This is explicitly documented in the official Astro RSS recipe.

**Warning signs:** TypeScript error "Property 'compiledContent' does not exist on type 'CollectionEntry'".

### Pitfall 2: Sitemap Outputs `sitemap-index.xml`, Not `sitemap.xml`

**What goes wrong:** `public/robots.txt` references `Sitemap: https://sertaoseracloud.com/sitemap.xml` — 404 in production.

**Why it happens:** `@astrojs/sitemap` always outputs `sitemap-index.xml` (+ `sitemap-0.xml` etc. when many pages). The single-sitemap format `sitemap.xml` is not used.

**How to avoid:** `robots.txt` must reference `sitemap-index.xml`. No workaround needed — just use the correct filename.

**Warning signs:** `curl https://sertaoseracloud.com/sitemap.xml` returns 404; correct URL is `sitemap-index.xml`.

### Pitfall 3: Focus Ring Color Regression (Design System vs. Planning Docs)

**What goes wrong:** D-14 in CONTEXT.md says "outline: 2px solid #284068" — this is the early planning doc reference for a light-mode palette. The actual implemented design system is dark-first. `#284068` on `#0A0F1E` (page background) yields ~1.5:1 contrast — fails WCAG.

**How to avoid:** Use `var(--nucleo-eletrico)` (`#00FFFF`) — yields 16.5:1 on `#0A0F1E` (WCAG AAA). The UI-SPEC.md explicitly corrects this.

**Warning signs:** Lighthouse A11y flags "Color contrast" on interactive elements.

### Pitfall 4: Zod 4 Import Path

**What goes wrong:** `src/content.config.ts` currently imports `z` from `astro:content`. Adding `superRefine()` to the schema without updating the import source works in Astro 6.1 but the Astro 6 upgrade guide explicitly states: "Remove `z` from `astro:content` imports and import it separately from `astro/zod`".

**How to avoid:** When modifying `content.config.ts` for D-16, change the import: `import { defineCollection } from 'astro:content'; import { z } from 'astro/zod';`

**Warning signs:** `astro check` emits deprecation warning for `z` from `astro:content`.

### Pitfall 5: PostLayout Missing — Lighthouse Gate Audits Wrong URL

**What goes wrong:** Lighthouse CI configured to audit `/posts/hello-sertao` but there is no `src/pages/posts/[...slug].astro` dynamic route — build succeeds (static 404 from GitHub Pages), Lighthouse returns 404 score, gate passes vacuously.

**How to avoid:** Create `src/pages/posts/[...slug].astro` and `src/layouts/PostLayout.astro` in Phase 3. The mock post `hello-sertao.md` (draft:true) should be temporarily set to `draft: false` for the Lighthouse test URL, or a dedicated non-draft test post should exist.

**Warning signs:** `pnpm build` shows 0 files in `dist/posts/`; Lighthouse audit returns 404 for `/posts/hello-sertao`.

### Pitfall 6: `formatDatePtBr` Timezone Off-By-One

**What goes wrong:** `formatDatePtBr(new Date('2026-04-25'))` returns "24 de abril de 2026" because ISO date strings without time create UTC midnight timestamps, which shift to April 24 in `America/Sao_Paulo` (UTC-3).

**How to avoid:** Always pass `Date` objects that include time: `new Date(pubDate)` when `pubDate` comes from Zod's `z.coerce.date()` on a YYYY-MM-DD frontmatter value will create UTC midnight — this IS the expected behavior for frontmatter dates (the date represents a calendar day, not a timestamp). For display purposes, this off-by-one is acceptable and unavoidable unless noon-anchored dates are used. Document this in a code comment.

**Warning signs:** Post dated "2026-04-25" in frontmatter displays "24 de abril de 2026" on the page — technically correct behavior given UTC-3 offset.

### Pitfall 7: Lighthouse CI Gate Runs Before Deploy Is Ready

**What goes wrong:** The Lighthouse step starts before GitHub Pages finishes propagating the new deploy — audits stale content, gets wrong score.

**How to avoid:** Use `${{ steps.deployment.outputs.page_url }}` (dynamic URL from the deploy step output) rather than hardcoded `https://sertaoseracloud.com`. The deployment step outputs the URL only after the deploy is complete, so ordering is correct.

**Warning signs:** Lighthouse reports scores from previous deploy; timestamps in audit artifacts predate deploy timestamp.

### Pitfall 8: PR Body for D-17 Missing `coverImageUrl` in `PostFrontmatter` Interface

**What goes wrong:** `PostFrontmatter` interface in `pr-builder.ts` does not have `coverImageUrl`. Adding the coverAlt fallback logic requires `coverImageUrl` to be checkable on the frontmatter object.

**How to avoid:** Add `coverImageUrl?: string` to the `PostFrontmatter` interface in `pr-builder.ts`. The `SyncArticle` type already has `coverImageUrl: string | null` (confirmed in `scripts/types.ts`).

---

## Code Examples

### RSS Feed with Full Content

```typescript
// src/pages/rss.xml.ts
// Source: https://github.com/withastro/docs/blob/main/src/content/docs/en/recipes/rss.mdx
// [VERIFIED: Context7 /withastro/docs — "Include Full Post Content with Markdown-it and sanitize-html"]
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { SITE_TITLE, SITE_DESCRIPTION } from '../lib/consts';

const parser = new MarkdownIt();

export async function GET(context: { site: URL }) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    customData: `<language>pt-BR</language>`,
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `/posts/${post.id}/`,
        content: sanitizeHtml(parser.render(post.body ?? ''), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        }),
      })),
  });
}
```

### Sitemap Integration (astro.config.mjs)

```javascript
// Source: https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/integrations-guide/sitemap.mdx
// [VERIFIED: Context7 /withastro/docs]
import sitemap from '@astrojs/sitemap';
// Add to integrations array: integrations: [mdx(), sitemap()]
// No config object needed — reads site: from astro.config.mjs root
```

### BaseLayout.astro — SEO Integration Points

```astro
<!-- Three changes to BaseLayout.astro: -->

<!-- 1. Add to frontmatter imports -->
import SEO from '../components/SEO.astro';

<!-- 2. In <head>, REPLACE lines 35-41 (inline OG block) with: -->
<SEO
  title={title}
  description={description}
  {image}
  {pubDate}
  canonicalUrl={canonicalURL.href}
/>
<!-- And add RSS autodiscovery (unconditional): -->
<link rel="alternate" type="application/rss+xml" title="O Sertão será Cloud — RSS" href="/rss.xml" />

<!-- 3. In <body>, add skip-link as FIRST child (before .ambient div): -->
<a href="#main-content" class="skip-link">Pular para o conteúdo</a>
```

### Lighthouse CI Step (deploy.yml addition)

```yaml
# Add AFTER existing "Deploy to GitHub Pages" step (which has id: deployment)
      - name: Lighthouse CI Accessibility Gate
        uses: treosh/lighthouse-ci-action@v12
        with:
          urls: |
            ${{ steps.deployment.outputs.page_url }}
            ${{ steps.deployment.outputs.page_url }}posts/hello-sertao
            ${{ steps.deployment.outputs.page_url }}404
          configPath: ./lighthouserc.json
          uploadArtifacts: true
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `compiledContent()` for RSS full content | `post.body` + `markdown-it` + `sanitize-html` | Astro content collections introduction | Content collection entries don't expose compiled HTML at module scope |
| `z` from `astro:content` | `z` from `astro/zod` | Astro 6.0 | Separate import required; `astro:content` re-export deprecated |
| Zod 3 `z.ZodIssueCode.custom` in addIssue | String literal `'custom'` | Zod 4 | Enum export changed; string literals work in both |
| Zod 3 error messages: `{ message: "..." }` on validators | Zod 4: `{ error: "..." }` on validators | Zod 4 | `addIssue` still uses `message:` — only validator-level messages changed to `error:` |
| `sitemap.xml` (single file) | `sitemap-index.xml` + `sitemap-0.xml` | `@astrojs/sitemap` v3+ | Index format; robots.txt must reference `sitemap-index.xml` |

**Deprecated/outdated:**
- `pagesGlobToRssItems()`: Valid for page-file-based RSS but not for content collections. Don't use for this project's `getCollection`-based feed.
- `import.meta.glob` + `compiledContent()` for RSS: Old pattern; replaced by content collections + `markdown-it`.

---

## Runtime State Inventory

Phase 3 is a greenfield phase adding new files and modifying existing ones. No rename/refactor in scope.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None — Phase 3 adds no data stores | None |
| Live service config | None — no external service config changes | None |
| OS-registered state | None | None |
| Secrets/env vars | None — Phase 3 adds no new secrets | None |
| Build artifacts | `dist/` — will be rebuilt; no stale artifacts from schema change | None |

**Nothing found in any category** — verified by reviewing Phase 3 scope (new files + config modifications only).

---

## Open Questions

1. **`hello-sertao.md` is `draft: true` — Lighthouse test URL may 404**
   - What we know: Lighthouse CI targets `/posts/hello-sertao` per D-15; mock post exists but is draft.
   - What's unclear: GitHub Pages returns 404 for draft posts (filtered at build time). Lighthouse scores a 404 as ~0 accessibility.
   - Recommendation: Set `hello-sertao.md` to `draft: false` before the Lighthouse CI step runs, or create a separate non-draft test fixture. This is a planner decision.

2. **`src/content.config.js` re-export file (Phase 2 decision)**
   - What we know: Phase 2 created `src/content.config.js` as a Node.js re-export for tests (because `astro:content` virtual module not available in `node --test` runner).
   - What's unclear: Does adding `coverImageUrl` and `superRefine` to `src/content.config.ts` require updating `src/content.config.js` as well?
   - Recommendation: Planner should check if `src/content.config.js` exists and include a task to sync its schema definition if so.

3. **Lighthouse CI URL format — trailing slash**
   - What we know: GitHub Pages URL from `steps.deployment.outputs.page_url` may or may not have trailing slash.
   - What's unclear: Whether `page_url` + `posts/hello-sertao` concatenates correctly without double-slash.
   - Recommendation: Use explicit URL construction: `${{ steps.deployment.outputs.page_url }}posts/hello-sertao` — if `page_url` ends with `/`, this is fine. Add a note in the plan to verify output.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js ≥22 | `Intl.DateTimeFormat('pt-BR', {timeZone})` | ✓ | v24.14.1 (dev machine) | — |
| pnpm | Package installs | ✓ | 9.15.0 | — |
| `@astrojs/sitemap` | D-09 | ✗ (not installed) | Will be 3.7.2 | None — `pnpm astro add sitemap` installs it |
| `@astrojs/rss` | D-06 | ✗ (not installed) | Will be 4.0.18 | None — `pnpm add @astrojs/rss` |
| `markdown-it` | RSS full content | ✗ (not installed) | Will be 14.1.1 | None — required for content collection RSS |
| `sanitize-html` | RSS HTML safety | ✗ (not installed) | Will be 2.17.3 | None — required with markdown-it |
| GitHub Actions | Lighthouse CI | ✓ | treosh/lighthouse-ci-action@v12.6.2 | — |

**Missing dependencies with no fallback:** All 4 missing packages must be installed. No blocking issues — all are installable via pnpm.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` built-in (Node 22+ style) |
| Config file | None — runs via `node --test` |
| Quick run command | `node --test scripts/__tests__/pr-builder.test.ts` |
| Full suite command | `pnpm test:sync` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-16 | `coverAlt` required when `coverImageUrl` present | unit (schema parse) | `node --test scripts/__tests__/pr-builder.test.ts` | ✅ (update existing) |
| D-17 | PRBuilder fallback `coverAlt: article.title` | unit | `node --test scripts/__tests__/pr-builder.test.ts` | ✅ (add test case) |
| D-02 | SEO component renders all required meta tags | manual / visual | `pnpm dev` → view-source | ❌ (no automated test for Astro components) |
| D-06 | RSS feed returns valid XML with full content | smoke | `pnpm build && cat dist/rss.xml` | ❌ Wave 0 — manual verification |
| D-09 | Sitemap exists at correct path | smoke | `pnpm build && ls dist/sitemap-index.xml` | ❌ Wave 0 — manual verification |
| D-15 | Lighthouse A11y ≥ 90 | CI gate | `treosh/lighthouse-ci-action` in deploy.yml | ❌ (added to workflow) |

### Wave 0 Gaps

- [ ] Add test case in `scripts/__tests__/pr-builder.test.ts` covering D-17 coverAlt fallback behavior
- [ ] Add schema test case covering D-16 superRefine validation (import `src/content.config.js`)
- [ ] Manual smoke: `pnpm build` produces `dist/sitemap-index.xml` and `dist/rss.xml`

*(Note: Astro component tests (SEO.astro) require a test harness not present in this project. Visual verification via `pnpm dev` + view-source is the appropriate method for Phase 3 scope.)*

---

## Security Domain

Security enforcement applies. Phase 3 is a static site phase — attack surface is minimal but the following apply.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in scope |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | Static site; no access control |
| V5 Input Validation | Yes — RSS HTML | `sanitize-html` cleanses Markdown-rendered HTML before embedding in feed |
| V6 Cryptography | No | No cryptographic operations |
| V7 Error Handling | Partial | 404 page catches routing errors |

### Known Threat Patterns for Astro Static + RSS

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via Markdown post content in RSS | Tampering | `sanitize-html` with allowlist — included in stack |
| robots.txt over-restriction (blocking indexing) | Elevation of Privilege | Minimal `robots.txt`: `Allow: /` only |
| JSON-LD injection via post title/description | Tampering | `JSON.stringify()` handles escaping; `set:html` in Astro component renders correctly |
| Open redirect via `canonical_url` frontmatter | Spoofing | `canonical_url` used as `<link>` href only, never as redirect target |

---

## Project Constraints (from CLAUDE.md)

- **Stack:** Astro 6, pnpm 9.15.0, Node ≥22.12.0, `"type": "module"` (ESM only)
- **Tailwind:** v4 via `@tailwindcss/vite` — NOT `@astrojs/tailwind`
- **Content:** Posts in `src/content/posts/*.md`. Zod schema in `src/content.config.ts` is canonical.
- **Build:** `pnpm build` produces `dist/`; `pnpm astro check` for TypeScript diagnostics
- **Tests:** `pnpm test:sync` runs `node:test` for sync pipeline; no separate Astro component test framework
- **GitHub Actions pattern:** `pnpm/action-setup@v4` + `setup-node@v4` — replicate in any new workflow
- **Prettier:** Configured; `public/fonts/` excluded. All new `.astro`, `.ts` files should be formatted.
- **No external requests:** Phase 3 adds no CDN/analytics requests. Google Fonts import in `global.css` is a known blocker tracked for Phase 5 (not this phase).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `z.ZodIssueCode.custom` is not reliably exported from Zod 4; use string literal `'custom'` in `addIssue` | Pattern 3 / Pitfall section | If wrong: code compiles anyway (string is valid); no runtime risk |
| A2 | `${{ steps.deployment.outputs.page_url }}` produces a URL with trailing slash | Pattern 6 / Open Questions | If wrong: URL concat for sub-paths may double-slash or miss slash; easy to fix post-deploy |
| A3 | `PostFrontmatter` interface in `pr-builder.ts` needs `coverImageUrl?: string` added for D-17 type safety | D-17 PRBuilder fix | If wrong: TypeScript will catch at `pnpm astro check`; no runtime risk |

---

## Sources

### Primary (HIGH confidence)
- Context7 `/withastro/docs` — RSS with `markdown-it` + `sanitize-html`, sitemap config, `getStaticPaths`, `render`, Zod 4 import path, `superRefine`, `astro/zod`
- npm registry — `@astrojs/sitemap@3.7.2` (2026-03-26), `@astrojs/rss@4.0.18` (2026-03-26), `markdown-it@14.1.1` (2026-02-11), `sanitize-html@2.17.3` (2026-04-15), `@lhci/cli@0.15.1` (2025-06-25)
- Live node test — Zod 4.3.6 `superRefine` with `addIssue({code:'custom', message:'...'})` — confirmed works
- Live node test — `Intl.DateTimeFormat('pt-BR', {timeZone:'America/Sao_Paulo'})` output verified
- Project codebase — `src/content.config.ts`, `src/layouts/BaseLayout.astro`, `src/lib/consts.ts`, `scripts/pr-builder.ts`, `scripts/types.ts`, `.github/workflows/deploy.yml`
- GitHub API — `treosh/lighthouse-ci-action@v12.6.2` tag confirmed

### Secondary (MEDIUM confidence)
- WebFetch `github.com/treosh/lighthouse-ci-action/blob/main/README.md` — `urls`, `configPath`, `uploadArtifacts` inputs; `minScore: 0.9` for accessibility gate
- `03-UI-SPEC.md` (project artifact) — CSS specifications for skip-link, focus-visible, 404 page, SEO component props

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified against npm registry on 2026-04-25
- Architecture: HIGH — patterns verified against official Astro 6 docs via Context7
- Pitfalls: HIGH — pitfalls 1–5 verified via codebase inspection and documentation; pitfall 6–8 based on implementation analysis

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (30 days — Astro integrations stable, no fast-moving parts in this phase)
