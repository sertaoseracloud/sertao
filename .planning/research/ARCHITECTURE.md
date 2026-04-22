# Architecture Research

**Domain:** Markdown-driven personal tech blog (static site, Git-based content, zero-budget hosting)
**Researched:** 2026-04-21
**Confidence:** HIGH

The architecture is stack-agnostic at the conceptual layer. Concrete examples use Astro 5.x conventions because it is the recommended stack (see STACK.md), but the component boundaries, data flow, and build order map cleanly to Next.js (App Router, `generateStaticParams`) and Hugo/11ty as well. Where framework-specific choices matter, they are called out.

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                   AUTHORING (local / IDE)                        │
│  ┌─────────────┐   ┌──────────────┐   ┌────────────────────┐     │
│  │ .md / .mdx  │   │ cover images │   │ frontmatter schema │     │
│  │  content/   │   │ assets/      │   │ Zod validation     │     │
│  └──────┬──────┘   └──────┬───────┘   └─────────┬──────────┘     │
│         │                 │                     │                │
│         └─────── git commit / push ─────────────┘                │
├──────────────────────────────────────────────────────────────────┤
│                   BUILD PIPELINE (CI on push)                    │
│  ┌────────────────────────────────────────────────────────┐      │
│  │ 1. Parse frontmatter (gray-matter / content collections│      │
│  │ 2. Markdown/MDX → AST (remark / unified)               │      │
│  │ 3. Remark plugins (GFM, smartypants, reading time)     │      │
│  │ 4. Rehype plugins (slug, autolink, Shiki, Mermaid SSR) │      │
│  │ 5. Render to HTML via layout/page components           │      │
│  │ 6. Emit: /posts/*.html, /tags/*.html, index, 404       │      │
│  │ 7. Emit: sitemap.xml, rss.xml, robots.txt              │      │
│  │ 8. Emit: pagefind search index (post-build step)       │      │
│  │ 9. Optimize images (AVIF/WebP, responsive srcset)      │      │
│  └────────────────────────────┬───────────────────────────┘      │
├───────────────────────────────┼──────────────────────────────────┤
│                   EDGE / CDN (hosting)                           │
│  ┌────────────────────────────▼───────────────────────────┐      │
│  │  Static HTML + CSS + minimal JS islands                │      │
│  │  Immutable hashed assets, long-cache headers           │      │
│  │  Custom domain: sertaoseracloud.com                    │      │
│  └────────────────────────────┬───────────────────────────┘      │
├───────────────────────────────┼──────────────────────────────────┤
│                   BROWSER (runtime)                              │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐    │
│  │ ThemeToggle │ │ Search   │ │ Comments │ │ Newsletter     │    │
│  │ (inline JS) │ │ (Pagefind│ │ (giscus  │ │ (3rd-party     │    │
│  │             │ │  WASM)   │ │  iframe) │ │  form/API)     │    │
│  └─────────────┘ └──────────┘ └──────────┘ └────────────────┘    │
│        +  Analytics beacon (Plausible / Umami / GA4)             │
└──────────────────────────────────────────────────────────────────┘
```

Three distinct time axes drive the architecture:

1. **Author time** — writing `.md`/`.mdx`, committing, pushing. Everything here is local editor + Git.
2. **Build time** — CI rebuilds the entire site on push. Heavy work (Markdown parsing, Shiki tokenization, Mermaid SVG rendering, search index generation, image transcoding) runs once per commit and produces immutable artifacts.
3. **Runtime** — the browser loads near-zero JS by default. Only opt-in, bounded features hydrate: theme toggle (tiny), Pagefind search (WASM, lazy), comments iframe (lazy), newsletter form (form POST to 3rd-party), analytics (beacon).

### Component Responsibilities

| Component | Layer | Responsibility | Typical Implementation |
|-----------|-------|----------------|------------------------|
| **Content Collection** | Build | Own the set of posts; enforce frontmatter schema; expose typed query API | `src/content/posts/*.md{x}` + `src/content.config.ts` (Zod schema) |
| **BaseLayout** | Build (render) | HTML shell: `<head>`, meta, favicon, theme init script, Header, Footer, `<slot/>` | `src/layouts/BaseLayout.astro` |
| **PostLayout** | Build (render) | Post chrome: title, date, tags, cover image, author, reading time, comments slot | `src/layouts/PostLayout.astro` wraps `BaseLayout` |
| **Header / Footer / Nav** | Build (render) | Site-wide navigation, brand, theme toggle slot, RSS link, nav links | `src/components/Header.astro`, `Footer.astro` |
| **PostCard** | Build (render) | One row in a list (home, tag page, archive): title + excerpt + date + tags | `src/components/PostCard.astro` |
| **PostList / Pagination** | Build (render) | Render paginated list of PostCards | `src/pages/[...page].astro` with `paginate()` helper |
| **TagPage / TagCloud** | Build (render) | `/tags/[tag]` pages generated from collection; tag index | `src/pages/tags/[tag].astro` + `getStaticPaths` |
| **HomePage** | Build (render) | Landing: hero + recent posts + newsletter CTA | `src/pages/index.astro` |
| **SEO (Head)** | Build (render) | Per-page meta tags, Open Graph, Twitter cards, JSON-LD (BlogPosting / BreadcrumbList / Person) | `src/components/SEO.astro` consumed by layouts |
| **ThemeToggle** | Runtime (tiny JS) | Switch `data-theme` / `class="dark"` on `<html>`; persist to `localStorage`; respect `prefers-color-scheme` | Inline `<script>` in `<head>` + small button component |
| **Search** | Runtime (WASM, lazy) | Client-side full-text search over build-time index | Pagefind (BM25, chunked index, WASM binary) |
| **CommentsEmbed** | Runtime (iframe, lazy) | Render discussion thread per post; auth via GitHub | giscus (GitHub Discussions) — lazy `<iframe>` below fold |
| **NewsletterForm** | Runtime (form submit) | Capture email; POST to 3rd-party newsletter provider | `<form action="https://buttondown.email/api/...">` or provider embed |
| **Analytics** | Runtime (beacon) | Page-view + CWV telemetry | Plausible / Umami / GA4 (privacy-respecting options preferred) |
| **RSS Generator** | Build | Emit `/rss.xml` from the posts collection | `@astrojs/rss` (or framework equivalent) |
| **Sitemap Generator** | Build | Emit `/sitemap.xml` and submit to search consoles | `@astrojs/sitemap` |
| **Syntax Highlighter** | Build | Tokenize code fences into styled HTML with VS Code grammars | Shiki via rehype-shiki (zero runtime JS) |
| **Image Pipeline** | Build | Responsive sizes, AVIF/WebP, LQIP, `width`/`height` to lock CLS | Astro `<Image />` / `getImage()`, or Sharp |
| **Font Pipeline** | Build | Self-host fonts, subset, preload, `font-display: swap`, metric fallbacks | Fontsource / framework `font` module |

**Key invariant:** the runtime surface is small and strictly optional. A user with JavaScript disabled still gets the full post, navigation, RSS, SEO, and a readable (OS-preference) theme. Search, comments, newsletter, and analytics degrade gracefully.

## Recommended Project Structure

```
sertaoseracloud/
├── src/
│   ├── content/
│   │   ├── posts/                      # .md / .mdx — one file per post
│   │   │   ├── 2026-05-primeiro-post-no-sertao.md
│   │   │   └── 2026-06-aws-serverless-panelada.mdx
│   │   └── authors/                    # future-proof for multi-author (single entry today)
│   │       └── cfraposo.md
│   ├── content.config.ts               # Zod schema for `posts` + `authors` collections
│   ├── components/
│   │   ├── SEO.astro                   # meta, OG, Twitter, JSON-LD
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ThemeToggle.astro           # includes inline head script + button
│   │   ├── PostCard.astro
│   │   ├── TagList.astro
│   │   ├── Pagination.astro
│   │   ├── NewsletterForm.astro        # 3rd-party embed wrapper
│   │   ├── CommentsEmbed.astro         # giscus wrapper (lazy)
│   │   ├── Search.astro                # pagefind UI hook
│   │   └── mdx/                        # MDX-only components (callouts, etc.)
│   │       ├── Callout.astro
│   │       ├── Figure.astro
│   │       └── YouTube.astro
│   ├── layouts/
│   │   ├── BaseLayout.astro            # html/head/body skeleton
│   │   └── PostLayout.astro            # wraps BaseLayout; post-specific chrome
│   ├── pages/
│   │   ├── index.astro                 # HomePage
│   │   ├── sobre.astro                 # About
│   │   ├── posts/
│   │   │   ├── [slug].astro            # renders a post
│   │   │   └── [...page].astro         # paginated archive
│   │   ├── tags/
│   │   │   ├── index.astro             # TagCloud / all tags
│   │   │   └── [tag].astro             # posts filtered by tag
│   │   ├── rss.xml.ts                  # RSS feed
│   │   └── 404.astro
│   ├── styles/
│   │   ├── global.css                  # design tokens (the #284068 / #14878c / #65d7b1 palette)
│   │   ├── typography.css              # prose styles (@tailwindcss/typography overrides)
│   │   └── shiki.css                   # dual-theme variables for code blocks
│   ├── lib/
│   │   ├── reading-time.ts
│   │   ├── get-all-tags.ts
│   │   └── format-date.ts
│   └── consts.ts                       # SITE_URL, SITE_TITLE, AUTHOR, SOCIAL
├── public/
│   ├── favicon.svg
│   ├── robots.txt                      # references /sitemap-index.xml
│   ├── og-default.png                  # fallback Open Graph card
│   └── fonts/                          # self-hosted subset fonts
├── astro.config.mjs                    # integrations: mdx, sitemap, tailwind
├── tailwind.config.mjs                 # dark mode "class", brand palette tokens
├── tsconfig.json
└── package.json
```

### Structure Rationale

- **`src/content/posts/`:** A single canonical location for Markdown. Framework-provided *content collections* (Astro) or equivalent (Next.js `app/posts/*.mdx`, 11ty `_posts/`) give type-safe queries and compile-time frontmatter validation. This is the single source of truth; the rest of the build reads from here.
- **`src/content/authors/` (single entry now):** Future-proofs multi-author without forcing the complexity today. Posts reference an author slug in frontmatter; today that slug always resolves to `cfraposo`. Zero cost now; zero refactor later.
- **`src/components/mdx/`:** Separated from regular components because MDX imports are different: they are auto-available inside `.mdx` via a `components` prop or import map. Keeping them isolated prevents accidental coupling between UI chrome and post content.
- **`src/layouts/`:** Two layouts only — `BaseLayout` for every page, `PostLayout` as a thin wrapper. Resist making more. Deep layout hierarchies are the first sign of over-engineering.
- **`src/pages/`:** File-based routing. Dynamic segments (`[slug]`, `[tag]`, `[...page]`) expand at build time via `getStaticPaths`.
- **`src/styles/`:** Global design tokens in one place (brand palette, spacing, radii). Component-level styling colocated with components.
- **`src/lib/`:** Tiny pure helpers. Not a dumping ground — each file earns its keep.
- **`public/`:** Only static-verbatim assets (favicon, robots, OG fallback, self-hosted fonts). Anything that can benefit from build processing (post images, hero images) lives with the content and is referenced relatively.

## Architectural Patterns

### Pattern 1: Content Collections with Zod Schema

**What:** All posts live in one collection with a compile-time-validated schema. The build fails if a post is missing `title`, `pubDate`, or has an unknown `tag`.

**When to use:** Always, for any Markdown-driven site. It eliminates an entire category of production bugs (missing title, malformed date, typo in draft flag).

**Trade-offs:**
- Pro: type safety, autocompletion, build-time errors, single schema for RSS + SEO + listing.
- Con: slight upfront cost writing the schema (one file, under 50 lines).

**Example:**
```ts
// src/content.config.ts
import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: ({ image }) => z.object({
    title: z.string().max(80),
    description: z.string().max(200),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    cover: image().optional(),
    coverAlt: z.string().optional(),
    author: reference('authors').default('cfraposo'),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/authors' }),
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    avatar: z.string().optional(),
    social: z.object({
      github: z.string().optional(),
      twitter: z.string().optional(),
    }).optional(),
  }),
});

export const collections = { posts, authors };
```

### Pattern 2: Draft / Published State via Frontmatter + Build Filter

**What:** `draft: true` posts are written into the repo but filtered out at build from lists, pages, RSS, and sitemap. No separate branch, no staging environment.

**When to use:** Solo-author workflows. Multi-author workflows need PR-based review instead.

**Trade-offs:**
- Pro: simple, Git-native, no branch juggling.
- Con: drafts are visible on GitHub (fine for a personal blog; not fine for embargoed content).

**Example:**
```ts
// at the top of any list page
const all = await getCollection('posts', ({ data }) => import.meta.env.PROD ? !data.draft : true);
const posts = all.sort((a, b) => +b.data.pubDate - +a.data.pubDate);
```

This also means drafts are visible in `npm run dev` but never in production.

### Pattern 3: Islands (Partial Hydration) for Runtime Features

**What:** The page is static HTML. Only specific interactive components ship JavaScript, and each island hydrates independently.

**When to use:** Any component that needs browser interactivity — theme toggle, search box, comments. Everything else is pure server-rendered HTML.

**Trade-offs:**
- Pro: minimal JS payload, excellent Core Web Vitals, works without JS for the core reading experience.
- Con: each island must justify its JS cost; adding a React-heavy component to every page erases the benefit.

**Example:**
```astro
---
// PostLayout.astro
import CommentsEmbed from '../components/CommentsEmbed.astro';
---
<article>
  <slot />
</article>
<!-- Hydrates only when near viewport -->
<CommentsEmbed client:visible />
```

### Pattern 4: Build-Time Syntax Highlighting with Shiki (Dual Theme)

**What:** Shiki tokenizes every code fence at build time with VS Code grammars and emits inline-styled HTML. Zero runtime JS; zero FOUC. Dual-theme support (light + dark) uses CSS variables so a single rendered HTML works for both themes.

**When to use:** Always for a tech blog with tutorials. Non-negotiable for Core Web Vitals.

**Trade-offs:**
- Pro: perfect fidelity (same grammars VS Code uses), zero client-side cost, works without JS.
- Con: slower builds than Prism. Mitigation: cache Highlighter instances (documented to yield ~80% faster builds on repeated runs).

**Example:**
```ts
// astro.config.mjs — rehype Shiki with dual theme
export default defineConfig({
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
```

CSS:
```css
html.dark .shiki, html.dark .shiki span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
}
```

### Pattern 5: Inline Theme Init Script (FOUC Prevention)

**What:** A tiny inline `<script>` in `<head>` (runs before `<body>` paints) reads `localStorage` + `prefers-color-scheme` and sets `class="dark"` on `<html>` before the first paint.

**When to use:** Always, whenever dark mode is offered. Without this, users see a flash of the wrong theme.

**Trade-offs:**
- Pro: zero flicker, works before any framework hydration, tiny (<500 bytes).
- Con: must be inline (not an external JS file) — any bundler that externalizes it breaks FOUC prevention.

**Example:**
```html
<script is:inline>
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || (!stored && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
</script>
```

### Pattern 6: Third-Party Embed as Lazy Island

**What:** Comments (giscus), newsletter forms, and analytics load only when needed — below the fold, on idle, or on click. The main content never blocks on them.

**When to use:** Every third-party integration on a content site.

**Trade-offs:**
- Pro: preserves LCP, INP, and page weight budgets.
- Con: interaction has a small delay the first time (acceptable for comments; mitigated for forms via `client:idle`).

**Example:**
```astro
<CommentsEmbed client:visible repo="sertaoseracloud/sertaoseracloud" />
<NewsletterForm client:idle />
```

### Pattern 7: MDX for Rich Posts, Markdown for Plain Posts

**What:** Use `.md` by default (fast build, no JS). Upgrade specific posts to `.mdx` only when embedding components (Callout, Figure, Chart). The decision is per-post; both live in the same collection.

**When to use:** Whenever a post needs a diagram, custom callout, embed, or interactive visualization.

**Trade-offs:**
- Pro: keeps the 80% of posts on the fastest path; no JS tax for posts that don't need it.
- Con: authors must remember which extension they chose. Mitigation: `.mdx` is a strict superset of `.md`, so "upgrading" an existing post is just renaming the file.

## Data Flow

### Build-Time Flow (runs on every push)

```
git push
    │
    ▼
CI clones repo ──► install deps ──► run framework build
                                            │
                                            ▼
                 ┌──────────────── Content Collection load ─────────────────┐
                 │  glob("src/content/posts/**/*.{md,mdx}")                  │
                 │  parse frontmatter (gray-matter) → validate (Zod)        │
                 │  drop `draft: true` (prod only)                          │
                 │  sort by pubDate desc                                    │
                 └───────────────────────────┬──────────────────────────────┘
                                             │
           ┌─────────────────────────────────┼────────────────────────────────┐
           │                                 │                                │
           ▼                                 ▼                                ▼
   For each post:                   For tag index:                 For feeds/maps:
   ─────────────────                ─────────────────              ─────────────────
   Markdown/MDX                     collect unique tags            posts → rss.xml
     → remark AST                   for each tag:                  posts → sitemap.xml
     → rehype                         filter collection            urls  → robots.txt
       - shiki (code)                 render TagPage
       - slug + autolink              emit /tags/[tag]/index.html
       - rehype-mermaid (SVG)
     → HTML
     → wrap in PostLayout
     → emit /posts/[slug]/index.html

                                             │
                                             ▼
                         ┌─────── image + font pipeline ────────┐
                         │  images → AVIF + WebP + srcset       │
                         │  fonts  → subset + preload headers   │
                         └───────────────────┬──────────────────┘
                                             │
                                             ▼
                         ┌─────── post-build search index ──────┐
                         │  pagefind --site ./dist              │
                         │  emits /pagefind/*.wasm + fragments  │
                         └───────────────────┬──────────────────┘
                                             │
                                             ▼
                                    Upload /dist → CDN
                                    Invalidate caches
```

### Runtime Flow (what happens in the browser)

```
Request sertaoseracloud.com/posts/foo
    │
    ▼
CDN serves static HTML (cache hit, ~50ms TTFB globally)
    │
    ▼
Browser parses <head>
    │
    ├─► inline theme script runs ─► <html class="dark"> (no FOUC)
    ├─► preload font (swap)        ─► FCP unblocked
    ├─► preload LCP image          ─► LCP optimized
    │
    ▼
Browser renders article HTML (Shiki styles already inline, no work to do)
    │
    │  At this point the page is interactive for reading. JS budget: ~0 KB.
    │
    ├─► on idle    → analytics beacon fires (GET/POST to plausible.io)
    ├─► on idle    → newsletter form script hydrates (minimal)
    ├─► on visible → giscus iframe loads (GitHub Discussions API)
    ├─► on /      → pagefind WASM loaded only when user focuses search input
    └─► on click  → theme toggle mutates <html> class + writes localStorage
```

### Key Data Flows

1. **Post lifecycle:** `author writes .md` → `git commit` → `git push` → `CI build` → `validate schema` → `render HTML` → `upload to CDN` → `visitor reads` → (optional) `visitor comments on GitHub Discussions` → (comments appear next page load, no rebuild needed).

2. **Tag navigation:** at build, `getCollection('posts')` is scanned to compute `uniqueTags`. Each unique tag is a `getStaticPaths` entry emitting `/tags/[tag]`. Visitor clicks a tag → CDN serves a pre-rendered HTML page. No runtime computation.

3. **Search:** at build, Pagefind crawls `dist/` post-build, segments content into fragments, and emits `/pagefind/pagefind.js` + per-page index chunks. At runtime, the search UI loads the WASM binary only when user focuses the input; as the user types, Pagefind fetches only the index chunks needed for that query prefix (BM25 scoring client-side). Result: zero server, zero full-index download.

4. **RSS:** at build, `rss.xml.ts` iterates the same collection, emits XML. Visitor's feed reader GETs `/rss.xml` on its own schedule; CDN serves it with cache headers. No runtime code.

5. **Comments:** at build, `CommentsEmbed` is a static `<script>` tag pointing at giscus. At runtime, giscus JS queries GitHub Discussions API by issue-term (usually the page URL or title), renders an iframe. Comments live in GitHub, not in the repo or the build.

6. **Newsletter capture:** `<form action="https://buttondown.email/api/emails/embed-subscribe/sertaoseracloud" method="POST">` — browser posts directly to provider. Zero server, zero secret in the build. Response handled by provider's redirect or a hidden iframe.

7. **Analytics:** a single 1px beacon on load (`fetch('/api/event', { keepalive: true })` via Plausible/Umami script). Zero PII, runs on `requestIdleCallback`.

### State Management

There is barely any client state. What exists:

```
┌─────────────────────┐
│   localStorage      │◄─── ThemeToggle writes
│   key: "theme"      │
└──────────┬──────────┘
           │ read (inline script, pre-paint)
           ▼
   <html class="dark">
           ▲
           │ toggled on button click
           │
    ThemeToggle button
```

That's the entire client-side state model. No global stores, no context providers, no reducers. Any proposal to add them should be scrutinized heavily.

## Suggested Build Order (Dependency Graph)

Dependencies flow top-to-bottom. Each later phase assumes the prior ones are in place.

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. SCAFFOLDING + BASELAYOUT + SINGLE POST RENDER                │
│    ─ framework init, Tailwind, content collection schema        │
│    ─ src/pages/posts/[slug].astro renders one test post         │
│    ─ blocks: nothing. Output: one visually styled post page.    │
└───────┬─────────────────────────────────────────────────────────┘
        │ requires: collection query API working
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. POST LIST + HOMEPAGE                                         │
│    ─ PostCard component, pagination, HomePage                   │
│    ─ src/pages/index.astro + /posts/[...page].astro             │
│    ─ blocks: requires step 1 rendering pipeline.                │
└───────┬─────────────────────────────────────────────────────────┘
        │ requires: multiple posts, list rendering
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. TAGS + CATEGORIES                                            │
│    ─ tag extraction helper, /tags/index + /tags/[tag]           │
│    ─ tag chip component reused in PostCard + PostLayout         │
│    ─ blocks: requires step 2 list rendering.                    │
└───────┬─────────────────────────────────────────────────────────┘
        │ requires: stable URL structure
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. SEO + SITEMAP + RSS                                          │
│    ─ SEO.astro component: meta, OG, Twitter, JSON-LD            │
│    ─ @astrojs/sitemap integration                               │
│    ─ rss.xml.ts route with @astrojs/rss                         │
│    ─ robots.txt referencing sitemap                             │
│    ─ blocks: requires canonical URLs (step 3 must be settled).  │
└───────┬─────────────────────────────────────────────────────────┘
        │ parallel-safe with 5, 6
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. SYNTAX HIGHLIGHTING + TYPOGRAPHY                             │
│    ─ Shiki integration (dual theme: github-light/dark)          │
│    ─ @tailwindcss/typography + brand overrides                  │
│    ─ prose styles for code, quotes, headings, links             │
│    ─ blocks: independent; can start anytime after step 1.       │
└───────┬─────────────────────────────────────────────────────────┘
        │ must precede 6 so dark mode can restyle code blocks
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. DARK MODE                                                    │
│    ─ tailwind darkMode: 'class'                                 │
│    ─ inline FOUC-prevention script in BaseLayout head           │
│    ─ ThemeToggle button in Header                               │
│    ─ dual-theme CSS for Shiki (var-based swap)                  │
│    ─ blocks: step 5 (so code blocks flip correctly).            │
└───────┬─────────────────────────────────────────────────────────┘
        │ independent thereafter
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. SEARCH                                                       │
│    ─ pagefind as post-build step in npm script                  │
│    ─ data-pagefind-body on <article> wrapper                    │
│    ─ Search.astro UI mounted in Header                          │
│    ─ blocks: requires built site; safe after step 2.            │
└───────┬─────────────────────────────────────────────────────────┘
        │ independent
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. COMMENTS (giscus)                                            │
│    ─ enable GitHub Discussions on repo                          │
│    ─ configure giscus app, get repo-id + category-id            │
│    ─ CommentsEmbed.astro with client:visible                    │
│    ─ blocks: external (GitHub repo setup); otherwise independent│
└───────┬─────────────────────────────────────────────────────────┘
        │ independent
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. NEWSLETTER CAPTURE                                           │
│    ─ choose provider (Buttondown / Beehiiv / Kit free tier)     │
│    ─ embed form or POST-to-provider action                      │
│    ─ place in Footer + end-of-post + /sobre                     │
│    ─ blocks: external (provider signup); otherwise independent  │
└───────┬─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. ANALYTICS + DEPLOY                                          │
│     ─ Plausible / Umami script (privacy-respecting)             │
│     ─ Cloudflare Pages / Vercel / Netlify build config          │
│     ─ connect custom domain sertaoseracloud.com + SSL           │
│     ─ submit sitemap to Google + Bing                           │
│     ─ blocks: everything else (final integration step).         │
└─────────────────────────────────────────────────────────────────┘
```

**Rationale for this ordering:**

- **1 → 2 → 3** establishes the URL surface. Every later feature depends on canonical URLs being stable (SEO, RSS, sitemap, search, comments).
- **4 must come after 3** because sitemap/RSS need the final URL shape. Emitting these before tag pages exist wastes a deploy cycle.
- **5 before 6** because dark mode must restyle Shiki's output; setting up highlighting first lets you verify the dual-theme mechanism works in one go.
- **7, 8, 9 are independent** — they can be parallelized or reordered based on external-dependency readiness (giscus needs Discussions enabled; newsletter needs provider signup).
- **10 last** because custom domain + analytics are post-MVP polish.
- **Deploy early, continuously.** Step 1 should already be live on a preview URL. Every step ships to production when it's merged. The "deploy" in step 10 is really "go live on the custom domain" — the site has been deployed to a staging URL since step 1.

**Critical path for "first post published":** 1 → 2 → 4 (SEO) → 5 (highlighting) → 10 (domain). Everything else can ship post-first-post.

## Extensibility: Adding MDX Components Without Refactoring

The architecture is designed so that **introducing MDX features later requires zero change to existing `.md` posts**.

### How it stays safe

1. **Collection schema is file-agnostic.** The Zod schema validates frontmatter, not content. `.md` and `.mdx` posts pass through the same schema.
2. **Glob pattern includes both.** `glob('**/*.{md,mdx}')` — adding MDX is just enabling the integration.
3. **MDX components live in their own folder.** `src/components/mdx/` is separate from UI components, so they can be added without touching layouts.
4. **Auto-import via MDX provider.** Configure `components={{ Callout, Figure, YouTube }}` once at the MDX integration level (or pass per-import). New components become available in all `.mdx` files without per-file imports.

### Concrete upgrade path

**Today (v1):** all posts are `.md`. No MDX integration enabled.

**When you want callouts:**
```ts
// astro.config.mjs
import mdx from '@astrojs/mdx';
export default defineConfig({ integrations: [mdx()] });
```
Rename one post from `.md` to `.mdx`, add `import Callout from '~/components/mdx/Callout.astro'` at the top (or wire a global components provider), and use `<Callout type="warning">...</Callout>`. Every other `.md` post is untouched.

**When you want Mermaid:**
```ts
// astro.config.mjs
import rehypeMermaid from 'rehype-mermaid';
markdown: { rehypePlugins: [[rehypeMermaid, { strategy: 'img-svg' }]] }
```
Fenced code blocks with language `mermaid` are now rendered server-side into SVG. No per-post changes.

**When you want admonitions in plain `.md`:**
Use a remark plugin like `remark-directive` + a small custom transformer, or switch to `remark-callout` — still a build-time transform, no client JS.

### What would require a refactor (and how to avoid it)

| Change | Refactor cost if unprepared | How the current structure avoids it |
|--------|------------------------------|-------------------------------------|
| Add a second author | Rewrite all posts | `author: reference('authors')` already exists; new author is a new file in `authors/` |
| Add a new frontmatter field | Update every post | Zod schema uses `.optional()` / `.default()` — existing posts stay valid |
| Migrate hosting provider | Rewrite build config | Output is pure static; any provider with Node build + static hosting works |
| Switch framework (Astro → Next) | Rewrite entire site | Content (`src/content/posts/*.md`) is 100% portable; only layouts/pages change |

## Scaling Considerations

For a solo-author blog, "scale" is mostly about post count and CDN traffic, not database load or user concurrency.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0–100 posts** | Current architecture is exactly right. Build times under 30s. Pagefind index well under 1 MB. |
| **100–1,000 posts** | Monitor CI build time. If >2 min: enable Shiki highlighter caching (documented ~80% speedup). Pagefind index chunks scale linearly but fetch on demand, so no change needed. Consider paginated tag pages at ~50 posts/tag. |
| **1,000+ posts** | Incremental builds become valuable. Astro 5 ships content collection caching; Next.js has `generateStaticParams` + ISR. If you stay fully static: consider splitting content into multiple collections (e.g. `posts/` vs `notes/`) and building in parallel. At this scale search index may approach 5–10 MB total — still fine because Pagefind loads chunks on demand, but the initial fragment index grows. |
| **Unlikely-but-if traffic explodes** | Irrelevant. Static files on a CDN scale effectively infinitely on free tiers. Cloudflare Pages, Netlify, and Vercel all have generous free bandwidth ceilings; if you exceed them you have a successful blog and can afford the upgrade. |

### Scaling Priorities

1. **First bottleneck (most likely):** CI build time grows with post count due to Shiki re-tokenizing every code block. Fix: enable Shiki `Highlighter` caching (persisted across builds via the build cache directory). Gain: 5–10x faster rebuilds.
2. **Second bottleneck:** image optimization. Transcoding hundreds of hero images on every build is slow. Fix: cache `dist/_astro/` across builds (most CI providers support this) so only changed images re-transcode.
3. **Third bottleneck:** Pagefind index build on a 1000+ post site. Fix: Pagefind supports selective indexing via `data-pagefind-ignore`; exclude boilerplate regions so fragments stay small.

**Note:** none of these bottlenecks matter until after ~100 posts. Do not pre-optimize.

## Anti-Patterns

### Anti-Pattern 1: Using a Headless CMS for a Solo Blog

**What people do:** Contentful, Sanity, Strapi — "because it's more professional."
**Why it's wrong:** Adds a paid service (violating zero-budget constraint), a network dependency in the build, vendor lock-in, and a second surface to update when schemas change. For single-author Markdown workflow it is pure negative value.
**Do this instead:** Keep content as `.md` files in the repo (PROJECT.md explicitly commits to this). Git is your CMS, your VCS, your backup, and your audit log.

### Anti-Pattern 2: Hydrating Every Component

**What people do:** Import React for the whole page and ship hundreds of KB of JS to render text.
**Why it's wrong:** Destroys Core Web Vitals (LCP, INP), wastes bandwidth, burns mobile battery. For a blog, 95% of content is non-interactive.
**Do this instead:** Default to zero-JS static output. Add `client:visible` / `client:idle` only on the handful of components that genuinely need interactivity (theme toggle, search, comments, newsletter).

### Anti-Pattern 3: Runtime Syntax Highlighting

**What people do:** Load Prism.js or highlight.js at runtime on every post page.
**Why it's wrong:** Ships 50–200 KB of JS per page + runs tokenization on the client, delaying LCP and wasting user CPU. Your code blocks are static — they don't change after build.
**Do this instead:** Shiki at build time. Zero runtime JS, perfect fidelity. The one tradeoff (slower builds) is solved by caching.

### Anti-Pattern 4: Client-Side Search That Downloads the Entire Index

**What people do:** Ship a single Lunr or Fuse.js index blob on page load, even when the user never searches.
**Why it's wrong:** 1–5 MB payload, loaded on every visit, largely unused. Kills mobile performance. (Lunr has also been unmaintained since 2020.)
**Do this instead:** Pagefind. WASM + chunked index fetched on demand when the user actually searches. Orders of magnitude less initial bandwidth.

### Anti-Pattern 5: Disqus for Comments

**What people do:** Drop in the Disqus script because it's easy.
**Why it's wrong:** Loads ~1 MB of third-party JS, shows ads on free tier, hosts tracking cookies, dominates page weight, hurts privacy.
**Do this instead:** giscus (GitHub Discussions). Free, no ads, no tracking, authenticated commenters, spam-resistant via GitHub accounts, owned by the repo owner. Lazy-loaded in an iframe so it never blocks the article.

### Anti-Pattern 6: External Theme-Toggle Script (FOUC)

**What people do:** Put the theme-detection JS in an external `theme.js` file loaded from `<head>`.
**Why it's wrong:** The file blocks on network fetch. The first paint happens with the wrong theme, then flips — a visible, jarring flash.
**Do this instead:** Inline the detection script directly into `<head>`. It's 300 bytes; it runs before paint; the user never sees the wrong theme.

### Anti-Pattern 7: Storing Images in `/public/images/`

**What people do:** Dump all post hero images into `/public/` and reference them as `/images/foo.jpg`.
**Why it's wrong:** Bypasses the build's image pipeline — no AVIF/WebP conversion, no responsive srcset, no automatic `width`/`height` (CLS disaster), no LQIP.
**Do this instead:** Keep cover images next to the post (`src/content/posts/2026-05-foo/cover.jpg`) and reference via `image()` in the Zod schema. Use the framework's `<Image />` / `<Picture />` component in layouts so every image goes through the optimizer.

### Anti-Pattern 8: Embedding Secrets in the Build

**What people do:** Paste a newsletter provider's API key into the repo to POST subscriptions.
**Why it's wrong:** The repo is public. The key leaks immediately.
**Do this instead:** Use provider-hosted embed endpoints (`<form action="https://buttondown.email/api/emails/embed-subscribe/yourname">`) so the browser POSTs directly to the provider. No secret in the build, no server needed. If more control is required, use a free serverless function (Cloudflare Workers free tier) with the key in an env var.

## Integration Points

### External Services (all free-tier)

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **GitHub Discussions (giscus)** | `<script src="https://giscus.app/client.js">` with `data-repo`, `data-repo-id`, `data-category-id`, `data-mapping="pathname"`. Lazy load via `client:visible`. | Requires enabling Discussions on the repo. Use `pathname` mapping so URL ↔ discussion is stable; never use `title` (breaks when titles change). |
| **Buttondown / Beehiiv / Kit** | HTML `<form action="...provider-embed-url..." method="POST">` submits the email directly to provider. | Buttondown is the most dev-friendly and has a free tier up to 100 subscribers; Beehiiv free tier is more generous (2,500 subs) but heavier UI; Kit (formerly ConvertKit) has free tier to 10k. Pick based on tolerance for provider branding. |
| **Plausible / Umami (self-host optional)** | Single `<script defer src="..." data-domain="sertaoseracloud.com">` in `<head>`. | Plausible is paid (free self-host possible); Umami has a free cloud tier. GA4 is free and more featureful but privacy-hostile. Choose based on values. |
| **Cloudflare Pages / Netlify / Vercel** | Git push triggers build; output directory (`dist/`) uploaded to CDN. Custom domain + automatic SSL. | All three have free tiers adequate for a personal blog. Cloudflare Pages has the most generous bandwidth limits. |
| **Google Search Console + Bing Webmaster** | Add TXT record or file verification; submit `/sitemap.xml`. | Indispensable for SEO feedback loop. Set up immediately after first deploy. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Content ↔ Layouts** | Layouts receive collection entries as props; never reach into raw files | Keep layouts file-path-agnostic for portability |
| **Layouts ↔ MDX components** | MDX components passed via `components={}` map, not imported per-post | Enables global swaps (e.g., replace all `<Callout>` implementations at once) |
| **Build ↔ Runtime** | Build emits static HTML + optional per-page JS manifests. Runtime never calls back into build logic. | The only cross-boundary data: `window.PAGEFIND_INDEX_URL`, theme `localStorage` key, giscus data attributes. All serializable, all trivial. |
| **Schema ↔ Everything else** | `content.config.ts` is the single definition of truth for post shape; all consumers (RSS, sitemap, SEO, layout) import from it. | Never duplicate frontmatter types elsewhere. If you need a derived type, `z.infer` it. |

## Sources

Authoritative references (HIGH confidence — official docs or maintainer sources):

- [Content Collections — Astro Docs](https://docs.astro.build/en/guides/content-collections/)
- [Markdown in Astro — Astro Docs](https://docs.astro.build/en/guides/markdown-content/)
- [@astrojs/mdx — Astro Docs](https://docs.astro.build/en/guides/integrations-guide/mdx/)
- [Shiki — Official Guide](https://shiki.style/guide/)
- [Shiki on GitHub (maintainer source)](https://github.com/shikijs/shiki)
- [Pagefind — Official Site](https://pagefind.app/)
- [giscus — Official Site](https://giscus.app/)

Secondary references (MEDIUM confidence — reputable community sources, verified against official docs):

- [Caching Shiki for Faster Build Times — Senvio](https://www.senvio.com/blog/caching-shiki-for-faster-build-times)
- [Pagefind vs Lunr — wmtips](https://www.wmtips.com/technologies/compare/lunr-vs-pagefind/)
- [Replacing Lunr with Pagefind — allaboutken.com](https://www.allaboutken.com/posts/20260228-replacing-lunr-with-pagefind/)
- [Tailwind CSS Dark Mode Toggle with No Flicker — Cruip](https://cruip.com/implementing-tailwind-css-dark-mode-toggle-with-no-flicker/)
- [Astro SEO: the definitive guide — Joost.blog](https://joost.blog/astro-seo-complete-guide/)
- [JSON-LD Structured Data for Blogs — DEV](https://dev.to/didof/json-ld-structured-data-for-blogs-a-real-implementation-25n)
- [Adding Mermaid diagrams to Astro MDX — Xkonti.tech](https://xkonti.tech/blog/astro-mermaid-mdx/)
- [Static Site Comments — darekkay.com](https://darekkay.com/blog/static-site-comments/)
- [Core Web Vitals 2026 — digitalapplied.com](https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide)
- [Front-End Performance in 2026 — vofoxsolutions](https://vofoxsolutions.com/front-end-performance-in-2026)

---

## Amendment — 2026-04-22: Content Sync Pipeline (dev.to → Blog)

### Quatro eixos temporais (substitui os três originais)

Arquitetura original descreveu 3 eixos: **Author → Build → Runtime**. Com dev.to como source e auto-tradução, um 4º eixo é inserido:

1. **Author time** — escrita em [dev.to/@sertaoseracloud](https://dev.to/sertaoseracloud) (EN). Frontmatter `canonical_url` aponta para `https://sertaoseracloud.com/posts/{slug}`.
2. **Sync time** (NOVO) — GH Actions cron (24h) faz poll na Forem API, diffa com posts commitados, traduz EN→PT-BR via Haiku, abre PR.
3. **Build time** — inalterado. Astro compila o markdown mergeado. Shiki re-highlighta blocos de código com temas da marca. Pagefind indexa.
4. **Runtime** — inalterado. JS próximo de zero, islands sob demanda.

### Novos componentes

| Component | Layer | Responsibility | Implementation |
|-----------|-------|----------------|----------------|
| **DevToClient** | Sync | Fetch artigos via Forem API | `GET /api/articles?username=sertaoseracloud&per_page=100` + `GET /api/articles/{id}` para `body_markdown` |
| **DiffDetector** | Sync | Decidir "novo vs atualizado vs inalterado" | SHA-256 do `body_markdown` armazenado no frontmatter `source.hash`. Mismatch ⇒ traduzir |
| **Translator** | Sync | Tradução EN→PT-BR preservando glossário | Claude Haiku 4.5 via `@anthropic-ai/sdk`; system prompt carrega `.planning/glossary.json`; chunks por parágrafo para respeitar context window + retry-on-error |
| **GlossaryEnforcer** | Sync | Lint pós-tradução: verificar termos preservados | Regex — ex.: toda ocorrência de `AWS` em EN deve aparecer em PT; falha sync se drift detectado |
| **PRBuilder** | Sync | Commit markdown traduzido + abrir PR | Action `peter-evans/create-pull-request@v7`; branch `sync/devto-{run}`; título `feat(posts): sync from dev.to`; body linka source dev.to + hash + metadados |

### Data flow

```
┌──────────────────────────────────────────────────────────────────┐
│  AUTHOR writes on dev.to (EN)                                    │
│  Frontmatter: canonical_url = https://sertaoseracloud.com/...    │
└──────────────────────────────┬───────────────────────────────────┘
                               │  polled every 24h (GH Actions cron)
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  SYNC PIPELINE (GitHub Actions — runs in CI, not in Astro)       │
│  1. DevToClient → lista artigos                                  │
│  2. DiffDetector → novos/mudados (source_hash mismatch)          │
│  3. Translator → Haiku EN→PT-BR w/ glossário no system prompt    │
│  4. GlossaryEnforcer → verifica termos preservados               │
│  5. PRBuilder → escreve src/content/posts/{slug}.md, abre PR     │
└──────────────────────────────┬───────────────────────────────────┘
                               │  revisão humana
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  AUTHOR revisa PR → ajustes manuais → merge                      │
└──────────────────────────────┬───────────────────────────────────┘
                               │  webhook on push to main
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  BUILD (Cloudflare Pages / Astro)                                │
│  [inalterado — Content Collections → Shiki → Pagefind → deploy]  │
└──────────────────────────────────────────────────────────────────┘
```

### Extensão do schema Zod (frontmatter)

```ts
// src/content.config.ts — adição ao schema de posts
schema: ({ image }) => z.object({
  // ...campos existentes...
  source: z.object({
    platform: z.literal('dev.to'),
    id: z.number(),
    url: z.string().url(),
    hash: z.string(),                    // SHA-256 do body_markdown
    synced_at: z.coerce.date(),
    translated_by: z.literal('claude-haiku-4-5'),
  }).optional(),                         // opcional para permitir posts manuais no futuro
  canonical_url: z.string().url().optional(),
  manual_override: z.boolean().default(false),  // se true, sync pula esse post
}),
```

### Cron workflow (skeleton)

```yaml
# .github/workflows/sync-devto.yml
name: Sync dev.to → PT-BR posts
on:
  schedule:
    - cron: '0 3 * * *'       # 03:00 UTC = 00:00 BRT (diário)
  workflow_dispatch:           # trigger manual
jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    env:
      MAX_TRANSLATIONS_PER_RUN: 5   # circuit breaker
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: corepack enable && pnpm install --frozen-lockfile
      - run: pnpm run sync:devto
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      - uses: peter-evans/create-pull-request@v7
        with:
          branch: sync/devto-${{ github.run_number }}
          title: 'feat(posts): sync from dev.to (run ${{ github.run_number }})'
          body-path: .github/SYNC_PR_BODY.md
          labels: sync, needs-review
          draft: true            # sempre draft — obriga revisão manual
```

### Estratégia de canonical URL (bidirecional)

| Direção | Campo | Valor |
|---------|-------|-------|
| dev.to → blog | frontmatter do post no dev.to `canonical_url:` | `https://sertaoseracloud.com/posts/{slug}` |
| blog → dev.to | Componente `<SEO>` do Astro `<link rel="canonical">` | `https://sertaoseracloud.com/posts/{slug}` (blog declara-se canonical) |
| Feed RSS | `<link>` em cada `<item>` | URL do blog |

**Resultado:** Google vê blog como canonical; dev.to declara blog como canonical; sem penalidade de duplicate content.

### Invariante atualizada

A invariante original ("usuário sem JS ainda tem post completo") permanece. Nova invariante: **build do site nunca depende do sync em runtime**. Se o sync falha ou dev.to está fora, Cloudflare Pages continua servindo a última versão deployada dos posts traduzidos. Sync é assíncrono ao build; não há dependência crítica de tempo de execução.

---
*Architecture research for: dev.to-sourced + auto-translated personal tech blog (solo author, static output, near-zero-budget)*
*Researched: 2026-04-21 · Amended: 2026-04-22*
