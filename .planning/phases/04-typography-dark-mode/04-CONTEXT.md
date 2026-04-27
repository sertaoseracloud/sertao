# Phase 4: Typography + Dark mode + Syntax highlighting - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Make reading long posts as good as dev.to. Deliver: self-hosted fonts (removing Google Fonts dependency), a full branded light/dark theme toggle, and Shiki dual-theme syntax highlighting with copy buttons and inline annotations. Typography prose styles already exist (`global.css .prose`) — Phase 4 polishes and ships the full reading experience.

**In scope:** WOFF2 self-hosting pipeline, ThemeToggle component, light theme CSS variables, Shiki dual-theme + transformers, copy-code button, Lighthouse Perf CI gate.

**Out of scope:** Callout/admonition components (Phase 9), footnote polish (Phase 9), reading progress indicator (Phase 9), TOC (Phase 9).

</domain>

<decisions>
## Implementation Decisions

### Font Self-Hosting
- **D-01:** Self-host all 3 current fonts as WOFF2: **Space Grotesk** (body), **Chakra Petch** (display/labels), **JetBrains Mono** (code). Keep the established brand identity — do NOT swap to Inter or other replacement fonts.
- **D-02:** Space Grotesk weights to include: **400, 500, 600 only**. Weights 300 and 700 are not used in the current design system CSS.
- **D-03:** WOFF2 files go in `public/fonts/`. Replace the `@import url('https://fonts.googleapis.com/...')` in `src/styles/global.css` with `@font-face` rules referencing `/fonts/*.woff2`. Add `font-display: swap` on all declarations. Add `<link rel="preload">` for the Space Grotesk regular (400) weight in `BaseLayout.astro <head>` — it's the critical path font.
- **D-04:** Chakra Petch weights: 400, 500, 600, 700 (used in labels and headings). JetBrains Mono: 400 regular and 400 italic (used in code blocks).

### Light Theme
- **D-05:** Implement a **full branded light theme** under `[data-theme="light"]` CSS variable overrides. Not a browser-default fallback — a real designed light experience.
- **D-06:** Light mode background: **warm off-white `#F5F0E8`** (paper feel, fits the Sertão narrative). Dark text: `#0A0F1E` (the page background becomes the text color — inverted).
- **D-07:** Light mode accents: **deep navy `#284068`** replaces `--nucleo-eletrico` for focus rings, links, and interactive elements. Cyan (#00FFFF) on `#F5F0E8` background yields ~1.5:1 contrast — fails WCAG. Navy yields 7.9:1 (WCAG AAA).
- **D-08:** Light mode token mapping (define as `[data-theme="light"]` overrides in `global.css`):
  - `--abismo-profundo` → `#F5F0E8` (page bg)
  - `--sub-nivel` → `#E8E3D8` (card/code bg)
  - `--texto-principal` → `#0A0F1E` (body text)
  - `--texto-secundario` → `#284068` (secondary text)
  - `--nucleo-eletrico` → `#284068` (accents/focus in light mode)
  - `--prose-fg` → `#0A0F1E`
  - `--prose-fg-muted` → `#284068`
  - `--hairline-strong` → `rgba(40, 64, 104, 0.25)` (borders)

### ThemeToggle Component
- **D-09:** ThemeToggle lives in **`Header.astro`, right-aligned** (same row as the nav/branding). Always visible, no content overlap risk.
- **D-10:** Visual style: **icon only** — ☀️ sun icon in dark mode (click → go light), 🌙 moon icon in light mode (click → go dark). Render as SVG icons from the design system color tokens (not emoji). Size: 20px, touch target: 40×40px.
- **D-11:** **Auto-detect `prefers-color-scheme` on first visit** before localStorage is set. If the user's OS is in light mode on first visit, render light theme. localStorage key is `'theme'` (already used by the FOUC script in BaseLayout). After any manual toggle, localStorage takes permanent precedence over the system preference.
- **D-12:** The FOUC prevention script in `BaseLayout` already reads `localStorage.getItem('theme')`. Extend it to also check `window.matchMedia('(prefers-color-scheme: light)')` when no localStorage value exists, so the initial render matches the correct theme without flash.

### Shiki Syntax Highlighting
- **D-13:** Shiki theme pair: **`houston`** (dark) + **`github-light`** (light). `houston` is Astro's own theme — deep blue-black background with cyan accents that match the brand palette. `github-light` is clean for light mode. Both ship with Shiki.
- **D-14:** Configure dual themes in `astro.config.mjs` using `shikiConfig.themes` (light/dark keyed object). CSS variables approach: Astro emits `--shiki-light` and `--shiki-dark` CSS vars; the current theme (determined by `[data-theme]`) controls which is active.
- **D-15:** Enable all 4 `@shikijs/transformers`:
  - `transformerNotationDiff` — `// [!code ++]` / `// [!code --]` diff annotations
  - `transformerNotationHighlight` — `// [!code highlight]` line spotlight
  - `transformerNotationFocus` — `// [!code focus]` dims non-focused lines
  - `transformerMetaHighlight` — ` ```ts {3,5-7}` range highlighting in fence metadata
- **D-16:** Code block title label: support ` ```ts title="filename.ts" ` via Astro's built-in `remarkRehype` frontmatter or a small remark plugin. The filename appears above the code block in a monospace label using `--font-mono` tokens.
- **D-17:** Copy-code button: a small Astro island (`client:visible`) that appends a copy button to each `<pre>` block. Button shows "Copiar" (PT-BR), switches to "✓" for 1.5s after click, then resets. Position: top-right of the code block. Lazy-hydrated so it adds zero JS to initial page load.

### Typography Polish
- **D-18:** The `.prose` class in `global.css` already has correct values (68ch, 18px, 1.72lh). Phase 4 adds `@tailwindcss/typography` for prose reset baseline, then overrides with the existing design tokens. The custom `.prose` styles should override the Tailwind typography defaults.
- **D-19:** Code blocks within prose: horizontal scroll on mobile (`overflow-x: auto` on `<pre>`), no line wrapping. Font size: 14px (reduced from prose 18px for density).

### Lighthouse Perf CI Gate
- **D-20:** Add a Lighthouse Performance gate to `deploy.yml` alongside the existing Accessibility gate. Threshold: Performance ≥ 90, CLS < 0.1. Uses the same `treosh/lighthouse-ci-action@v12` step and `lighthouserc.json` — extend the existing `assertions` block.

### Claude's Discretion
- Exact download source for WOFF2 files (Google Fonts download, Fontsource npm package, or manual subsetting via `glyphhanger` / `pyftsubset`)
- `@font-face` `unicode-range` subsets (Latin + Latin Extended is sufficient; no need for Cyrillic/Greek)
- Exact SVG path for the sun/moon icons (can use heroicons or draw inline)
- ThemeToggle component file name and precise CSS styling
- Whether `@tailwindcss/typography` `prose` classes are additive or replace the custom `.prose` class

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing design system
- `src/styles/global.css` — Current CSS tokens (section 03: Design Tokens), existing `.prose` class (section 10), FOUC script already in BaseLayout
- `src/layouts/BaseLayout.astro` — FOUC script location, `<head>` structure for preload links, localStorage key is `'theme'`
- `src/components/Header.astro` — ThemeToggle must be added here, right-aligned

### Project constraints
- `.planning/ROADMAP.md` §"Phase 4 — Typography + Dark mode + Syntax highlighting" — success criteria and scope boundaries
- `.planning/STATE.md` — `#284068` is safe-for-text brand color; Google Fonts import is a tracked blocker
- `src/layouts/PostLayout.astro` — Uses `.prose` class; Shiki output appears inside `.prose article`

### Prior phase decisions
- `.planning/phases/03-seo-rss-a11y/03-CONTEXT.md` — D-14 focus ring uses `--nucleo-eletrico` in dark mode (overridden by `#284068` in light mode per D-07 above)

### No external specs
No external ADRs or specs beyond ROADMAP.md — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/styles/global.css` `.prose` class — already correct dimensions (68ch, 18px, 1.72lh). Phase 4 augments, does not replace.
- `src/layouts/BaseLayout.astro` FOUC script — already reads `localStorage.getItem('theme')` and sets `data-theme`. Extend to also check `prefers-color-scheme` when localStorage is empty.
- `src/components/Header.astro` — ThemeToggle slot goes here; inspect current layout structure before modifying.

### Established Patterns
- All CSS tokens live in `src/styles/global.css` `:root` block. Light theme overrides go in `[data-theme="light"]` block in the same file.
- Tailwind v4 via `@tailwindcss/vite` — `@theme` block in global.css extends the Tailwind token system. Any new design tokens should follow this pattern.
- Astro component pattern: TypeScript frontmatter + scoped `<style>` (or global class reuse). No CSS-in-JS.

### Integration Points
- `astro.config.mjs` → add `markdown.shikiConfig.themes` + `markdown.shikiConfig.transformers`
- `src/styles/global.css` → replace `@import url(google fonts)` with `@font-face` blocks; add `[data-theme="light"]` overrides
- `src/layouts/BaseLayout.astro` → extend FOUC script; add font preload `<link>`
- `src/components/Header.astro` → add `<ThemeToggle>` import and usage
- `.github/workflows/deploy.yml` / `lighthouserc.json` → extend Perf CI gate assertions

</code_context>

<specifics>
## Specific Ideas

- `houston` theme from Shiki was created specifically for Astro docs — its `#17191e` background and cyan accents (`#00C8FF`) are close to the brand's `#0A0F1E` + `#00FFFF`. It will look intentional, not generic.
- The FOUC script should be extended in-place (not replaced) — it already handles the dark default case correctly.
- JetBrains Mono is used for code and metadata labels — keeping it self-hosted ensures the code blocks always render identically whether Google Fonts is blocked or not.

</specifics>

<deferred>
## Deferred Ideas

- Callout/admonition components — Phase 9
- Footnote polish — Phase 9
- Reading progress indicator — Phase 9
- Table of Contents (sticky) — Phase 9
- Variable font subsetting with `glyphhanger` / pyftsubset for optimal file size — mentioned as implementation detail; Claude can decide approach

</deferred>

---

*Phase: 04-typography-dark-mode*
*Context gathered: 2026-04-27*
