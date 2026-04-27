# Phase 4: Typography + Dark Mode + Syntax Highlighting - Research

**Researched:** 2026-04-25
**Domain:** Astro 6 Shiki dual-theme, Tailwind v4 Typography, WOFF2 self-hosting, ThemeToggle islands
**Confidence:** HIGH (primary areas verified against official docs and registry)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Font Self-Hosting**
- D-01: Self-host all 3 current fonts as WOFF2: Space Grotesk (body), Chakra Petch (display/labels), JetBrains Mono (code). Do NOT swap fonts.
- D-02: Space Grotesk weights 400, 500, 600 only.
- D-03: WOFF2 files in `public/fonts/`. Replace Google Fonts `@import` with `@font-face` rules. `font-display: swap`. Preload Space Grotesk 400 in `BaseLayout.astro <head>`.
- D-04: Chakra Petch weights 400, 500, 600, 700. JetBrains Mono 400 regular + 400 italic.

**Light Theme**
- D-05: Full branded light theme under `[data-theme="light"]` CSS variable overrides.
- D-06: Light mode bg `#F5F0E8`, text `#0A0F1E`.
- D-07: Light mode accent deep navy `#284068` (7.9:1 WCAG AAA on `#F5F0E8`).
- D-08: Token mapping:
  - `--abismo-profundo` → `#F5F0E8`
  - `--sub-nivel` → `#E8E3D8`
  - `--texto-principal` → `#0A0F1E`
  - `--texto-secundario` → `#284068`
  - `--nucleo-eletrico` → `#284068`
  - `--prose-fg` → `#0A0F1E`
  - `--prose-fg-muted` → `#284068`
  - `--hairline-strong` → `rgba(40, 64, 104, 0.25)`

**ThemeToggle Component**
- D-09: ThemeToggle in `Header.astro`, right-aligned in `.nav-actions`.
- D-10: Icon only — sun SVG (dark mode) / moon SVG (light mode), 20px, touch target 40x40px.
- D-11: Auto-detect `prefers-color-scheme` on first visit. localStorage key `'theme'` takes permanent precedence after first toggle.
- D-12: Extend existing FOUC script in BaseLayout to check `window.matchMedia('(prefers-color-scheme: light)')` when no localStorage value.

**Shiki Syntax Highlighting**
- D-13: Theme pair: `houston` (dark) + `github-light` (light).
- D-14: Dual themes via `shikiConfig.themes` + CSS variables approach.
- D-15: 4 transformers: `transformerNotationDiff`, `transformerNotationHighlight`, `transformerNotationFocus`, `transformerMetaHighlight`.
- D-16: Code block title label via ` ```ts title="filename.ts" ` metadata.
- D-17: Copy-code button as Astro island (`client:visible`). "Copiar" → "✓" for 1.5s. PT-BR copy.

**Typography Polish**
- D-18: Add `@tailwindcss/typography` for prose reset; override with existing design tokens. Custom `.prose` styles override Tailwind typography defaults.
- D-19: Code blocks within prose: `overflow-x: auto` on `<pre>`, no line wrap, 14px font size.

**Lighthouse Perf CI Gate**
- D-20: Extend `lighthouserc.json` with Performance ≥ 90, CLS < 0.1.

### Claude's Discretion
- Exact download source for WOFF2 files (Fontsource npm vs Google Fonts download vs glyphhanger)
- `@font-face` `unicode-range` subsets
- Exact SVG path for sun/moon icons
- ThemeToggle component file name and CSS styling
- Whether `@tailwindcss/typography` prose classes are additive or replace existing `.prose` class

### Deferred Ideas (OUT OF SCOPE)
- Callout/admonition components — Phase 9
- Footnote polish — Phase 9
- Reading progress indicator — Phase 9
- Table of Contents (sticky) — Phase 9
- Variable font subsetting with glyphhanger/pyftsubset — deferred to implementation detail
</user_constraints>

---

## Summary

Phase 4 delivers four independent but coordinated capabilities: WOFF2 self-hosted fonts removing the Google Fonts dependency blocker from STATE.md, a branded light/dark toggle with FOUC prevention, Shiki dual-theme syntax highlighting with line-level annotations, and a copy-code island component. The existing `.prose` class in `global.css` is already correctly dimensioned — Phase 4 augments it with `@tailwindcss/typography` as a reset baseline and overrides it with existing tokens.

The two most technically sensitive areas are: (1) Shiki dual-theme CSS variables require `defaultColor: false` in `astro.config.mjs` so tokens emit `--shiki-light`/`--shiki-dark` inline styles rather than hardcoded colors; then CSS rules keyed on `[data-theme]` activate the correct set. (2) `@shikijs/transformers` has an Astro 5+ constraint: transformers using the `postprocess` hook do not run in `markdown.shikiConfig.transformers` for `.md`/`.mdx` files (Astro migrated from HTML to hast in Astro 5.0). The four chosen transformers (NotationDiff, NotationHighlight, NotationFocus, MetaHighlight) operate on hast directly and are confirmed working in this path.

For `@tailwindcss/typography` with Tailwind v4, the installation is CSS-only: `@plugin "@tailwindcss/typography";` in `global.css` (no `tailwind.config.js` needed). The plugin's `prose` class will conflict with the existing custom `.prose` class name — the resolution is to apply both `prose` (Tailwind utility) and the existing custom class together, then use higher-specificity rules in `global.css` to override Tailwind typography defaults with the design system tokens.

**Primary recommendation:** Implement in this wave order: Wave 1 (fonts + light theme tokens), Wave 2 (Shiki dual-theme + transformers + copy button), Wave 3 (typography plugin + Lighthouse gate).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| WOFF2 font delivery | CDN / Static (`public/fonts/`) | Frontend Server (SSR `<head>`) | Binary assets served statically; `<link rel="preload">` injected at render time |
| FOUC prevention | Frontend Server (inline `<script is:inline>`) | Browser / Client | Must execute synchronously before first paint; can't be deferred |
| ThemeToggle state | Browser / Client | Frontend Server (initial render) | localStorage + matchMedia are browser APIs; server provides default |
| Light theme tokens | CDN / Static (CSS) | — | Pure CSS custom property overrides; no JS needed |
| Shiki highlighting | Frontend Server (build-time) | — | SSG: highlighting runs at build time, emits static HTML |
| `--shiki-light/dark` switching | Browser / Client (CSS) | — | CSS vars controlled by `[data-theme]` on `<html>` |
| `@tailwindcss/typography` | Frontend Server (build-time CSS) | — | Build-time CSS generation; no runtime component |
| Copy-code button | Browser / Client (`client:visible`) | — | DOM manipulation requires browser; lazy-hydrated island |
| Code title label | Frontend Server (rehype plugin) | — | Transforms hast at build time before HTML is emitted |
| Lighthouse CI gate | CI (GitHub Actions) | — | Post-deploy assertion; no runtime component |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shiki | 4.0.2 (ships with Astro 6.1.9) | Syntax highlighting | Built into Astro; no install needed |
| @shikijs/transformers | 4.0.2 | Notation annotations (diff/highlight/focus) | Official Shiki package; matches bundled shiki version |
| @tailwindcss/typography | 0.5.19 | Prose reset baseline | Official Tailwind plugin; v4 CSS-only install |
| @fontsource/space-grotesk | 5.2.10 | WOFF2 source for Space Grotesk 400/500/600 | Clean licensed files, correct unicode-range subsets |
| @fontsource/chakra-petch | 5.2.7 | WOFF2 source for Chakra Petch 400-700 | Same ecosystem |
| @fontsource/jetbrains-mono | 5.2.8 | WOFF2 source for JetBrains Mono 400/400i | Same ecosystem |

[VERIFIED: npm registry — versions confirmed 2026-04-25]

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| rehype-code-titles | 1.2.1 | Code block filename label from fence metadata | Use if `transformerMetaTitle` not available in @shikijs/transformers |

[VERIFIED: npm registry]

**Note on Fontsource usage:** Fontsource packages are devDependencies used as a font file source only. The WOFF2 files are copied from `node_modules/@fontsource/*/files/*.woff2` to `public/fonts/` during setup. The npm package itself is NOT imported in any component — only the static files are used. This avoids adding runtime bundle weight. [VERIFIED: fontsource.org install docs]

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fontsource npm | Google Fonts download UI | Manual process; Fontsource gives scripted, reproducible extraction |
| Fontsource static | @fontsource-variable/* (variable font) | Variable font is single file (lighter) but weights 400/500/600 have no visual difference in this design; static is simpler |
| rehype-code-titles | transformerMetaTitle (if exists) | Check @shikijs/transformers first; transformers run at build time same as rehype; either works |
| Custom copy button script | @shikijs/transformers copy button | No official copy button transformer exists in @shikijs/transformers; custom island is the standard pattern |

**Installation (new packages only):**
```bash
pnpm add -D @shikijs/transformers @tailwindcss/typography @fontsource/space-grotesk @fontsource/chakra-petch @fontsource/jetbrains-mono rehype-code-titles
```

**Version verification:** [VERIFIED: npm view @shikijs/transformers version → 4.0.2 | @tailwindcss/typography → 0.5.19 | @fontsource/space-grotesk → 5.2.10 | @fontsource/chakra-petch → 5.2.7 | @fontsource/jetbrains-mono → 5.2.8 | rehype-code-titles → 1.2.1 — 2026-04-25]

---

## Architecture Patterns

### System Architecture Diagram

```
BUILD TIME:
  Markdown/MDX files
       │
       ▼ markdown.remarkPlugins (rehype-code-titles → injects <div class="code-title">)
       ▼ markdown.shikiConfig.transformers (NotationDiff, NotationHighlight, NotationFocus, MetaHighlight)
       ▼ Shiki (defaultColor: false → emits --shiki-light / --shiki-dark inline CSS vars per token)
       │
       ▼ Static HTML emitted to dist/
            └── <pre class="astro-code"> with inline token CSS vars
            └── <div class="code-title"> (from rehype-code-titles)

CSS LAYER (loaded once):
  global.css
    ├── @font-face rules → /public/fonts/*.woff2
    ├── :root dark tokens (--abismo-profundo, --nucleo-eletrico, ...)
    ├── [data-theme="light"] overrides (D-08 token map)
    ├── Shiki dual-theme CSS vars (.astro-code span color: var(--shiki-dark))
    ├── [data-theme="light"] .astro-code span color: var(--shiki-light)
    └── @plugin "@tailwindcss/typography" → prose utilities

BROWSER RUNTIME:
  BaseLayout <head> inline script (is:inline)
    ├── Read localStorage('theme')
    ├── Fallback: window.matchMedia('(prefers-color-scheme: light)')
    └── Set document.documentElement.setAttribute('data-theme', theme)
                │
                ▼ CSS vars immediately resolve → no FOUC
  
  ThemeToggle.astro (inline <script>, no client: directive needed)
    ├── Button click → toggle theme value
    ├── localStorage.setItem('theme', newTheme)
    └── document.documentElement.setAttribute('data-theme', newTheme)
  
  CopyCodeButton.astro (client:visible island)
    ├── On mount: document.querySelectorAll('.prose pre.astro-code')
    ├── For each: make pre position:relative, append <button>Copiar</button>
    └── Click: navigator.clipboard.writeText → "✓" for 1.5s → reset
```

### Recommended Project Structure
```
src/
├── components/
│   ├── ThemeToggle.astro     # new — sun/moon toggle, inline <script>
│   └── CopyCodeButton.astro  # new — client:visible island
├── layouts/
│   ├── BaseLayout.astro      # modify — preload link + extended FOUC script
│   └── PostLayout.astro      # modify — add <CopyCodeButton client:visible />
├── styles/
│   └── global.css            # modify — @font-face, light tokens, Shiki CSS, typography plugin
public/
└── fonts/
    ├── space-grotesk-400.woff2
    ├── space-grotesk-500.woff2
    ├── space-grotesk-600.woff2
    ├── chakra-petch-400.woff2
    ├── chakra-petch-500.woff2
    ├── chakra-petch-600.woff2
    ├── chakra-petch-700.woff2
    ├── jetbrains-mono-400.woff2
    └── jetbrains-mono-400-italic.woff2
```

### Pattern 1: Shiki Dual-Theme with defaultColor:false

**What:** Configure two Shiki themes so each token carries both light and dark color as CSS custom properties. CSS rules keyed on `[data-theme]` then activate the correct set.

**When to use:** Any time you need theme toggling without a full page reload — the CSS vars switch instantly when `data-theme` changes on `<html>`.

**Astro docs state:** "replace `.shiki` with `.astro-code` in CSS examples from Shiki docs." [CITED: docs.astro.build/en/guides/syntax-highlighting]

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationFocus,
  transformerMetaHighlight,
} from '@shikijs/transformers';

export default defineConfig({
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'houston',
      },
      defaultColor: false,  // emit --shiki-light / --shiki-dark vars, no inline default
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        transformerNotationFocus(),
        transformerMetaHighlight(),
      ],
    },
  },
  // ... rest of config
});
```

**CRITICAL:** `defaultColor: false` was added in Astro v4.12.0. With Astro 6.1.9, it is supported. [CITED: docs.astro.build/en/reference/configuration-reference]

```css
/* global.css — Shiki dual-theme activation */
/* Dark mode (default — no data-theme attribute) */
.astro-code,
.astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}

/* Light mode */
[data-theme="light"] .astro-code,
[data-theme="light"] .astro-code span {
  color: var(--shiki-light) !important;
  background-color: var(--shiki-light-bg) !important;
  font-style: var(--shiki-light-font-style) !important;
  font-weight: var(--shiki-light-font-weight) !important;
  text-decoration: var(--shiki-light-text-decoration) !important;
}
```

[CITED: shiki.style/guide/dual-themes + docs.astro.build/en/guides/syntax-highlighting]

### Pattern 2: Tailwind v4 Typography Plugin — CSS-Only Install

**What:** `@tailwindcss/typography` for Tailwind v4 uses `@plugin` directive in the CSS file — no `tailwind.config.js` needed.

**When to use:** Any Tailwind v4 project using `@tailwindcss/vite` (not legacy `@astrojs/tailwind`).

```css
/* global.css — add after @import 'tailwindcss'; */
@plugin "@tailwindcss/typography";
```

[CITED: context7.com/tailwindlabs/tailwindcss-typography/llms.txt]

**Conflict resolution with existing `.prose` class:** `@tailwindcss/typography` provides a `prose` utility class. The existing `global.css` already defines `.prose` as a custom class. To avoid conflict: keep the Tailwind `prose` class on the `<article>` element alongside the custom `.prose` class, and ensure global.css custom `.prose` rules come after the `@plugin` import so they take specificity precedence. The typography plugin's `--tw-prose-*` CSS variables can also be overridden at the `:root` level to align with design tokens.

### Pattern 3: FOUC-Safe ThemeToggle (No client: directive needed)

**What:** ThemeToggle can use a plain `<script>` inside the Astro component (not `client:load`) because it only manipulates the DOM and localStorage — no reactive framework needed. This is faster than an Astro island.

**When to use:** Simple DOM interaction components where no reactive rendering is needed.

```astro
<!-- ThemeToggle.astro -->
<button
  id="theme-toggle"
  aria-label="Mudar para modo claro"
  style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:var(--nucleo-eletrico);"
>
  <!-- Sun icon shown in dark mode -->
  <svg id="icon-sun" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
  <!-- Moon icon shown in light mode -->
  <svg id="icon-moon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"
       style="display:none;">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
</button>

<script>
  const btn = document.getElementById('theme-toggle');
  const iconSun = document.getElementById('icon-sun');
  const iconMoon = document.getElementById('icon-moon');
  const html = document.documentElement;

  function getTheme() {
    return html.getAttribute('data-theme') || 'dark';
  }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      iconSun.style.display = 'none';
      iconMoon.style.display = 'block';
      btn.setAttribute('aria-label', 'Mudar para modo escuro');
    } else {
      iconSun.style.display = 'block';
      iconMoon.style.display = 'none';
      btn.setAttribute('aria-label', 'Mudar para modo claro');
    }
  }

  // Sync icon with current theme on mount
  applyTheme(getTheme());

  btn.addEventListener('click', () => {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
  });
</script>
```

[ASSUMED — derived from DOM API patterns; verified the API surface is correct]

### Pattern 4: Fontsource WOFF2 Extraction

**What:** Install Fontsource packages as devDependencies, copy WOFF2 files to `public/fonts/`, then uninstall (or keep for documentation). Files in `public/fonts/` are committed to git.

```bash
# Install temporarily to extract files
pnpm add -D @fontsource/space-grotesk @fontsource/chakra-petch @fontsource/jetbrains-mono

# Fontsource file paths (latin subset, static):
# node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-{400,500,600}-normal.woff2
# node_modules/@fontsource/chakra-petch/files/chakra-petch-latin-{400,500,600,700}-normal.woff2
# node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2
# node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-italic.woff2

# Copy to public/fonts/ with short names
mkdir -p public/fonts
cp node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-400-normal.woff2 public/fonts/space-grotesk-400.woff2
# ... repeat for each weight/style
```

[VERIFIED: fontsource.org — Fontsource file naming confirmed]

**Note:** The `.prettierignore` already excludes `public/fonts/` (STATE.md: "`.prettierignore` excludes `public/fonts/` to prevent Prettier touching WOFF2 binaries"). [VERIFIED: STATE.md]

### Pattern 5: @font-face Block Structure

```css
/* Replace Google Fonts @import in global.css */
@font-face {
  font-family: 'Space Grotesk';
  src: url('/fonts/space-grotesk-400.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
    U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193,
    U+2212, U+2215, U+FEFF, U+FFFD;
}
/* Repeat for weights 500, 600 and other families */
```

[ASSUMED — standard @font-face pattern; unicode-range is Latin + Latin Extended, sufficient for PT-BR]

### Pattern 6: Preload Link in BaseLayout

```astro
<!-- BaseLayout.astro <head> — BEFORE FOUC script -->
<link rel="preload" href="/fonts/space-grotesk-400.woff2" as="font" type="font/woff2" crossorigin />
```

Only Space Grotesk 400 (body text) is preloaded. Other weights load async via `font-display: swap`. [CITED: 04-UI-SPEC.md]

### Pattern 7: Code Title Label via rehype-code-titles

**What:** `rehype-code-titles` reads ` ```ts title="filename.ts" ` from fence metadata (supports `title=` attribute syntax) and injects `<div class="rehype-code-title">filename.ts</div>` before the `<pre>` block.

**Important:** Must be added to `markdown.rehypePlugins` BEFORE Shiki runs on the block:

```javascript
// astro.config.mjs
import rehypeCodeTitles from 'rehype-code-titles';

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeCodeTitles],
    shikiConfig: { /* ... */ },
  },
});
```

**CSS class:** `.rehype-code-title` (default, configurable). Style as `.code-title` or target `.rehype-code-title` directly. [CITED: github.com/rockchalkwushock/rehype-code-titles]

**Separator note:** `rehype-code-titles` by default uses `:` as separator (` ```ts:filename.ts ` syntax). To use `title=` syntax instead, check the plugin's options. Looking at the UI spec (D-16): the spec uses ` ```ts title="filename.ts" ` — this is the `title=` key=value syntax that `rehype-code-titles` supports. [MEDIUM confidence — verify this option at implementation time]

### Anti-Patterns to Avoid

- **Using `@media (prefers-color-scheme: dark)` for Shiki CSS:** The existing FOUC script sets `data-theme` — use `[data-theme="dark"]` attribute selectors, not media queries. Media queries bypass manual user override (localStorage).
- **Not setting `defaultColor: false`:** Without it, Shiki emits one set of hardcoded colors. Both `--shiki-light` and `--shiki-dark` variables are only emitted when `defaultColor: false` is set.
- **Applying `client:load` to ThemeToggle:** ThemeToggle only needs a plain `<script>` — no island hydration. `client:load` adds unnecessary framework overhead.
- **Importing Fontsource CSS at runtime:** Only the WOFF2 binary files are needed. Do NOT `import '@fontsource/space-grotesk'` in any component — that imports their CSS which re-declares Google-style `@font-face` from a CDN.
- **Using `postprocess` hook in custom transformers:** Astro 5+ changed Shiki internal from HTML to hast. Transformers using `postprocess` hook will be silently skipped in `markdown.shikiConfig.transformers` for `.md`/`.mdx` files. All four chosen transformers (from @shikijs/transformers) operate on hast and are safe. [CITED: docs.astro.build/en/guides/upgrade-to/v5]
- **Naming copy button with Astro scoped styles:** Buttons appended via DOM manipulation are not in the Astro component tree — scoped `<style>` won't reach them. Use `<style is:global>` or classes defined in `global.css`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Custom highlighter | Shiki (built into Astro 6) | Handles 200+ languages, line-number state, whitespace |
| Token-level CSS variable injection | Custom rehype walk | `defaultColor: false` in shikiConfig | Shiki handles per-token variable generation |
| Diff/highlight/focus annotations | Custom regex | `@shikijs/transformers` | Edge cases in comment detection across languages |
| Typography prose reset | Custom reset CSS | `@tailwindcss/typography` | Handles ordered/unordered lists, tables, blockquotes, code-in-prose correctly |
| Font file acquisition | Manual download + subset | Fontsource npm | Correct unicode-range, OFL license, woff2 format, consistent naming |
| Code block title | Custom MDX component | `rehype-code-titles` | Works in `.md` files (not just `.mdx`), runs at build time |
| Clipboard API with fallback | Custom implementation | `navigator.clipboard.writeText()` | Modern browsers support it; handle failure with `try/catch` |

**Key insight:** Shiki handles the hardest part (correct highlighting per language) — the transformers and CSS vars are a thin decoration layer on top.

---

## Common Pitfalls

### Pitfall 1: `.shiki` vs `.astro-code` class mismatch
**What goes wrong:** CSS rules targeting `.shiki` (from Shiki docs examples) don't apply because Astro outputs `class="astro-code"` on `<pre>` elements.
**Why it happens:** Astro renames Shiki's default class for namespacing.
**How to avoid:** Always use `.astro-code` in CSS, not `.shiki`. Official Astro docs explicitly state this.
**Warning signs:** Code blocks render with no theme colors after adding dual-theme CSS.

### Pitfall 2: `defaultColor` omitted — only one theme renders
**What goes wrong:** With `themes: { light, dark }` but no `defaultColor: false`, Shiki renders the first theme (light, alphabetically) as default inline styles. The dark theme CSS vars exist in the output but can never override inline styles without `!important`.
**Why it happens:** Shiki's default behavior with dual themes still injects one set of inline colors.
**How to avoid:** Always set `defaultColor: false` alongside `themes: {}` for class/data-attribute toggling.
**Warning signs:** Code blocks always show light theme colors regardless of `[data-theme]` attribute.

### Pitfall 3: ThemeToggle icon state desync on navigation
**What goes wrong:** In SSG/SSR, the page HTML always renders with dark mode default. On navigation, the FOUC script sets `data-theme` but the ThemeToggle icon (baked into server HTML) shows the wrong icon until client JS runs.
**Why it happens:** Server-side rendered icon state doesn't know localStorage value.
**How to avoid:** Run `applyTheme(getTheme())` on component mount to sync icon with current `data-theme` value. CSS `[data-theme="light"] #icon-sun { display: none; }` can handle this via CSS alone if JS fails.
**Warning signs:** Briefly incorrect icon on page navigation before JS executes.

### Pitfall 4: `@tailwindcss/typography` prose class overriding existing `.prose` styles
**What goes wrong:** The Tailwind `prose` utility resets heading sizes, link colors, and code styles — overwriting carefully designed `global.css` `.prose` rules.
**Why it happens:** Tailwind generates utility CSS with specificity `.prose > * + *` etc. that may be higher than the custom rules depending on cascade order.
**How to avoid:** Place the `@plugin "@tailwindcss/typography";` directive before the custom `.prose` rules in `global.css`. CSS cascade order: later rules win at equal specificity. Also use `--tw-prose-*` variable overrides to align the plugin's colors with the design system rather than fighting specificity.
**Warning signs:** After adding the plugin, heading colors change from `--texto-principal` to Tailwind's gray defaults.

### Pitfall 5: WOFF2 files not committed / served from wrong path
**What goes wrong:** `pnpm build` outputs `dist/` where `public/` contents are copied. If WOFF2 files are in `src/` instead of `public/`, Astro won't copy them. If path in `@font-face` is relative (not starting with `/`), it breaks in nested routes.
**Why it happens:** `src/` is processed by Vite; `public/` is copied verbatim.
**How to avoid:** Files go in `public/fonts/`. `@font-face src:` uses `/fonts/file.woff2` (absolute path).
**Warning signs:** 404 on font files; `font-display: swap` causes FOUT (flash of unstyled text) on every load.

### Pitfall 6: CopyCodeButton scoped styles not applying
**What goes wrong:** Buttons added via DOM manipulation (`document.createElement`) don't have Astro's scoped attribute, so `<style>` rules in the component don't apply.
**Why it happens:** Astro scopes `<style>` to components by adding a unique `data-astro-xxx` attribute; dynamically created elements don't have it.
**How to avoid:** Put copy button CSS in `<style is:global>` inside the component, or define the `.copy-code-btn` class in `global.css`.
**Warning signs:** Copy button renders with no styling.

### Pitfall 7: `rehype-code-titles` runs after Shiki (wrong plugin order)
**What goes wrong:** Code title `<div>` appears inside the `<pre>` block, or Shiki has already processed the metadata and the title extractor finds nothing.
**Why it happens:** Rehype plugin order matters — `rehype-code-titles` must extract the `title=` metadata before Shiki consumes it.
**How to avoid:** Add `rehypeCodeTitles` first in `markdown.rehypePlugins` array (before any other code-processing plugins).
**Warning signs:** No title rendered even with `title="..."` in fence, or malformed HTML.

---

## Code Examples

Verified patterns from official sources:

### Full astro.config.mjs for Phase 4

```javascript
// Source: docs.astro.build/en/guides/syntax-highlighting + context7 Astro docs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import rehypeCodeTitles from 'rehype-code-titles';
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationFocus,
  transformerMetaHighlight,
} from '@shikijs/transformers';

export default defineConfig({
  site: 'https://sertaoseracloud.com',
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    rehypePlugins: [rehypeCodeTitles],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'houston',
      },
      defaultColor: false,
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        transformerNotationFocus(),
        transformerMetaHighlight(),
      ],
    },
  },
  legacy: {
    collectionsBackwardsCompat: true,
  },
});
```

### global.css additions (skeleton)

```css
/* Source: context7 tailwindlabs/tailwindcss-typography */
/* After @import 'tailwindcss'; */
@plugin "@tailwindcss/typography";

/* @font-face blocks (replace the Google Fonts @import) */
@font-face {
  font-family: 'Space Grotesk';
  src: url('/fonts/space-grotesk-400.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212,
    U+2215, U+FEFF, U+FFFD;
}
/* ... 500, 600 for Space Grotesk; 400-700 for Chakra Petch; 400/400i for JetBrains Mono */

/* Light theme token overrides */
[data-theme="light"] {
  --abismo-profundo: #F5F0E8;
  --sub-nivel:       #E8E3D8;
  --texto-principal: #0A0F1E;
  --texto-secundario:#284068;
  --nucleo-eletrico: #284068;
  --prose-fg:        #0A0F1E;
  --prose-fg-muted:  #284068;
  --hairline-strong: rgba(40, 64, 104, 0.25);
}

/* Shiki dual-theme activation */
/* Source: shiki.style/guide/dual-themes — use .astro-code not .shiki */
.astro-code,
.astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}
[data-theme="light"] .astro-code,
[data-theme="light"] .astro-code span {
  color: var(--shiki-light) !important;
  background-color: var(--shiki-light-bg) !important;
  font-style: var(--shiki-light-font-style) !important;
  font-weight: var(--shiki-light-font-weight) !important;
  text-decoration: var(--shiki-light-text-decoration) !important;
}

/* Transformer annotation classes — must be hand-written CSS */
/* Source: launchfa.st/blog/shiki */
.prose pre .diff { display: inline-block; width: 100%; }
.prose pre .diff.add  { background: rgba(107, 255, 180, 0.12); border-left: 2px solid #6BFFB4; }
.prose pre .diff.remove { background: rgba(255, 107, 214, 0.12); border-left: 2px solid #FF6BD6; }
.prose pre.has-focused .line { opacity: 0.35; filter: blur(0.5px); transition: opacity 0.2s, filter 0.2s; }
.prose pre.has-focused .focused { opacity: 1; filter: none; }
.prose pre:hover .line { opacity: 1; filter: none; }
.prose pre .highlighted { background: rgba(0, 255, 255, 0.08); }

/* Code block title (from rehype-code-titles) */
.rehype-code-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--texto-secundario);
  background: var(--sub-nivel);
  border: 1px solid var(--hairline);
  border-bottom: none;
  padding: 8px 16px;
}

/* Copy button requires position:relative on pre */
.prose pre.astro-code { position: relative; }
```

### Extended FOUC Script for BaseLayout

```javascript
// Source: 04-UI-SPEC.md extended FOUC script
(function () {
  try {
    var stored = localStorage.getItem('theme');
    if (stored) {
      document.documentElement.setAttribute('data-theme', stored);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    // No else: dark is CSS default (no attribute = dark)
  } catch (_) {}
})();
```

### lighthouserc.json extended

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:performance": ["error", { "minScore": 0.9 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single Shiki theme | Dual themes with CSS vars | Astro 4.12 / Shiki v1 | Toggle themes without re-highlighting |
| `postprocess` hook in transformers | `hast` walk hooks only | Astro 5.0 (Dec 2024) | Must verify transformers don't use `postprocess` |
| `tailwind.config.js` for plugins | `@plugin` directive in CSS | Tailwind v4 (Jan 2025) | No JS config file needed |
| `@astrojs/tailwind` | `@tailwindcss/vite` | Tailwind v4 | Already implemented in this project |
| Google Fonts CDN | Self-hosted WOFF2 | Best practice since 2022 | Privacy, performance, reliability |

**Deprecated/outdated:**
- `@astrojs/tailwind` integration: replaced by `@tailwindcss/vite`. Project already on correct approach.
- `shikiConfig.theme` (singular): still works for single theme; use `themes` (plural object) for dual-theme.
- `--astro-code-color-text` CSS vars: renamed in Astro 5.0 upgrade (were `--astro-code-*`). This project starts fresh — use `--shiki-light`/`--shiki-dark` directly.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ThemeToggle uses plain `<script>` (not `client:` directive) because it only touches DOM/localStorage | Architecture Patterns — Pattern 3 | Low risk: works without a framework; worst case add `client:load` which adds ~0 overhead for a vanilla script |
| A2 | `@font-face unicode-range` Latin + Latin Extended is sufficient for PT-BR content | Standard Stack — Pattern 5 | Low: PT-BR uses only Latin characters; no Cyrillic/Greek needed |
| A3 | Fontsource file naming pattern `{family}-latin-{weight}-normal.woff2` is consistent across all three packages | Standard Stack — Fontsource note | Medium: file names could differ by version; verify at extraction time |
| A4 | `rehype-code-titles` supports `title=` key=value syntax (not just `:` colon separator) | Pattern 7 | Medium: if only colon syntax supported, must adjust fence syntax or choose alternative |
| A5 | All four chosen `@shikijs/transformers` work without `postprocess` hook in Astro 6.1.9 | Pitfall 3 / Config example | Low: official Shiki docs confirm these are hast-based; tested examples in community show working setups |

---

## Open Questions

1. **`rehype-code-titles` separator syntax**
   - What we know: Default separator is `:` (colon); `title=` key-value syntax may be supported
   - What's unclear: Whether `rehype-code-titles@1.2.1` supports the `title="..."` fence attribute syntax used in D-16/UI-SPEC, or only ` ```ts:filename.ts ` colon syntax
   - Recommendation: At implementation time, test both syntaxes against the plugin. If only colon is supported, update the fence syntax convention OR switch to `remark-code-titles@0.1.2` which also has colon syntax. Either is fine — update the mock post accordingly.

2. **`@tailwindcss/typography` prose class name conflict**
   - What we know: The project has a hand-written `.prose` class in `global.css`; Tailwind typography generates a `prose` utility class
   - What's unclear: Whether Tailwind's `prose` utility and the existing `.prose` custom class will cascade correctly, or if the Tailwind-generated rules will have higher specificity
   - Recommendation: Use `prose` as a Tailwind utility class name on elements AND keep the existing `.prose` class. Put `@plugin "@tailwindcss/typography";` early in `global.css`, with custom `.prose` rules after — CSS cascade will prefer the later rules at equal specificity. Test heading colors and link colors visually after adding the plugin.

3. **`houston` theme background vs `.prose pre` background**
   - What we know: `houston` theme has `#17191e` background; existing `.prose pre` uses `rgba(6, 10, 21, 0.85)` custom background; with `defaultColor: false`, Shiki emits `--shiki-dark-bg` per the houston theme
   - What's unclear: Whether the Shiki `--shiki-dark-bg` will completely override the existing `.prose pre` background rule
   - Recommendation: With `!important` in the Shiki CSS rules (Pattern 1 above), `var(--shiki-dark-bg)` takes over. The slight color difference (~`#17191e` vs `#060a15`) is acceptable per the UI spec.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js ≥ 22.12.0 | All build steps | ✓ | v24.14.1 | — |
| pnpm | Package install | ✓ | 9.15.0 | — |
| Astro 6.1.9 | Shiki, MDX | ✓ | 6.1.9 | — |
| @shikijs/transformers | Shiki annotations | ✗ (not installed) | 4.0.2 available | — |
| @tailwindcss/typography | Prose reset | ✗ (not installed) | 0.5.19 available | — |
| @fontsource/* (3 packages) | WOFF2 source | ✗ (not installed) | all 5.x available | Google Fonts download as fallback |
| rehype-code-titles | Code title label | ✗ (not installed) | 1.2.1 available | Custom remark plugin |

[VERIFIED: npm registry + pnpm list — 2026-04-25]

**Missing dependencies — all installable via `pnpm add -D`:**
```bash
pnpm add -D @shikijs/transformers @tailwindcss/typography @fontsource/space-grotesk @fontsource/chakra-petch @fontsource/jetbrains-mono rehype-code-titles
```

**Existing `public/fonts/` directory:** Does NOT exist yet. Must be created.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, existing in project) |
| Config file | None — scripts use `node --test` directly |
| Quick run command | `pnpm astro check` (TypeScript diagnostics) |
| Full suite command | `pnpm build && pnpm astro check` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-03 | No requests to fonts.googleapis.com | smoke | `pnpm build` → check dist/ for google fonts references | ✅ build exists |
| D-14 | Dual Shiki themes render light/dark token vars | visual | Manual: toggle theme in browser, verify code block colors change | manual-only |
| D-18 | `@tailwindcss/typography` loaded without build errors | build | `pnpm build` | ✅ |
| D-20 | Lighthouse Performance ≥ 90, CLS < 0.1 | lighthouse | `treosh/lighthouse-ci-action@v12` in CI | ❌ Wave 0 (extend lighthouserc.json) |
| D-10/11 | ThemeToggle persists across navigation | manual | Manual: toggle, reload, verify persistence | manual-only |
| D-17 | Copy-code button copies correctly | manual | Manual: click Copiar, verify clipboard | manual-only |

### Sampling Rate
- **Per task commit:** `pnpm astro check` (TypeScript diagnostics, ~5s)
- **Per wave merge:** `pnpm build` (full build, verify no font CDN refs in dist/)
- **Phase gate:** Full Lighthouse CI suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `lighthouserc.json` — extend assertions with `categories:performance` and `cumulative-layout-shift` (covers D-20)
- [ ] `public/fonts/` directory — created during Wave 1 font task

*(Existing `node:test` test suite covers sync pipeline; no new unit tests needed for CSS/Astro component changes)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | partial | `navigator.clipboard.writeText()` reads from DOM — only existing page code is copied; no user input accepted |
| V6 Cryptography | no | — |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| localStorage theme value spoofing | Tampering | Only `'light'` or `'dark'` string values are acted on; no eval, no HTML injection; `data-theme` attribute accepts arbitrary string but only CSS targeting `[data-theme="light"]` applies |
| WOFF2 file integrity | Spoofing | Files committed to git; served from same origin as app — no third-party CDN fetch |
| Clipboard hijack via copy button | Tampering | Button reads `pre > code` text content only — cannot read clipboard or inject; `navigator.clipboard` is same-origin |

---

## Sources

### Primary (HIGH confidence)
- `/llmstxt/astro_build_llms-full_txt` (Context7) — `shikiConfig.themes`, `defaultColor`, `markdown.shikiConfig.transformers`, `@shikijs/transformers` usage
- `/tailwindlabs/tailwindcss-typography` (Context7) — v4 `@plugin` install syntax, `--tw-prose-*` var override pattern
- `docs.astro.build/en/guides/syntax-highlighting` — `.astro-code` class, dual themes, `defaultColor: false`, transformers (WebFetch)
- `shiki.style/guide/dual-themes` — `[data-theme]` CSS pattern with `!important` vars (WebFetch)
- npm registry — version verification for all packages (Bash: npm view)

### Secondary (MEDIUM confidence)
- `launchfa.st/blog/shiki` — Complete working example of `@shikijs/transformers` in Astro config with transformer annotations CSS
- `amanhimself.dev/blog/dual-shiki-themes-with-astro` — `data-theme` attribute CSS approach (not media query)
- `timneubauer.dev/blog/copy-code-button-in-astro` — Copy-code button implementation pattern (DOM query, clipboard, state text)
- `fontsource.org` (font-specific install pages) — Package names, file format confirmation

### Tertiary (LOW confidence)
- General `rehype-code-titles` Astro integration (no confirmed Astro 6 test — verify `title=` syntax support at implementation)

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 4 |
|-----------|-------------------|
| Tailwind v4 via `@tailwindcss/vite` — NOT `@astrojs/tailwind` | `@tailwindcss/typography` installs via `@plugin` CSS directive — confirmed correct approach |
| pnpm 9.15.0 / Node ≥22.12.0 | All installs use `pnpm add -D` |
| `package.json` has `"type": "module"` (ESM only) | `astro.config.mjs` imports use ESM `import` syntax |
| `legacy.collectionsBackwardsCompat: true` required | Already in astro.config.mjs; must preserve when editing the file |
| `.prettierignore` excludes `public/fonts/` | Already configured in STATE.md; WOFF2 files safe from Prettier |
| Design system fonts: Space Grotesk / Chakra Petch / JetBrains Mono | D-01 locks these — no font substitution |
| `--nucleo-eletrico` (#00FFFF) = focus ring in dark mode | D-08 overrides this to `#284068` only in light mode |
| `src/styles/global.css` is the single source for CSS tokens | All new CSS goes here |

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry 2026-04-25
- Shiki dual-theme config: HIGH — verified against Astro official docs + Shiki official docs
- @tailwindcss/typography v4 install: HIGH — verified against Context7 official docs
- ThemeToggle pattern: MEDIUM — DOM API is standard; specific icon-state sync is ASSUMED
- rehype-code-titles `title=` syntax: MEDIUM — plugin exists and is confirmed; `title=` attribute variant needs implementation-time verification
- Pitfalls: HIGH — derived from official upgrade docs + known Astro 5 breaking change

**Research date:** 2026-04-25
**Valid until:** 2026-06-01 (stable APIs; Tailwind v4 and Astro 6 are recent but stabilizing)
