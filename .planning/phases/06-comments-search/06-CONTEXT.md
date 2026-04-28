# Phase 6: Comments + Search - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Readers can comment (via GitHub identity) and search posts by free text. No backend required — all integrations are static/CDN-based.

**In scope:** Giscus comment embed, Pagefind search modal (Ctrl+K), tag chip display on post cards, `/tags/` index page, `/tags/{tag}` filter pages.

**Out of scope:** Own reactions (Giscus provides via GitHub reactions), comment moderation workflow (authorial process), related posts (Phase 9), newsletter (Phase 7).

</domain>

<decisions>
## Implementation Decisions

### Giscus Comments

- **D-01:** Giscus uses the **blog repo itself** (`sertaoseracloud/sertao`) for GitHub Discussions. No separate repo needed. Pre-requisite: enable GitHub Discussions in the repo Settings → Discussions, then create a "Comments" category.
- **D-02:** Discussion thread mapping: **`og:title`**. Each post's Discussion is keyed by its OG title (emitted by `SEO.astro`). Survives URL slug changes. Giscus config: `mapping="og:title"`.
- **D-03:** Giscus component: `<CommentsEmbed client:visible>` in `PostLayout.astro`, placed after the `<article>` block inside `.stage`, before `<Footer>`. Lazy-hydrated so it loads only when the comments section scrolls into view — no performance impact on initial load.
- **D-04:** Giscus theme inherits the dark/light mode via a **JavaScript bridge** — ThemeToggle's existing script sends a `postMessage` to the Giscus `<iframe>` whenever the user toggles. Giscus officially supports this via `{ "setConfig": { "theme": "..." } }`. Implementation: extend `ThemeToggle.astro` script to find `iframe.giscus-frame` and dispatch the message on each theme change. Giscus themes: `dark` (for `data-theme="dark"` or default) and `light` (for `data-theme="light"`).
- **D-05:** `CommentsEmbed.astro` is a plain Astro component (`client:visible` for lazy hydration). It renders the Giscus `<script>` tag with the config attributes. Repo: `sertaoseracloud/sertao`. Reactions: enabled (`reactions-enabled="1"`). Emit metadata: disabled. Input position: above comments (`input-position="top"`).

### Pagefind Search

- **D-06:** Search UX: **modal overlay** opened by a search icon in the Header (right side, alongside ThemeToggle) or by `Ctrl+K` keyboard shortcut. The modal is a full-viewport overlay with a centered search panel. Results appear as the user types.
- **D-07:** Use **`@pagefind/default-ui`** package — the official Pagefind default UI. Override CSS custom properties (`--pagefind-ui-primary`, `--pagefind-ui-background`, `--pagefind-ui-text`, etc.) to match design system tokens (`--nucleo-eletrico`, `--abismo-profundo`, `--texto-principal`). This approach is officially supported and handles keyboard navigation, result highlighting, and language detection internally.
- **D-08:** Pagefind runs as a **post-build step** after `astro build`. The `pnpm build` script in `package.json` becomes `astro build && pagefind --site dist`. Pagefind indexes `dist/` and writes its bundle to `dist/pagefind/`. The search UI loads the index via `import('/pagefind/pagefind.js')`.
- **D-09:** `lang="pt-BR"` in `<html>` (already set in BaseLayout) causes Pagefind to auto-detect Portuguese for stemming and tokenization. No extra config needed.
- **D-10:** `<Search>` component: a new `src/components/Search.astro` that renders a search icon button in the header. Clicking opens the modal. `Ctrl+K` also opens it. The modal is built with a Pagefind default UI instance. Component uses a plain `<script>` (no `client:` directive — consistent with ThemeToggle pattern).
- **D-11:** Search icon placement: in `Header.astro` next to the ThemeToggle, in the `.nav-actions` area. Order in header: search icon → ThemeToggle.

### Tag Pages

- **D-12:** Tags display as **small chip/badge elements** on post cards (homepage, tag filter pages). Each chip shows the tag text prefixed with `#` (e.g., `#aws`). Clicking a chip navigates to `/tags/{tag}`. Style: Chakra Petch font, 11px, uppercase, color `var(--nucleo-eletrico)` in dark mode / `var(--texto-secundario)` in light mode. Border: `1px solid var(--hairline-strong)`.
- **D-13:** `/tags/` index page (`src/pages/tags/index.astro`): shows all unique tags with **post counts**, e.g., `azure (5)` `aws (4)` `cloud (6)`. Tags sorted by post count descending. Clicking a tag navigates to `/tags/{tag}`.
- **D-14:** `/tags/[tag].astro` (`src/pages/tags/[tag].astro`): dynamic route listing all non-draft posts for a given tag. Same post card format as the homepage. Heading: "Posts com #`{tag}`".
- **D-15:** Tag normalization: lowercase and deduplicated at build time. `getStaticPaths` collects all tags from all non-draft posts, lowercases them, and deduplicates. Posts with empty `tags: []` are **silently skipped** — they don't appear on any tag page but remain accessible via homepage and search.
- **D-16:** Tag data source: the `tags` field in `src/content.config.ts` (already `z.array(z.string()).default([])`). Tags come from the dev.to `tag_list` field via PRBuilder. No schema change needed.

### Claude's Discretion

- Exact Giscus `data-repo-id` and `data-category-id` values (obtained from giscus.app after GitHub Discussions is enabled)
- Pagefind CSS variable exact values for the modal (map design tokens to Pagefind's CSS vars)
- Whether to add a `/` (slash) keyboard shortcut in addition to `Ctrl+K` for the search modal
- Tag chip hover state styling
- Whether to paginate long tag filter pages (low priority given current post count)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Integration docs
- `.planning/ROADMAP.md` §"Phase 6 — Comments + Search" — success criteria and scope
- `src/layouts/PostLayout.astro` — CommentsEmbed goes here (after `<article>`, before Footer)
- `src/components/Header.astro` — Search icon + ThemeToggle placement target (`.nav-actions`)
- `src/components/ThemeToggle.astro` — dark/light bridge for Giscus; extend this script

### Existing patterns
- `src/styles/global.css` — design tokens used by tag chips and search modal overrides
- `src/pages/posts/[...slug].astro` — getStaticPaths pattern to replicate for `/tags/[tag].astro`
- `src/pages/index.astro` — post card pattern to replicate on tag filter pages

### Astro content
- `src/content.config.ts` — `tags: z.array(z.string()).default([])` field

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ThemeToggle.astro` — extend its `applyTheme` function to also post a message to the Giscus iframe
- `src/pages/posts/[...slug].astro` — `getCollection` + `getStaticPaths` pattern to replicate for tag pages
- `src/pages/index.astro` — post card rendering pattern (reuse for tag filter pages)
- `.prose` class in `global.css` — already has the reading layout; CommentsEmbed goes below it

### Established Patterns
- Plain `<script>` blocks in Astro components (no `client:` directives) — ThemeToggle, CopyCode
- `client:visible` for framework components that need lazy hydration (CommentsEmbed)
- CSS custom properties on `:root` / `[data-theme="light"]` for theming
- `getCollection('posts', ({data}) => import.meta.env.PROD ? !data.draft : true)` filter pattern

### Integration Points
- `Header.astro` `.nav-actions`: add `<Search />` left of `<ThemeToggle />`
- `PostLayout.astro`: add `<CommentsEmbed client:visible />` after `</article>`, inside `.stage`
- `package.json` `build` script: add `&& pagefind --site dist` after `astro build`
- `BaseLayout.astro` `<head>`: no changes needed (Pagefind loads its own JS dynamically)

</code_context>

<specifics>
## Specific Ideas

- The Giscus iframe messaging pattern from their docs: `document.querySelector('iframe.giscus-frame')?.contentWindow?.postMessage({ giscus: { setConfig: { theme: 'dark' } } }, 'https://giscus.app')`
- The tag chip `#aws` prefix is idiomatic for developer blogs — signals "this is a tag" without extra UI chrome
- Pagefind's default UI is performant even for 100+ posts since it pre-generates the index at build time; search is instant (no server calls)

</specifics>

<deferred>
## Deferred Ideas

- Related posts (Phase 9)
- Comment moderation workflow (authorial process — not code)
- Tag autocomplete in search (Phase 9)
- `/` keyboard shortcut for search (Claude's discretion whether to add alongside Ctrl+K)

</deferred>

---

*Phase: 06-comments-search*
*Context gathered: 2026-04-28*
