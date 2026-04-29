# Phase 8: Share + OG dinâmico + About — Research

**Researched:** 2026-04-29
**Domain:** Astro SSG endpoints, satori SVG generation, sharp PNG conversion, ShareBar component, static /sobre page
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** OG images generated via Astro endpoint at `src/pages/og/[...slug].png.ts` using `export const GET`. During `astro build`, Astro calls all GET endpoints and writes output to `dist/og/{slug}.png`. GitHub Pages serves them as static files.
- **D-02:** Tech stack: satori (HTML/CSS object tree → SVG) + sharp (SVG → PNG buffer). Both run at build time. Output: 1200×630 PNG per post.
- **D-03:** `PostLayout.astro` constructs OG image URL as `/og/${slug}.png` and passes it to `BaseLayout` via existing `image` prop. SEO.astro already emits `og:image` and `twitter:image` when `image` is provided — no changes needed to SEO.astro.
- **D-04:** Background: solid `#0A0F1E` (`--abismo-profundo`). No gradient, no texture.
- **D-05:** Template fields: Title (Space Grotesk, white, up to 2 lines), Author name ("Cláudio Rapôso", below separator), Site wordmark ("O Sertão será Cloud", Chakra Petch, cyan), First tag badge (top-right, hairline border).
- **D-06:** Separator line: 2px solid `#00FFFF` between title and author/wordmark row.
- **D-07:** Font loading for satori: embed from `public/fonts/` WOFF2 files at build time.
- **D-08:** Placement: ShareBar top AND bottom of article. PostLayout order: ShareBar → article → ShareBar → NewsletterEmbed → CommentsEmbed.
- **D-09:** Style: icon + label (X, LinkedIn, WhatsApp, Copiar link). Design system tokens.
- **D-10:** Native `<a>` tags for X, LinkedIn, WhatsApp. Copy-link uses `<button>` with `is:inline` script.
- **D-11:** Share URLs: X `twitter.com/intent/tweet?text={title}&url={url}`, LinkedIn `linkedin.com/sharing/share-offsite/?url={url}`, WhatsApp `wa.me/?text={title}%20{url}`, Copy-link `navigator.clipboard.writeText(window.location.href)`.
- **D-12:** Copy-link feedback: label swaps to "Copiado! ✓" for 2 seconds then reverts. `is:inline` script, no toast library. Pattern consistent with CopyCode.astro.
- **D-13:** New component: `src/components/ShareBar.astro`. Props: `title: string`, `url: string`.
- **D-14:** /sobre layout: narrative-first prose. Photo top-right (floated). Bio → thesis → social links row.
- **D-15:** Photo: static `<img src="/images/author.jpg" alt="Cláudio Rapôso">`. Graceful degradation if absent.
- **D-16:** Social links: GitHub, LinkedIn, X, email. LinkedIn URL added to `consts.ts` SOCIAL object.
- **D-17:** /sobre uses same `BaseLayout` + `.prose` pattern as `privacidade.astro`. Route: `src/pages/sobre.astro`.

### Claude's Discretion

- Exact satori JSX object tree structure (flexbox layout, padding, font sizes)
- Whether to use `@resvg/resvg-js` instead of sharp for SVG→PNG conversion (either works)
- ShareBar exact border/hover styling within design system tokens
- Whether /sobre social links are a row of icon+label anchors or a styled list
- Fallback for posts with no tags (first tag omitted from OG, rest of template unchanged)
- Exact slug derivation for OG endpoint (use Astro `getCollection` slug or derive from URL)

### Deferred Ideas (OUT OF SCOPE)

- Floating sidebar share buttons
- /palestras, /projetos, /uses, /agora (Phase 9)
- Dark/light OG variant (single dark-only template sufficient)

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-OG-01 | OG image endpoint at `src/pages/og/[...slug].png.ts` generates 1200×630 PNG per post at build time | Astro endpoint + getStaticPaths pattern; satori + sharp pipeline; font loading via WOFF from Fontsource node_modules |
| REQ-OG-02 | OG template: #0A0F1E background, title (Space Grotesk), cyan separator, author + wordmark row, first-tag badge | satori object tree structure; hex values only (no CSS vars); font embedding pattern |
| REQ-SHARE-01 | ShareBar component with X/LinkedIn/WhatsApp/copy-link, top and bottom of PostLayout | Native anchor pattern verified in existing codebase; CopyCode.astro is-inline pattern reuse |
| REQ-SOBRE-01 | /sobre static page with photo, bio, thesis, social links | privacidade.astro pattern reuse; consts.ts SOCIAL extension required |

</phase_requirements>

---

## Summary

Phase 8 implements three independent sub-features that can be planned and executed in sequence or parallel waves. The OG image endpoint is the most technically complex item and has one non-obvious constraint: **satori does not support WOFF2 font format** — the project's `public/fonts/` directory contains only WOFF2 files, but the installed `@fontsource/space-grotesk`, `@fontsource/chakra-petch`, and `@fontsource/jetbrains-mono` devDependencies include **WOFF files** in their `node_modules/.../files/` subdirectories. These WOFF files are already available on disk and can be read with `fs.readFileSync` at build time without any additional installation.

The Astro endpoint pattern for build-time OG generation is well-established: a `src/pages/og/[...slug].png.ts` file exports both `getStaticPaths` (using `getCollection('posts')`) and `GET` (calling satori + sharp, returning `new Response(pngBuffer, { headers: { 'Content-Type': 'image/png' } })`). In SSG mode (which this project uses), Astro prerenders all GET endpoints by default — no `export const prerender = true` needed. The existing `[...slug].astro` already demonstrates the correct slug derivation pattern using `post.id.replace(/\.[^.]+$/, '')`.

The ShareBar and /sobre sub-features are straightforward extensions of established patterns already in the codebase. CopyCode.astro demonstrates the exact `<script>` (not `is:inline`) + clipboard API + label-swap pattern. The privacidade.astro page is the direct template for sobre.astro's structure.

**Primary recommendation:** Implement in three waves: Wave 1 (OG endpoint + font loading + template), Wave 2 (ShareBar component + PostLayout wiring), Wave 3 (/sobre page + consts.ts SOCIAL update + authorial photo action).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| OG image generation | Build step (Astro endpoint) | — | Pure SSG: runs once at `astro build`, output is static PNG file served by GitHub Pages |
| og:image / twitter:image meta tags | Frontend Server (SSR/PostLayout) | — | PostLayout constructs the `/og/{slug}.png` URL, passes to BaseLayout → SEO.astro |
| Share link construction | Frontend Server (PostLayout) | — | URL encoding of title + canonical URL happens in Astro template at build time |
| Copy-link clipboard interaction | Browser / Client | — | `navigator.clipboard` is browser API; `is:inline` script runs client-side |
| /sobre page rendering | Build step (Astro SSG) | — | Static page, no dynamic data |
| LinkedIn URL in SOCIAL | Build step (consts.ts) | — | Compile-time constant consumed by /sobre and potentially Footer |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| satori | 0.26.0 | HTML/CSS object tree → SVG string | Official Vercel library for OG image generation; widely used in Astro ecosystem |
| sharp | 0.34.5 | SVG buffer → PNG buffer | Industry standard image processing for Node.js; faster than alternatives for this use case |

[VERIFIED: npm registry — `npm view satori version` → 0.26.0; `npm view sharp version` → 0.34.5]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @fontsource/space-grotesk | 5.2.10 (already installed) | WOFF font files for satori | Read `node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff` at build time |
| @fontsource/chakra-petch | 5.2.7 (already installed) | WOFF font files for satori | Read `node_modules/@fontsource/chakra-petch/files/chakra-petch-latin-400-normal.woff` at build time |
| @fontsource/jetbrains-mono | 5.2.8 (already installed) | WOFF font files for satori | Read `node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff` at build time |

[VERIFIED: `ls node_modules/@fontsource/space-grotesk/files/` confirms WOFF files present alongside WOFF2]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sharp | @resvg/resvg-js | resvg-js is slightly simpler API (`new Resvg(svg).render().asPng()`); sharp has more options; both work in Node.js SSG |
| WOFF from node_modules | Google Fonts CDN fetch at build time | CDN fetch is fragile (network dependency at build); node_modules is fully offline — prefer node_modules |
| WOFF from node_modules | Copy TTF to public/fonts/ | TTF files not in Fontsource packages (only WOFF/WOFF2); extracting WOFF from node_modules is simplest |

**Installation:**

```bash
pnpm add satori sharp
```

No additional font packages needed — @fontsource packages already installed as devDependencies.

**Version verification:**

```bash
npm view satori version   # 0.26.0
npm view sharp version    # 0.34.5
```

---

## Architecture Patterns

### System Architecture Diagram

```
astro build
    │
    ├── getCollection('posts')
    │       │
    │       └── posts[] ──► getStaticPaths() ──► params: { slug }[]
    │
    └── For each slug:
            │
            GET /og/{slug}.png.ts
                    │
                    ├── getCollection('posts') — find post by slug
                    ├── post.data.title, post.data.tags
                    │
                    ├── fs.readFileSync(node_modules/@fontsource/.../FONT.woff)
                    │       └── ArrayBuffer ──► satori fonts[]
                    │
                    ├── satori(objectTree, { width:1200, height:630, fonts })
                    │       └── SVG string
                    │
                    ├── sharp(Buffer.from(svg)).png().toBuffer()
                    │       └── PNG Buffer
                    │
                    └── new Response(pngBuffer, { 'Content-Type': 'image/png' })
                                └── dist/og/{slug}.png (static file)


PostLayout.astro (build time)
    │
    ├── receives: title, tags, canonicalUrl
    ├── constructs: image = `${SITE_URL}/og/${slug}.png`
    └── passes image prop ──► BaseLayout ──► SEO.astro
                                                └── <meta property="og:image">
                                                └── <meta name="twitter:image">


ShareBar.astro (build time, rendered into HTML)
    │
    ├── props: title, url (canonical URL)
    ├── <a href="twitter.com/intent/tweet?..."> X
    ├── <a href="linkedin.com/sharing/..."> LinkedIn
    ├── <a href="wa.me/?text=..."> WhatsApp
    └── <button is:inline> Copiar link
                └── navigator.clipboard.writeText(window.location.href)
                └── label swap "Copiar link" → "Copiado! ✓" → revert (2s)
```

### Recommended Project Structure

```
src/
├── pages/
│   ├── og/
│   │   └── [...slug].png.ts     # new — OG image endpoint
│   └── sobre.astro              # new — /sobre page
├── components/
│   └── ShareBar.astro           # new — share buttons component
└── lib/
    └── consts.ts                # modify — add linkedin to SOCIAL
```

### Pattern 1: Astro Build-Time Image Endpoint

**What:** A `.ts` file in `src/pages/` that exports `getStaticPaths` + `GET` and returns a binary `Response`. In SSG mode, Astro renders all paths at build time.

**When to use:** Any time a per-post binary file (image, PDF) needs to be generated at build time from content collection data.

**Example:**

```typescript
// src/pages/og/[...slug].png.ts
// Source: Verified pattern from https://bepyan.me/en/post/astro-dynamic-og
//         + https://arne.me/blog/static-og-images-in-astro
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

const posts = await getCollection('posts', ({ data }) =>
  import.meta.env.PROD ? !data.draft : true,
);

export function getStaticPaths() {
  return posts.map((post) => ({
    params: { slug: post.id.replace(/\.[^.]+$/, '') },
    props: { post },
  }));
}

export async function GET({ props }: APIContext) {
  const { post } = props as { post: (typeof posts)[0] };

  // Font loading — WOFF from Fontsource node_modules (satori does NOT support WOFF2)
  const spaceGroteskData = fs.readFileSync(
    path.resolve(
      'node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff',
    ),
  );
  // ... additional fonts

  const svg = await satori(buildObjectTree(post.data), {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Space Grotesk', data: spaceGroteskData.buffer, weight: 600, style: 'normal' },
    ],
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  });
}
```

### Pattern 2: satori Object Tree (No JSX)

**What:** satori accepts a plain JS object tree instead of JSX. The top-level element must have `display: 'flex'` for layout to work — satori only implements flexbox, not block layout.

**When to use:** Always in `.ts` endpoints (not `.tsx`). The project does not use TSX.

**Example:**

```typescript
// Source: Verified from satori README https://github.com/vercel/satori
// + confirmed via multiple Astro blog examples
function buildObjectTree(data: { title: string; tags?: string[] }) {
  return {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#0A0F1E',
        padding: '72px 80px',
      },
      children: [
        // Top section: tag badge + title
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '24px' },
            children: [
              // Tag badge (if tags[0] exists)
              ...(data.tags?.[0]
                ? [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          fontSize: '22px',
                          fontFamily: 'Chakra Petch',
                          color: '#D1D9E6',
                          border: '1px solid rgba(209,217,230,0.3)',
                          padding: '4px 12px',
                          alignSelf: 'flex-start',
                        },
                        children: `#${data.tags[0].toUpperCase()}`,
                      },
                    },
                  ]
                : []),
              // Title
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: '64px',
                    fontWeight: 600,
                    fontFamily: 'Space Grotesk',
                    color: '#FFFFFF',
                    lineHeight: 1.15,
                  },
                  children: data.title,
                },
              },
            ],
          },
        },
        // Separator line
        {
          type: 'div',
          props: {
            style: { width: '100%', height: '2px', backgroundColor: '#00FFFF', margin: '32px 0' },
          },
        },
        // Bottom row: author + wordmark
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column', gap: '4px' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: '28px', fontFamily: 'Space Grotesk', color: '#FFFFFF' },
                        children: 'Cláudio Rapôso',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: '24px', fontFamily: 'Chakra Petch', color: '#00FFFF' },
                        children: 'O Sertão será Cloud',
                      },
                    },
                  ],
                },
              },
              // Site URL (right side)
              {
                type: 'div',
                props: {
                  style: { fontSize: '18px', fontFamily: 'JetBrains Mono', color: 'rgba(209,217,230,0.6)' },
                  children: 'sertaoseracloud.com',
                },
              },
            ],
          },
        },
      ],
    },
  };
}
```

### Pattern 3: is:inline Copy-Link (from CopyCode.astro)

**What:** `<script>` tag without `is:inline` in Astro components is bundled by Vite. `is:inline` preserves the script verbatim and runs it in the page context without module scope. Used for lightweight imperative DOM operations.

**When to use:** When the script needs direct access to DOM elements in the same template, no imports are needed, and the script must run on every page load without Astro's module system.

**Example (from CopyCode.astro — verified in codebase):**

```typescript
// Pattern: querySelector the button, addEventListener click,
// navigator.clipboard.writeText(...), then label swap with setTimeout
// CopyCode.astro uses <script> (not is:inline) — it bundles properly
// For ShareBar copy-link: use is:inline since it's within the same component
// and needs access to a specific button by ID or class
```

**Critical distinction:** CopyCode.astro uses `<script>` (not `is:inline`) — Astro bundles this and runs it client-side. ShareBar should use `is:inline` on the `<button>` copy-link element directly per D-12. The pattern is confirmed by CommentsEmbed.astro which also uses `is:inline`.

### Anti-Patterns to Avoid

- **Using WOFF2 font files with satori:** satori only supports TTF, OTF, and WOFF. Reading `public/fonts/*.woff2` files as font data will silently fail or throw. Use WOFF files from Fontsource node_modules instead.
- **Importing WOFF files as ES modules:** Do not `import fontData from '...'` — read with `fs.readFileSync(path.resolve('node_modules/...'))`. ES module imports of binary fonts trigger Rollup warnings or errors in Astro SSG.
- **`export const prerender = true` in endpoints:** Not needed. In SSG mode (`output: 'static'`, which is the default), all endpoints prerender by default. Adding it is harmless but redundant.
- **Using `post.slug` instead of `post.id`:** In Astro 6 with `legacy.collectionsBackwardsCompat: true`, the existing `[...slug].astro` uses `post.id.replace(/\.[^.]+$/, '')` to derive the slug. The OG endpoint MUST use the same derivation to ensure URL consistency.
- **Calling satori without `display: 'flex'` on the root:** satori implements flexbox only. Block layout does not work. Every container div must have `display: 'flex'`.
- **Putting satori/sharp imports inside the GET function:** Top-level `await getCollection` is valid in Astro endpoints (runs at build time). However, `fs.readFileSync` calls for font loading should be done once at module level (or cached) to avoid re-reading on every invocation during build.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG from HTML layout | Custom SVG string builder | satori | Flexbox layout engine + font embedding already implemented; hand-rolled SVG cannot handle text wrapping, proper font metrics |
| SVG → PNG conversion | Canvas-based renderer | sharp | Handles alpha, color profiles, compression; robust against malformed SVG |
| Social share URLs | Custom URL encoder | Template literals with `encodeURIComponent` | The share URL formats are fixed APIs with documented parameters — no library needed |
| Clipboard API with fallback | Custom execCommand fallback | `navigator.clipboard.writeText` + silent catch | execCommand is deprecated; modern browsers support Clipboard API; silent failure is the correct UX |

**Key insight:** The OG pipeline (satori + sharp) is the industry standard for build-time image generation in SSG frameworks. The two dozen Node.js edge cases around font loading, text metrics, and image format are already handled.

---

## Common Pitfalls

### Pitfall 1: WOFF2 is Not Supported by satori

**What goes wrong:** Developer reads font file from `public/fonts/space-grotesk-600.woff2`, passes buffer to satori fonts array. satori silently fails to render text or throws a font parsing error.

**Why it happens:** satori uses opentype.js internally, which does not support the brotli compression used in WOFF2. [VERIFIED: github.com/vercel/satori/discussions/157]

**How to avoid:** Use WOFF format. The Fontsource devDependencies already installed in this project (`@fontsource/space-grotesk`, etc.) include `.woff` files alongside `.woff2` in `node_modules/@fontsource/{family}/files/`. Read with `fs.readFileSync(path.resolve('node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff'))`.

**Warning signs:** Build succeeds but OG images show no text, or blank white rectangles where text should be.

### Pitfall 2: Slug Mismatch Between Post Route and OG Endpoint

**What goes wrong:** OG endpoint generates `/og/my-post.png` but PostLayout constructs URL `/og/my-post` (no extension) or uses a different slug format.

**Why it happens:** The endpoint filename adds `.png` to the route; the slug derivation must match `post.id.replace(/\.[^.]+$/, '')` exactly as used in `[...slug].astro`.

**How to avoid:** Verify the slug derivation in both files is identical. The existing `[...slug].astro` is the reference implementation.

**Warning signs:** og:image meta tag points to 404 URL; LinkedIn/X card validator shows "image not found."

### Pitfall 3: satori Root Element Missing `display: 'flex'`

**What goes wrong:** Layout renders incorrectly — elements stack in unexpected ways or overflow the canvas.

**Why it happens:** satori implements only CSS flexbox, not block/flow layout. Without `display: 'flex'`, the root div does not establish a flex formatting context.

**How to avoid:** Every container element in the satori object tree must include `display: 'flex'` in its style. Even leaf text nodes should not rely on block layout.

**Warning signs:** Title text overflows to one line despite wrapping attempt; bottom row elements overlap the separator.

### Pitfall 4: `children` Must Be String or Single Object for Text Nodes

**What goes wrong:** `children: ['text', ' ', 'more']` renders nothing or throws.

**Why it happens:** satori's `children` accepts: a string (leaf text), a single object, or an array of objects. Mixed string/object arrays are not supported.

**How to avoid:** Wrap concatenated text in a single string. Use nested div elements when combining text spans with different styles.

### Pitfall 5: ShareBar Rendered With Server-Side URL vs. Client URL

**What goes wrong:** Copy-link script uses `window.location.href` but the share anchor tags use a server-constructed `url` prop. These can diverge if the canonical URL differs from the actual browser URL.

**Why it happens:** The `url` prop from PostLayout is the canonical URL from consts.ts + slug. `window.location.href` is whatever the browser shows.

**How to avoid:** For copy-link, using `window.location.href` is correct per D-11 — it captures the actual browser URL. The `<a>` social share buttons use the server-constructed canonical URL prop, which is also correct (sharing should use canonical, not potentially redirected URL).

### Pitfall 6: `post.data.tags` May Be Empty Array

**What goes wrong:** OG template tries to render `tags[0]` badge and throws `Cannot read property 'toUpperCase' of undefined`.

**Why it happens:** The content schema defaults `tags` to `[]`. Some posts may have no tags.

**How to avoid:** Guard with `data.tags?.[0]` before rendering the badge. When absent, omit the badge entirely from the object tree — the separator and bottom row layout must remain valid.

---

## Code Examples

### OG Endpoint: Complete Skeleton

```typescript
// src/pages/og/[...slug].png.ts
// Source: verified pattern from bepyan.me/en/post/astro-dynamic-og
//         + arne.me/blog/static-og-images-in-astro
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

// Run once at module level (build time) — not inside GET
const posts = await getCollection('posts', ({ data }) =>
  import.meta.env.PROD ? !data.draft : true,
);

// Font loading at module level — read once, reuse for all paths
const spaceGrotesk600 = fs.readFileSync(
  path.resolve('node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff'),
);
const chakraPetch400 = fs.readFileSync(
  path.resolve('node_modules/@fontsource/chakra-petch/files/chakra-petch-latin-400-normal.woff'),
);
const jetbrainsMono400 = fs.readFileSync(
  path.resolve('node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff'),
);

export function getStaticPaths() {
  return posts.map((post) => ({
    params: { slug: post.id.replace(/\.[^.]+$/, '') },
    props: { post },
  }));
}

export async function GET({ props }: APIContext) {
  const { post } = props as { post: (typeof posts)[0] };

  const svg = await satori(
    buildOgTemplate({
      title: post.data.title,
      tags: post.data.tags,
    }),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Space Grotesk', data: spaceGrotesk600.buffer, weight: 600, style: 'normal' },
        { name: 'Chakra Petch', data: chakraPetch400.buffer, weight: 400, style: 'normal' },
        { name: 'JetBrains Mono', data: jetbrainsMono400.buffer, weight: 400, style: 'normal' },
      ],
    },
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  });
}
```

### PostLayout OG URL Construction

```typescript
// In src/pages/posts/[...slug].astro — the slug derivation is already:
// params: { slug: post.id.replace(/\.[^.]+$/, '') }
// So the OG URL in PostLayout becomes:
// (PostLayout receives no slug prop currently — need to thread it through)

// In src/pages/posts/[...slug].astro:
const slug = post.id.replace(/\.[^.]+$/, '');
// Pass to PostLayout:
// <PostLayout ... ogImage={`${SITE_URL}/og/${slug}.png`}>
// OR construct inside PostLayout if slug is derivable from canonicalUrl

// Current PostLayout.astro already receives canonicalUrl and image props.
// Simplest: construct in [..slug].astro and pass as image prop:
import { SITE_URL } from '../../lib/consts';
// image={`${SITE_URL}/og/${slug}.png`}
```

### ShareBar is:inline Copy Script

```typescript
// src/components/ShareBar.astro
// Source: pattern derived from CommentsEmbed.astro (is:inline verified) + CopyCode.astro (label-swap pattern)
<button id="copy-link-btn" class="share-btn" aria-label="Copiar link do artigo">
  <!-- icon SVG --> Copiar link
</button>

<script is:inline>
  (function () {
    var btn = document.getElementById('copy-link-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(window.location.href).then(function () {
        btn.textContent = 'Copiado! ✓';
        btn.setAttribute('aria-label', 'Link copiado');
        setTimeout(function () {
          btn.textContent = 'Copiar link';
          btn.setAttribute('aria-label', 'Copiar link do artigo');
        }, 2000);
      }).catch(function () {
        // Silent failure — same pattern as CopyCode.astro
      });
    });
  })();
</script>
```

**Note on multiple ShareBar instances:** PostLayout renders ShareBar twice (top + bottom). Both instances will have `id="copy-link-btn"`, causing `getElementById` to find only the first. Use class-based `querySelectorAll` instead, or unique IDs (`copy-link-btn-top` / `copy-link-btn-bottom`).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Serverless edge function for OG images | Build-time endpoint (SSG) | 2022–2023 | Eliminates runtime cost; compatible with static GitHub Pages hosting |
| @vercel/og (Vercel-specific) | satori (standalone, same author) | 2022 | satori is the library that powers @vercel/og; using it directly avoids Vercel lock-in |
| Canvas/Puppeteer for OG images | satori + sharp | 2021–2022 | Headless browser is 10x slower and heavier; satori is WASM-based and fast at build time |
| TTF/OTF fonts in satori | WOFF from node_modules (this project) | n/a | WOFF2 never supported; WOFF is faster to parse than TTF on server-side per satori maintainers |

**Deprecated/outdated:**
- `@vercel/og` as a Vercel function: Not applicable here (GitHub Pages static hosting). Use satori directly.
- `export const get` (lowercase): Old Astro API. Current API is `export const GET` (uppercase). [VERIFIED: docs.astro.build/en/guides/endpoints/]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Fontsource WOFF files are stable across patch versions and their file paths (`/files/{family}-latin-{weight}-normal.woff`) do not change | Standard Stack | Font loading in OG endpoint fails at build time if path changes after pnpm update |
| A2 | `post.id.replace(/\.[^.]+$/, '')` produces slugs consistent with the URL paths that PostLayout constructs for canonical URLs | Pattern 1 (slug derivation) | OG image URL in og:image meta would not match the generated file path in dist/ |
| A3 | LinkedIn sharing via `linkedin.com/sharing/share-offsite/?url=` continues to work without API keys or OAuth for basic share intents | Standard Stack (share URLs) | LinkedIn share button fails silently or requires authentication |

A2 is LOW RISK — confirmed by reading both `[...slug].astro` (params derivation) and existing behavior. The slug format is `post.id` minus extension, which matches the URL path.

---

## Open Questions

1. **Multiple ShareBar instances and `getElementById` collision**
   - What we know: PostLayout renders ShareBar twice; if both use `id="copy-link-btn"`, `getElementById` finds only the first DOM occurrence.
   - What's unclear: Whether to use unique IDs per instance or switch to class-based selection.
   - Recommendation: Use `this` or `event.target` in the click handler, or apply `querySelectorAll('.share-copy-btn')` to wire all instances. Simplest: give each button a unique ID at render time using `Math.random()` or a counter. Alternatively: use a single `<script>` that wires ALL `.share-copy-btn` elements — this is the pattern CopyCode.astro uses with `querySelectorAll`.

2. **`import.meta.url` vs `path.resolve()` for font file paths in Astro endpoints**
   - What we know: `fs.readFileSync(path.resolve('node_modules/...'))` works when the CWD is the project root, which is the case during `astro build`.
   - What's unclear: Whether Astro's Vite build changes the CWD.
   - Recommendation: Use `path.resolve('node_modules/...')` — this is confirmed in multiple Astro OG image tutorials. If it fails, fallback: `new URL('../../node_modules/...', import.meta.url).pathname`.

3. **`post.data as any` cast for image prop in `[...slug].astro`**
   - What we know: Current code uses `(post.data as any).coverImageUrl ?? undefined` for the `image` prop. With OG images, the image prop will now always be `/og/${slug}.png`.
   - What's unclear: Should the static OG URL replace or supplement the `coverImageUrl`?
   - Recommendation: OG URL takes precedence as the `og:image` — pass it as `image` prop directly. The `coverImageUrl` was used as an in-page cover image, which is a different concern. The `image` prop in PostLayout should become `${SITE_URL}/og/${slug}.png` unconditionally (the OG endpoint handles all posts).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js ≥22.12.0 | satori + sharp (native ESM) | ✓ | (project requirement) | — |
| satori | OG image endpoint | ✗ (not yet in package.json) | 0.26.0 latest | — |
| sharp | OG image endpoint | ✗ (not yet in package.json) | 0.34.5 latest | @resvg/resvg-js |
| @fontsource/space-grotesk WOFF files | Font data for satori | ✓ | 5.2.10 (devDep, files present) | — |
| @fontsource/chakra-petch WOFF files | Font data for satori | ✓ | 5.2.7 (devDep, files present) | — |
| @fontsource/jetbrains-mono WOFF files | Font data for satori | ✓ | 5.2.8 (devDep, files present) | — |
| public/images/author.jpg | /sobre page photo | ✗ (authorial action) | — | Layout degrades gracefully |

**Missing dependencies with no fallback:**
- `satori` and `sharp` — must be installed (`pnpm add satori sharp`) in Wave 0 of the plan.

**Missing dependencies with fallback:**
- `public/images/author.jpg` — authorial action; the `<img>` renders but browser shows broken image placeholder. Not a build blocker.

[VERIFIED: `cat package.json` confirms satori and sharp not in dependencies or devDependencies]

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | node:test (built-in, no config file) |
| Config file | none — `node --test` pattern from Phase 2 |
| Quick run command | `pnpm astro build` (smoke test — verifies endpoint runs without throwing) |
| Full suite command | `pnpm astro build && pnpm preview` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-OG-01 | OG endpoint generates PNG for each post | smoke | `pnpm build` (Astro calls GET for all paths; failure = build error) | ❌ Wave 0 — endpoint file to be created |
| REQ-OG-02 | OG PNG dimensions are 1200×630 | manual | Open `dist/og/{slug}.png` in browser, verify dimensions | ❌ Wave 0 |
| REQ-SHARE-01 | ShareBar renders with 4 buttons at top and bottom of post | manual | `pnpm dev`, navigate to a post, visually verify | ❌ Wave 0 |
| REQ-SHARE-01 | Copy-link button swaps label and reverts after 2s | manual | Click "Copiar link" in dev server | ❌ Wave 0 |
| REQ-SOBRE-01 | /sobre page renders without error | smoke | `pnpm build` (build failure if template error) | ❌ Wave 0 |
| REQ-OG-01 | og:image meta tag present in post HTML | smoke | `pnpm build && grep 'og:image' dist/posts/*/index.html` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm astro check` (TypeScript diagnostics)
- **Per wave merge:** `pnpm build` (full static build including all OG endpoints)
- **Phase gate:** `pnpm build` green + LinkedIn Post Inspector validates OG card + manual visual check on ShareBar

### Wave 0 Gaps

- [ ] `pnpm add satori sharp` — packages not yet installed
- [ ] Create `src/pages/og/[...slug].png.ts` — covers REQ-OG-01, REQ-OG-02
- [ ] Create `src/components/ShareBar.astro` — covers REQ-SHARE-01
- [ ] Create `src/pages/sobre.astro` — covers REQ-SOBRE-01
- [ ] Modify `src/lib/consts.ts` to add `linkedin` to SOCIAL — covers REQ-SOBRE-01

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes (limited) | OG endpoint reads post data from content collection (trusted source, Zod-validated) — no user input |
| V6 Cryptography | no | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SVG injection via post title in OG template | Tampering | satori sanitizes text content — post title is passed as JS string, not HTML. Content collection Zod schema limits title to 80 chars. |
| Open redirect via share URL construction | Tampering | Share URLs use fixed templates with `encodeURIComponent` on title and URL; no user-controlled redirect targets |
| XSS via copy-link is:inline | Tampering | `window.location.href` is not rendered into DOM; `clipboard.writeText` is write-only; no injection surface |

---

## Sources

### Primary (HIGH confidence)

- [satori GitHub README](https://github.com/vercel/satori/blob/main/README.md) — function signature, font format support, JSX object tree format
- [satori WOFF2 discussion](https://github.com/vercel/satori/discussions/157) — WOFF2 not supported, TTF/WOFF recommended
- [Astro endpoints docs](https://docs.astro.build/en/guides/endpoints/) — GET export, getStaticPaths, prerender behavior
- `node_modules/@fontsource/space-grotesk/files/` — WOFF files verified present on disk
- `src/pages/posts/[...slug].astro` — slug derivation pattern `post.id.replace(/\.[^.]+$/, '')`
- `src/components/CopyCode.astro` — label-swap pattern reference
- `src/pages/privacidade.astro` — /sobre page structure template
- `src/components/SEO.astro` — confirms `image` prop already wired for og:image/twitter:image
- `package.json` — confirms satori/sharp NOT yet installed; @fontsource packages ARE installed

### Secondary (MEDIUM confidence)

- [Static OG Images in Astro — arne.me](https://arne.me/blog/static-og-images-in-astro) — endpoint pattern with getStaticPaths + GET
- [Generate Dynamic OG Images — bepyan.me](https://bepyan.me/en/post/astro-dynamic-og) — complete endpoint code with WOFF font loading
- [Generate OG images — mfyz.com](https://mfyz.com/generate-beautiful-og-images-astro-satori/) — font loading from public/ + sharp SVG to PNG

### Tertiary (LOW confidence)

- Multiple WebSearch results confirming satori + sharp as standard Astro OG pattern (cross-verified with official satori README)

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — satori 0.26.0 and sharp 0.34.5 verified via npm registry; font formats verified by inspecting node_modules
- Architecture: HIGH — endpoint pattern verified from Astro docs + multiple Astro blog examples + existing codebase slug derivation
- WOFF2 pitfall: HIGH — verified from official satori GitHub discussion and README
- Pitfalls: HIGH — most derived from direct codebase inspection + satori documentation
- ShareBar / /sobre patterns: HIGH — derived entirely from existing codebase (CopyCode.astro, privacidade.astro, CommentsEmbed.astro)

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (satori and sharp are stable; font format limitation is a known design decision unlikely to change)
