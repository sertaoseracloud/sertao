# Phase 8: Share + OG dinâmico + About/Sobre — Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Every shared post generates a branded OG banner at build time. Share buttons appear at the top and bottom of every post. `/sobre` establishes authorial identity with photo, bio, thesis, and social links.

**In scope:** Dynamic OG image generation (satori, build-time), share buttons component, `/sobre` page.

**Out of scope:** `/palestras`, `/projetos`, `/uses`, `/agora` (Phase 9). Speaking page. Projects page.

</domain>

<decisions>
## Implementation Decisions

### OG Image Generation

- **D-01:** OG images generated via an **Astro endpoint** at `src/pages/og/[...slug].png.ts` using `export const GET`. During `astro build`, Astro calls all GET endpoints and writes the output to `dist/og/{slug}.png`. GitHub Pages serves them as static files. This is the idiomatic Astro approach — no separate build script needed.
- **D-02:** Tech stack: **satori** (HTML/CSS object tree → SVG) + **sharp** (SVG → PNG buffer). Both run at build time in the Astro endpoint. Output: 1200×630 PNG per post.
- **D-03:** `PostLayout.astro` constructs the OG image URL as `/og/${slug}.png` and passes it to `BaseLayout` via the existing `image` prop. `SEO.astro` already emits `og:image` and `twitter:image` when `image` is provided — no changes needed to SEO.astro.

### OG Template Design

- **D-04:** Background: **solid #0A0F1E** (`--abismo-profundo`) — dark navy, matches blog's dark-first design system. No gradient, no texture.
- **D-05:** Template fields (all four selected):
  - **Title** — large, Space Grotesk font, white (`--texto-principal`), wraps up to 2 lines, max ~70 chars before ellipsis
  - **Author name** — "Cláudio Rapôso", smaller, below separator line, white
  - **Site wordmark** — "O Sertão será Cloud", Chakra Petch font, cyan (`--nucleo-eletrico` #00FFFF), paired with author name
  - **First tag** — small badge top-right or bottom-right, `#aws` / `#terraform` style, hairline border, subtle
- **D-06:** Separator line: 2px solid `--nucleo-eletrico` (#00FFFF) between title and author/wordmark row — as shown in the user-selected preview.
- **D-07:** Font loading for satori: embed Space Grotesk and Chakra Petch as base64 data URIs or load from `public/fonts/` WOFF2 files at build time. Self-hosted fonts already exist in `public/fonts/` from Phase 4.

### Share Buttons

- **D-08:** Placement: **top AND bottom of article** — share buttons appear immediately before the article `<header>` AND immediately after the `</article>` closing tag (before NewsletterEmbed). PostLayout updated order: ShareBar → article → ShareBar → NewsletterEmbed → CommentsEmbed.
- **D-09:** Style: **icon + label** — each button shows a small inline SVG icon plus text label: "X", "LinkedIn", "WhatsApp", "Copiar link". Uses design system tokens for colors/borders.
- **D-10:** Buttons are **native `<a>` anchor tags** for X, LinkedIn, WhatsApp (no SDKs, no JS required for share links). Copy-link uses a `<button>` with a short `is:inline` script.
- **D-11:** Share URLs (from ROADMAP):
  - X: `https://twitter.com/intent/tweet?text={title}&url={url}`
  - LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url={url}`
  - WhatsApp: `https://wa.me/?text={title}%20{url}`
  - Copy-link: `navigator.clipboard.writeText(window.location.href)`
- **D-12:** Copy-link feedback: button label **swaps to "Copiado! ✓"** for 2 seconds then reverts to "Copiar link". Implemented with `is:inline` script, no toast library. Pattern consistent with CopyCode.astro.
- **D-13:** New component: `src/components/ShareBar.astro`. Accepts props: `title: string`, `url: string` (full canonical URL). PostLayout passes the post's title and canonical URL.

### /sobre Page

- **D-14:** Layout: **narrative-first prose**. Photo at top-right (floated or grid alongside opening bio paragraph). Structure: opening bio → body paragraphs → "Por que 'O Sertão será Cloud'?" thesis section → social links row.
- **D-15:** Photo: user will place their photo in `public/images/author.jpg` (or similar). Component uses a static `<img src="/images/author.jpg" alt="Cláudio Rapôso">`. If file not present at build time, layout degrades gracefully (photo slot collapses).
- **D-16:** Social links on /sobre: **GitHub, LinkedIn, X, email** — all four selected. LinkedIn URL needs to be added to `src/lib/consts.ts` `SOCIAL` object (currently only has `github` and `devto`). Email: `mailto:engcfraposo@gmail.com` (from session context).
- **D-17:** Page uses the same `BaseLayout` + `.prose` article pattern as `privacidade.astro`. Route: `src/pages/sobre.astro`.

### Claude's Discretion

- Exact satori JSX object tree structure (flexbox layout, padding, font sizes)
- Whether to use `@resvg/resvg-js` instead of sharp for SVG→PNG conversion (either works)
- ShareBar exact border/hover styling within design system tokens
- Whether /sobre social links are a row of icon+label anchors or a styled list
- Fallback for posts with no tags (first tag omitted from OG, rest of template unchanged)
- Exact slug derivation for OG endpoint (use Astro `getCollection` slug or derive from URL)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing components to understand before modifying
- `src/components/SEO.astro` — already handles `og:image` / `twitter:image` via `image` prop; do not duplicate this logic
- `src/layouts/PostLayout.astro` — PostLayout structure to understand ShareBar placement and props flow
- `src/layouts/BaseLayout.astro` — how `image` prop flows from PostLayout → BaseLayout → SEO
- `src/lib/consts.ts` — SITE_URL, AUTHOR, SOCIAL — add LinkedIn here before building /sobre

### Font assets (for satori)
- `public/fonts/` — self-hosted WOFF2 files from Phase 4; Space Grotesk and Chakra Petch available

### Design system
- `src/styles/global.css` — CSS custom properties; OG template colors must reference the hex values directly (satori does not resolve CSS vars at runtime)

### No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SEO.astro` — `image` prop already wired; just populate it from PostLayout
- `CopyCode.astro` — reference for the `is:inline` button-swap pattern used by copy-link feedback
- `CommentsEmbed.astro` — reference for `is:inline` script pattern without client: directive
- `Footer.astro` — social links implementation for reference when building /sobre social row
- `public/fonts/*.woff2` — Space Grotesk and Chakra Petch available for satori font loading

### Established Patterns
- `is:inline` for client-side scripts (no `client:` directive on Astro components)
- Native anchor tags for external links (`target="_blank" rel="noopener noreferrer"`)
- `.prose` article + `BaseLayout` for static pages (see `privacidade.astro`)
- `export const prerender = true` not needed — Astro SSG prerenders all pages by default

### Integration Points
- `PostLayout.astro` receives `title`, `canonicalUrl`, `tags[]` — ShareBar and OG URL can derive from these
- `src/pages/posts/[...slug].astro` (or similar) renders PostLayout — slug available for OG image URL
- `consts.ts` SOCIAL object needs `linkedin` key added before /sobre implementation

</code_context>

<specifics>
## Specific Ideas

- User confirmed they will add author photo to `public/` — planner should include a step noting this authorial action
- OG preview the user selected: title large → cyan separator line → "Cláudio Rapôso · O Sertão será Cloud" footer. This exact layout should be implemented in the satori template.
- Share button layout the user selected: `[ X ]  [ LinkedIn ]  [ WhatsApp ]  [ Copiar link ]` — text labels confirmed

</specifics>

<deferred>
## Deferred Ideas

- Floating sidebar share buttons (considered but user chose top+bottom inline instead)
- /palestras, /projetos, /uses, /agora — explicitly Phase 9 per ROADMAP
- Dark/light OG variant (single dark-only template is sufficient; light theme OG not needed)

</deferred>

---

*Phase: 08-share-og-about*
*Context gathered: 2026-04-29*
