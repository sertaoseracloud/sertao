# Phase 3: SEO + RSS + A11y Foundation — Pattern Map

**Mapped:** 2026-04-25
**Files analyzed:** 14 new/modified files
**Analogs found:** 11 / 14

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/SEO.astro` | component | request-response | `src/layouts/BaseLayout.astro` | role-match (head meta block lines 24–41) |
| `src/layouts/PostLayout.astro` | layout | request-response | `src/layouts/BaseLayout.astro` | exact (same layout role) |
| `src/pages/posts/[...slug].astro` | page/route | request-response | `src/pages/index.astro` | role-match (getCollection + BaseLayout) |
| `src/pages/rss.xml.ts` | page/endpoint | batch | `src/pages/index.astro` | partial (getCollection pattern only) |
| `src/pages/404.astro` | page | request-response | `src/pages/index.astro` | role-match (BaseLayout consumer) |
| `src/pages/privacidade.astro` | page | request-response | `src/pages/index.astro` | role-match (BaseLayout consumer) |
| `src/lib/format-date.ts` | utility | transform | `src/lib/consts.ts` | role-match (lib module, named export) |
| `src/content.config.ts` | config/schema | transform | `src/content.config.js` | exact (same schema, JS mirror) |
| `src/content.config.js` | config/schema | transform | `src/content.config.js` | exact (self; must mirror .ts changes) |
| `astro.config.mjs` | config | — | `astro.config.mjs` | exact (self; integration array pattern) |
| `public/robots.txt` | static | — | none | no analog |
| `.github/workflows/deploy.yml` | CI/CD | — | `.github/workflows/deploy.yml` | exact (self; step addition pattern) |
| `scripts/pr-builder.ts` | service | CRUD | `scripts/pr-builder.ts` | exact (self; buildFrontmatter method) |
| `scripts/__tests__/pr-builder.test.ts` | test | — | `scripts/__tests__/pr-builder.test.ts` | exact (self; existing describe/it pattern) |

---

## Pattern Assignments

### `src/components/SEO.astro` (component, request-response)

**Analog:** `src/layouts/BaseLayout.astro`

**Imports pattern** (`src/layouts/BaseLayout.astro` lines 2–3):
```astro
---
import '../styles/global.css';
import { SITE_TITLE, SITE_URL } from '../lib/consts';
```
For SEO.astro, import from `../lib/consts` (path relative to `src/components/`):
```astro
---
import { SITE_TITLE, SITE_URL, AUTHOR } from '../lib/consts';
```

**Props interface pattern** (`src/layouts/BaseLayout.astro` lines 5–10):
```astro
interface Props {
  title: string;
  description?: string;
  image?: string;
  pubDate?: Date;
}
```
Extend this pattern for SEO.astro — add `canonicalUrl`, `type`, `updatedDate`:
```astro
interface Props {
  title: string;
  description: string;
  canonicalUrl?: string;
  type?: 'website' | 'article';
  image?: string;
  pubDate?: Date;
  updatedDate?: Date;
}
```

**Canonical URL computation pattern** (`src/layouts/BaseLayout.astro` line 19):
```astro
const canonicalURL = new URL(Astro.url.pathname, SITE_URL);
```
Reuse verbatim; SEO.astro uses `canonicalUrlProp ?? new URL(Astro.url.pathname, SITE_URL).href`.

**Existing OG block to REPLACE** (`src/layouts/BaseLayout.astro` lines 35–41 — this is the migration target):
```astro
    <!-- Open Graph (Phase 3 will enrich) -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonicalURL} />
    <meta property="og:title" content={`${title} · ${SITE_TITLE}`} />
    <meta property="og:description" content={description} />
    <meta property="og:locale" content="pt_BR" />
    {image && <meta property="og:image" content={new URL(image, SITE_URL)} />}
```
Also replace lines 29–33 (existing `<link rel="canonical">` and `<title>` / `<meta name="description">`):
```astro
    <link rel="canonical" href={canonicalURL} />
    <!-- Primary meta -->
    <title>{title} · {SITE_TITLE}</title>
    <meta name="description" content={description} />
```
Both blocks (lines 29–33 and 35–41) are replaced by `<SEO ... />` in Phase 3.

**Full SEO.astro implementation pattern** (from `03-RESEARCH.md` Pattern 1 — verified against Astro 6 docs):
```astro
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

---

### `src/layouts/PostLayout.astro` (layout, request-response)

**Analog:** `src/layouts/BaseLayout.astro` (lines 1–68 — full file)

**Imports pattern** (copy from BaseLayout, extend with SEO):
```astro
---
import BaseLayout from './BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import { formatDatePtBr } from '../lib/format-date';

interface Props {
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  image?: string;
  canonicalUrl?: string;
}
```

**Slot-based composition pattern** (`src/layouts/BaseLayout.astro` lines 57–67):
```astro
  <body>
    <div class="ambient" aria-hidden="true"></div>
    <slot name="header" />
    <main id="main-content">
      <slot />
    </main>
    <slot name="footer" />
  </body>
```
PostLayout wraps BaseLayout — pass `type="article"` and post props to SEO via BaseLayout (once BaseLayout consumes SEO). Use `<slot />` for `<Content />` from the dynamic route.

**Design system class pattern** (from `src/styles/global.css` sections 10/06):
- Wrap post body in `<div class="stage"><article class="prose">` — `.stage` centers and pads, `.prose` applies reading typography (defined in global.css section 10, lines 464–584).

---

### `src/pages/posts/[...slug].astro` (page/route, request-response)

**Analog:** `src/pages/index.astro` (lines 1–68)

**getCollection + draft filter pattern** (`src/pages/index.astro` lines 7–9):
```astro
const allPosts = await getCollection('posts', ({ data }) =>
  import.meta.env.PROD ? !data.draft : true,
);
```
Dynamic route uses same pattern inside `getStaticPaths`.

**Route + render pattern** (from `03-RESEARCH.md` Pattern 7 — verified Astro 6 docs):
```astro
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

**Slug stripping pattern** (`src/pages/index.astro` line 42 — card href):
```astro
href={`/posts/${post.id.replace(/\.[^.]+$/, '')}`}
```
Same regex used in `getStaticPaths` params.

---

### `src/pages/rss.xml.ts` (page/endpoint, batch)

**No direct analog.** Closest structural reference is `src/pages/index.astro` for the `getCollection` call pattern.

**getCollection + draft filter pattern** (`src/pages/index.astro` lines 7–9):
```astro
const allPosts = await getCollection('posts', ({ data }) =>
  import.meta.env.PROD ? !data.draft : true,
);
```
For RSS, simplify to:
```typescript
const posts = await getCollection('posts', ({ data }) => !data.draft);
```
(Always filter drafts in RSS — no dev exception needed.)

**Sort pattern** (`src/pages/index.astro` lines 11–13):
```astro
const recentPosts = allPosts
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
```
Reuse verbatim in RSS items array.

**Full RSS implementation pattern** (from `03-RESEARCH.md` Pattern 2 / Code Examples — verified against official Astro docs):
```typescript
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
        link: `/posts/${post.id.replace(/\.[^.]+$/, '')}/`,
        content: sanitizeHtml(parser.render(post.body ?? ''), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        }),
      })),
  });
}
```
Note: `post.id.replace(/\.[^.]+$/, '')` strips the `.md` extension from the id — same pattern as index.astro card href.

---

### `src/pages/404.astro` (page, request-response)

**Analog:** `src/pages/index.astro` (lines 1–68 — BaseLayout consumer pattern)

**BaseLayout consumer pattern** (`src/pages/index.astro` lines 1–4, 16–18, 65–68):
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
---

<BaseLayout title="Página não encontrada" description="Esta página não existe.">
  <Header slot="header" />

  <div class="stage">
    <!-- content here -->
  </div>

  <Footer slot="footer" />
</BaseLayout>
```

**Design system tokens for branded error page** (from `src/styles/global.css`):
- Container: `class="stage"` (section 06, lines 203–215)
- Mono label: `font-family:'Chakra Petch',sans-serif; font-size:11px; letter-spacing:0.28em; text-transform:uppercase; color:var(--nucleo-eletrico)`
- Heading: `font-size:clamp(44px,4.2vw,68px); font-weight:700; color:#E9FBFF` (pattern from index.astro hero)
- Body text: `color:var(--texto-secundario); font-weight:300; line-height:1.6`
- Link back to home: `color:var(--nucleo-eletrico)` with underline

---

### `src/pages/privacidade.astro` (page, request-response)

**Analog:** `src/pages/index.astro` — identical BaseLayout consumer pattern (see 404.astro above).

**Pattern:** Same BaseLayout + Header + Footer shell. Content area uses `.stage` container and `.prose` class for readable PT-BR prose:
```astro
<div class="stage">
  <article class="prose" style="max-width:68ch; margin:64px auto;">
    <h1>Privacidade</h1>
    <!-- PT-BR prose content here -->
  </article>
</div>
```
The `.prose` class (global.css section 10, lines 464–584) provides: 18px base, 1.72 line-height, Space Grotesk font, `var(--prose-fg)` color.

---

### `src/lib/format-date.ts` (utility, transform)

**Analog:** `src/lib/consts.ts` (lines 1–15 — named export module pattern)

**Named export pattern** (`src/lib/consts.ts` lines 1–9):
```typescript
export const SITE_URL = 'https://sertaoseracloud.com';
export const SITE_TITLE = 'O Sertão será Cloud';
// ...
export const AUTHOR = {
  name: 'Cláudio Filipe Lima Rapôso',
  handle: 'sertaoseracloud',
};
```
Follow same convention: single-responsibility file, named exports, no default export.

**Implementation pattern** (from `03-RESEARCH.md` Pattern 8 — verified on Node 24):
```typescript
export function formatDatePtBr(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}
// TIMEZONE NOTE: new Date('2026-04-25') (ISO date, no time) = UTC midnight.
// America/Sao_Paulo (UTC-3) shifts this to Apr 24. Expected behavior for
// frontmatter dates. Callers should be aware of this off-by-one.
```

---

### `src/content.config.ts` (config/schema, transform)

**Analog:** `src/content.config.js` (lines 1–37 — exact schema mirror; both must stay in sync)

**Current schema** (`src/content.config.ts` lines 1–28):
```typescript
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().max(80),
    description: z.string().max(200),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    coverAlt: z.string().optional(),
    source: z.object({
      platform: z.literal('dev.to'),
      id: z.number(),
      url: z.string().url(),
      hash: z.string(),
      synced_at: z.coerce.date(),
      translated_by: z.string(),
    }).optional(),
    canonical_url: z.string().url().optional(),
    manual_override: z.boolean().default(false),
  }),
});

export const collections = { posts };
```

**D-16 superRefine addition pattern** (from `03-RESEARCH.md` Pattern 3 — verified live on Zod 4.3.6):
```typescript
// CRITICAL: Change import line from:
//   import { defineCollection, z } from 'astro:content';
// TO:
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
```
Then chain `.superRefine()` after `.object({...})`:
```typescript
  schema: z.object({
    // ... all existing fields unchanged ...
    coverImageUrl: z.string().url().optional(),  // ADD THIS — was missing
    coverAlt: z.string().optional(),             // stays optional; superRefine enforces conditionally
    // ... rest unchanged ...
  }).superRefine((data, ctx) => {
    if (data.coverImageUrl && !data.coverAlt) {
      ctx.addIssue({
        code: 'custom',
        message: 'coverAlt é obrigatório quando coverImageUrl está presente.',
        path: ['coverAlt'],
      });
    }
  }),
```
Note: `coverImageUrl` field is currently absent from `content.config.ts` (it exists in `types.ts` / `SyncArticle` but was never added to the Zod schema). Add it now alongside the superRefine.

---

### `src/content.config.js` (config/schema, transform)

**Analog:** `src/content.config.js` itself — this IS the analog; it must mirror `content.config.ts`.

**Current file** (`src/content.config.js` lines 1–37) — already uses `import { z } from 'astro/zod'` (correct Zod 4 import — no change needed there).

**Required D-16 changes** — add `coverImageUrl` field and `superRefine` after the object definition:
```javascript
// After z.object({...}) add:
.superRefine((data, ctx) => {
  if (data.coverImageUrl && !data.coverAlt) {
    ctx.addIssue({
      code: 'custom',
      message: 'coverAlt é obrigatório quando coverImageUrl está presente.',
      path: ['coverAlt'],
    });
  }
})
```
Also add `coverImageUrl: z.string().url().optional()` to the object fields.

**Test import dependency** (`scripts/__tests__/pr-builder.test.ts` line 4):
```typescript
import { collections } from '../../src/content.config.js';
```
The test suite imports from this file. The D-17 test cases must pass against the updated schema.

---

### `astro.config.mjs` (config)

**Analog:** `astro.config.mjs` itself (lines 1–15)

**Current integration array** (`astro.config.mjs` lines 1–8):
```javascript
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://sertaoseracloud.com',
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
```

**Sitemap addition pattern** (from `03-RESEARCH.md` Pattern 4 — verified official Astro docs):
```javascript
import sitemap from '@astrojs/sitemap';
// ...
integrations: [mdx(), sitemap()],
```
`pnpm astro add sitemap` auto-updates this file. Run the command and verify the output matches this pattern.

---

### `.github/workflows/deploy.yml` (CI/CD)

**Analog:** `.github/workflows/deploy.yml` itself (lines 1–55)

**Existing canonical step pattern** (`.github/workflows/deploy.yml` lines 24–54 — pnpm/action-setup@v4 + setup-node@v4):
```yaml
      - name: Set up pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9.15.0

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
```

**Deployment step with id** (`.github/workflows/deploy.yml` lines 52–54 — required for Lighthouse URL):
```yaml
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```
The `id: deployment` already exists. Lighthouse step references `steps.deployment.outputs.page_url`.

**Lighthouse CI addition pattern** (from `03-RESEARCH.md` Pattern 6 — verified treosh/lighthouse-ci-action@v12.6.2):
```yaml
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
Add AFTER the `Deploy to GitHub Pages` step (line 54). No other steps follow it currently.

---

### `scripts/pr-builder.ts` (service, CRUD) — D-17 fix

**Analog:** `scripts/pr-builder.ts` itself (lines 43–67 — `buildFrontmatter` method)

**Current coverAlt handling** (`scripts/pr-builder.ts` lines 63–65):
```typescript
    if (article.coverAlt) {
      fm.coverAlt = article.coverAlt;
    }
```

**D-17 replacement pattern** (from `03-RESEARCH.md` Pattern 9):
```typescript
    if (article.coverImageUrl) {
      fm.coverAlt = article.coverAlt ?? article.title;
    }
```
This ensures coverAlt is always set when coverImageUrl is present (passing the D-16 superRefine check).

**PostFrontmatter interface addition** (`scripts/pr-builder.ts` lines 9–26 — interface definition):
```typescript
export interface PostFrontmatter {
  title: string;
  description: string;
  pubDate: Date;
  draft: boolean;
  tags: string[];
  coverImageUrl?: string;  // ADD THIS — needed for D-17 type safety
  coverAlt?: string;
  // ... rest unchanged
}
```
Note: `SyncArticle.coverImageUrl` is `string | null` (`scripts/types.ts` line 8). The `PostFrontmatter` field should be `string | undefined` (optional) to match existing optional pattern.

Also update `serializeFrontmatter` (`scripts/pr-builder.ts` lines 268–286) to emit `coverImageUrl` if present:
```typescript
    if (fm.coverImageUrl) lines.push(`coverImageUrl: ${JSON.stringify(fm.coverImageUrl)}`);
    if (fm.coverAlt) lines.push(`coverAlt: ${JSON.stringify(fm.coverAlt)}`);
```

---

### `scripts/__tests__/pr-builder.test.ts` (test) — D-16/D-17 additions

**Analog:** `scripts/__tests__/pr-builder.test.ts` itself (lines 1–70 — existing test structure)

**Test structure pattern** (`scripts/__tests__/pr-builder.test.ts` lines 1–5, 24–29):
```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PRBuilder } from '../pr-builder.ts';
import { collections } from '../../src/content.config.js';

describe('PRBuilder', () => {
  it('buildFrontmatter produces output that satisfies the Zod schema', () => {
    const builder = new PRBuilder('/tmp/posts', '/tmp/images');
    const frontmatter = builder.buildFrontmatter(mockArticle);
    const result = collections.posts.schema.safeParse(frontmatter);
    assert.ok(result.success, `Zod validation failed: ${JSON.stringify(result.error?.issues)}`);
  });
```

**Mock article pattern** (`scripts/__tests__/pr-builder.test.ts` lines 6–22):
```typescript
const mockArticle = {
  id: 12345,
  slug: 'test-article',
  title: 'Test Article PT-BR',
  description: 'Descrição do artigo de teste',
  pubDate: '2026-04-24',
  tags: ['cloud', 'aws'],
  coverImageUrl: null,
  coverAlt: null,
  canonicalUrl: 'https://sertaoseracloud.com/posts/test-article',
  // ...
};
```

**D-17 test cases to add** (follow same `it()` pattern):
```typescript
  // D-17: coverAlt fallback — article has coverImageUrl but no explicit coverAlt
  it('D-17: buildFrontmatter sets coverAlt to article.title when coverImageUrl present and coverAlt null', () => {
    const builder = new PRBuilder('/tmp/posts', '/tmp/images');
    const articleWithCover = {
      ...mockArticle,
      coverImageUrl: 'https://dev.to/image.jpg',
      coverAlt: null,
    };
    const frontmatter = builder.buildFrontmatter(articleWithCover);
    assert.equal(frontmatter.coverAlt, articleWithCover.title);
  });

  // D-17: explicit coverAlt is preserved when provided
  it('D-17: buildFrontmatter preserves explicit coverAlt when provided', () => {
    const builder = new PRBuilder('/tmp/posts', '/tmp/images');
    const articleWithAlt = {
      ...mockArticle,
      coverImageUrl: 'https://dev.to/image.jpg',
      coverAlt: 'Screenshot of AWS console',
    };
    const frontmatter = builder.buildFrontmatter(articleWithAlt);
    assert.equal(frontmatter.coverAlt, 'Screenshot of AWS console');
  });

  // D-16: schema rejects coverImageUrl present with empty coverAlt
  it('D-16: schema rejects post with coverImageUrl present but coverAlt absent', () => {
    const result = collections.posts.schema.safeParse({
      title: 'Test',
      description: 'Test description',
      pubDate: new Date(),
      draft: false,
      tags: [],
      coverImageUrl: 'https://example.com/image.jpg',
      // coverAlt intentionally absent
      manual_override: false,
    });
    assert.equal(result.success, false);
    const hasAltIssue = result.error?.issues.some((i) => i.path.includes('coverAlt'));
    assert.ok(hasAltIssue, 'expected Zod issue on coverAlt path');
  });

  // D-16: schema accepts post with coverImageUrl and coverAlt both present
  it('D-16: schema accepts post with coverImageUrl and coverAlt both present', () => {
    const result = collections.posts.schema.safeParse({
      title: 'Test',
      description: 'Test description',
      pubDate: new Date(),
      draft: false,
      tags: [],
      coverImageUrl: 'https://example.com/image.jpg',
      coverAlt: 'A descriptive alt text',
      manual_override: false,
    });
    assert.ok(result.success, `unexpected Zod failure: ${JSON.stringify(result.error?.issues)}`);
  });
```

---

### `public/robots.txt` (static)

**No analog exists.** Static text file; no code pattern needed.

**Content pattern** (from `03-RESEARCH.md` D-10 + Pitfall 2):
```
User-agent: *
Allow: /

Sitemap: https://sertaoseracloud.com/sitemap-index.xml
```
Critical: use `sitemap-index.xml` (not `sitemap.xml`) — `@astrojs/sitemap` outputs the index format.

---

## Shared Patterns

### BaseLayout Consumption (all new `.astro` pages)
**Source:** `src/pages/index.astro` lines 1–4, 16–18, 65–68
**Apply to:** `src/pages/404.astro`, `src/pages/privacidade.astro`
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
---
<BaseLayout title="..." description="...">
  <Header slot="header" />
  <div class="stage">
    <!-- page content -->
  </div>
  <Footer slot="footer" />
</BaseLayout>
```

### Design System CSS Tokens (all new Astro pages)
**Source:** `src/styles/global.css` `:root` block (lines 64–112)
**Apply to:** `src/pages/404.astro`, `src/pages/privacidade.astro`, `src/layouts/PostLayout.astro`

Key tokens for use in inline styles or class names:
- `var(--nucleo-eletrico)` — `#00FFFF` — accent color for headings, links, labels
- `var(--texto-secundario)` — `#D1D9E6` — secondary text
- `var(--abismo-profundo)` — `#0A0F1E` — page background
- `var(--sub-nivel)` — `#1B293C` — card/panel background
- `var(--hairline)` — `rgba(209,217,230,0.14)` — borders
- `var(--hairline-strong)` — `rgba(0,255,255,0.32)` — active borders

Font family pattern (from index.astro inline styles):
- Display labels: `font-family:'Chakra Petch',sans-serif; font-size:11px; letter-spacing:0.28em; text-transform:uppercase`
- Body: `font-family:'Space Grotesk',system-ui,sans-serif`
- Code: `font-family:'JetBrains Mono',monospace`

### getCollection with Draft Filter
**Source:** `src/pages/index.astro` lines 7–9
**Apply to:** `src/pages/posts/[...slug].astro` (getStaticPaths), `src/pages/rss.xml.ts`
```astro
await getCollection('posts', ({ data }) =>
  import.meta.env.PROD ? !data.draft : true,
);
```
For RSS, always filter drafts (no dev exception):
```typescript
await getCollection('posts', ({ data }) => !data.draft);
```

### Focus Ring + Skip-Link CSS
**Source:** `src/styles/global.css` (to be added after section 04 Reset & Base, around line 155)
**Apply to:** `src/styles/global.css` modification
```css
/* Global focus ring — WCAG AAA on dark bg (#00FFFF on #0A0F1E = 16.5:1) */
:focus-visible {
  outline: 2px solid var(--nucleo-eletrico);
  outline-offset: 3px;
}

:focus:not(:focus-visible) {
  outline: none;
}

/* Skip-link — WCAG 2.1 SC 2.4.1 */
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

### Skip-Link HTML Placement
**Source:** `src/layouts/BaseLayout.astro` lines 53–55 (existing `<body>` open)
**Apply to:** `src/layouts/BaseLayout.astro` modification — add as first child of `<body>`:
```astro
  <body>
    <a href="#main-content" class="skip-link">Pular para o conteúdo</a>
    <!-- Ambient grid + gradient backdrop -->
    <div class="ambient" aria-hidden="true"></div>
```
The `<main id="main-content">` target already exists at line 61.

### Consts Import (all new lib/component/page files)
**Source:** `src/lib/consts.ts` lines 1–15
**Apply to:** `src/components/SEO.astro`, `src/pages/rss.xml.ts`
```typescript
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION, AUTHOR } from '../lib/consts';
```
Path adjusts per file depth: `'../lib/consts'` from `src/components/` or `src/layouts/`; `'./lib/consts'` would be wrong (use relative from file location).

### GitHub Actions Setup Pattern
**Source:** `.github/workflows/deploy.yml` lines 26–39
**Apply to:** `.github/workflows/deploy.yml` modification (Lighthouse step inherits same job context)
```yaml
      - name: Set up pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9.15.0
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
```
Lighthouse step added to same job (`build-and-deploy`); no separate job needed.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `public/robots.txt` | static | — | No existing static text config file in codebase; pure content, no code pattern |
| `lighthouserc.json` | CI config | — | No existing LHCI config; pattern fully specified in RESEARCH.md Pattern 6 |
| `src/pages/rss.xml.ts` (endpoint) | page/endpoint | batch | Closest analog (index.astro) only shares getCollection pattern; RSS GET function and @astrojs/rss API have no codebase analog |

---

## Key Anti-Patterns to Avoid

These are documented in `03-RESEARCH.md` and are critical for this phase:

1. **`import { z } from 'astro:content'`** — Use `import { z } from 'astro/zod'` in content.config.ts (Astro 6 requirement). Note: `src/content.config.ts` currently uses the deprecated form — change it when adding superRefine.
2. **`robots.txt` referencing `sitemap.xml`** — `@astrojs/sitemap` outputs `sitemap-index.xml`. Use that exact filename.
3. **`post.compiledContent()` for RSS** — Not available on content collection entries. Use `post.body` + `markdown-it` + `sanitize-html`.
4. **Focus ring color `#284068`** — That is `--texto-principal` (body text on dark bg). Use `var(--nucleo-eletrico)` (`#00FFFF`) for focus rings — 16.5:1 contrast on dark background.
5. **Lighthouse CI before deploy** — Step must come AFTER `Deploy to GitHub Pages` step with `id: deployment`.

---

## Metadata

**Analog search scope:** `src/components/`, `src/layouts/`, `src/pages/`, `src/lib/`, `src/styles/`, `src/content.config.*`, `astro.config.mjs`, `.github/workflows/`, `scripts/`, `scripts/__tests__/`
**Files scanned:** 14 source files read in full
**Pattern extraction date:** 2026-04-25
