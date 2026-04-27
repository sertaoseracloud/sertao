# Phase 4: Typography + Dark Mode + Syntax Highlighting - Pattern Map

**Mapped:** 2026-04-25
**Files analyzed:** 9 new/modified files
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/styles/global.css` | config/stylesheet | transform (CSS cascade) | `src/styles/global.css` (self — existing sections) | exact |
| `public/fonts/` | static asset | file-I/O (binary copy from Fontsource) | `public/favicon.svg` (public dir pattern) | role-match |
| `src/layouts/BaseLayout.astro` | layout | request-response | `src/layouts/BaseLayout.astro` (self — existing head) | exact |
| `src/components/Header.astro` | component | request-response | `src/components/Header.astro` (self — nav-actions slot) | exact |
| `src/components/ThemeToggle.astro` | component | event-driven (DOM + localStorage) | `src/components/SEO.astro` (inline-script pattern) | role-match |
| `src/components/CopyCode.astro` | component (island) | event-driven (DOM + clipboard) | `src/components/SEO.astro` (script + DOM interaction) | role-match |
| `astro.config.mjs` | config | transform (build-time) | `astro.config.mjs` (self — markdown stub) | exact |
| `lighthouserc.json` | config (CI assertion) | batch (CI) | `lighthouserc.json` (self — single assertion) | exact |
| `.github/workflows/deploy.yml` | CI workflow | batch | `.github/workflows/deploy.yml` (self — Lighthouse step) | exact |

---

## Pattern Assignments

### `src/styles/global.css` (config/stylesheet, CSS cascade transform)

**Analog:** `src/styles/global.css` — existing file (all sections)

**Section structure pattern** (lines 1–22 — file header + font import + Tailwind import):
```css
/*
 * Sistema de Design · Blog · Código Chama Azul
 * ...
 */

/* ------------------------------------------------------------------ */
/* 01 · Fonts                                                          */
/* ------------------------------------------------------------------ */

@import url('https://fonts.googleapis.com/css2?family=...');  /* REPLACE THIS */

/* ------------------------------------------------------------------ */
/* 02 · Tailwind v4                                                    */
/* ------------------------------------------------------------------ */

@import 'tailwindcss';

@theme {
  --font-body:    'Space Grotesk', system-ui, sans-serif;
  --font-display: 'Chakra Petch', sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, monospace;
  /* ... */
}
```

**Action — replace line 16 (Google Fonts import) with `@font-face` blocks:**
- Remove: `@import url('https://fonts.googleapis.com/...')`
- Add 8 `@font-face` declarations (Space Grotesk 400/500/600, Chakra Petch 400/500/600/700, JetBrains Mono 400 normal/italic), each with `font-display: swap` and Latin `unicode-range`
- Add `@plugin "@tailwindcss/typography";` after `@import 'tailwindcss';` on line 22

**Design tokens pattern** (lines 64–112 — `:root` block):
```css
:root {
  --chama-primaria:  #1A3AC8;
  --nucleo-eletrico: #00FFFF;
  --abismo-profundo: #0A0F1E;
  --sub-nivel:       #1B293C;
  --texto-principal: #FFFFFF;
  --texto-secundario:#D1D9E6;
  --prose-fg:        #E6ECF5;
  --prose-fg-muted:  #A6B1C4;
  --hairline-strong: rgba(0, 255, 255, 0.32);
  /* ... */
}
```

**Action — add `[data-theme="light"]` override block immediately after the existing `:root` block (after line 112), before the `03b · ROADMAP Compatibility Aliases` comment:**
```css
/* ------------------------------------------------------------------ */
/* 03c · Light Theme Overrides                                         */
/* ------------------------------------------------------------------ */

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
```

**Existing `.prose` section** (lines 501–621 — reading/prose view):
- `.prose` already sets `max-width: var(--prose-measure)` / `font-size: var(--prose-base)` / `line-height: var(--prose-lh)`
- `.prose pre` already has `overflow-x: auto`, `font-size: 14px`, `font-family: 'JetBrains Mono'`
- `.prose pre code` already strips background/border/padding for code inside pre

**Action — add Shiki dual-theme CSS after the `.prose pre code` rule (after line 621), using `.astro-code` (Astro's output class, NOT `.shiki`):**
```css
/* ------------------------------------------------------------------ */
/* 10b · Shiki Dual-Theme Activation                                   */
/* ------------------------------------------------------------------ */

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

/* Transformer annotation classes */
.prose pre .diff { display: inline-block; width: 100%; }
.prose pre .diff.add    { background: rgba(107, 255, 180, 0.12); border-left: 2px solid #6BFFB4; }
.prose pre .diff.remove { background: rgba(255, 107, 214, 0.12); border-left: 2px solid #FF6BD6; }
.prose pre.has-focused .line   { opacity: 0.35; filter: blur(0.5px); transition: opacity 0.2s, filter 0.2s; }
.prose pre.has-focused .focused { opacity: 1; filter: none; }
.prose pre:hover .line          { opacity: 1; filter: none; }
.prose pre .highlighted         { background: rgba(0, 255, 255, 0.08); }

/* Code block title (rehype-code-titles output class) */
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

/* Copy button styles (global — scoped styles can't reach DOM-injected elements) */
.copy-code-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--sub-nivel);
  border: 1px solid var(--hairline);
  color: var(--texto-secundario);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.copy-code-btn:hover {
  border-color: var(--hairline-strong);
  color: var(--nucleo-eletrico);
}
```

---

### `public/fonts/` (static asset directory, file-I/O)

**Analog:** `public/` directory (verbatim copy to `dist/` — Astro static asset convention)

**Pattern:** Files placed in `public/` are served at the root of the deployed site verbatim. Paths in CSS must use absolute paths starting with `/`.

**Action:** Copy WOFF2 files from Fontsource node_modules after `pnpm add -D`:
```
node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-400-normal.woff2
  → public/fonts/space-grotesk-400.woff2
node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff2
  → public/fonts/space-grotesk-500.woff2
node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff2
  → public/fonts/space-grotesk-600.woff2
node_modules/@fontsource/chakra-petch/files/chakra-petch-latin-400-normal.woff2
  → public/fonts/chakra-petch-400.woff2
node_modules/@fontsource/chakra-petch/files/chakra-petch-latin-500-normal.woff2
  → public/fonts/chakra-petch-500.woff2
node_modules/@fontsource/chakra-petch/files/chakra-petch-latin-600-normal.woff2
  → public/fonts/chakra-petch-600.woff2
node_modules/@fontsource/chakra-petch/files/chakra-petch-latin-700-normal.woff2
  → public/fonts/chakra-petch-700.woff2
node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2
  → public/fonts/jetbrains-mono-400.woff2
node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-italic.woff2
  → public/fonts/jetbrains-mono-400-italic.woff2
```

**NOTE:** Verify Fontsource actual filename casing at extraction time (assumption A3 in RESEARCH.md — filename pattern `{family}-latin-{weight}-normal.woff2` is MEDIUM confidence).

**`@font-face` block template** (for `global.css` section 01 replacement):
```css
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
/* Repeat pattern for weights 500, 600 (Space Grotesk);
   400, 500, 600, 700 (Chakra Petch);
   400 normal + 400 italic (JetBrains Mono — set font-style: italic for italic variant) */
```

---

### `src/layouts/BaseLayout.astro` (layout, request-response)

**Analog:** `src/layouts/BaseLayout.astro` lines 30–58 — existing head + FOUC inline script

**Existing head structure** (lines 30–57):
```astro
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="generator" content={Astro.generator} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <SEO ... />
    <link rel="alternate" type="application/rss+xml" ... />

    <!-- Theme init: prevent FOUC by reading localStorage before paint -->
    <script is:inline>
      (function () {
        try {
          var stored = localStorage.getItem('theme');
          if (stored) document.documentElement.setAttribute('data-theme', stored);
        } catch (_) {}
      })();
    </script>
  </head>
```

**Action 1 — add preload link** before the FOUC script (between `<link rel="alternate">` and `<script is:inline>`):
```astro
<link rel="preload" href="/fonts/space-grotesk-400.woff2" as="font" type="font/woff2" crossorigin />
```

**Action 2 — extend the existing FOUC script** (replace lines 51–57 in-place, keeping `is:inline` attribute):
```astro
<script is:inline>
  (function () {
    try {
      var stored = localStorage.getItem('theme');
      if (stored) {
        document.documentElement.setAttribute('data-theme', stored);
      } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.setAttribute('data-theme', 'light');
      }
      // No else: dark is CSS default (no attribute = dark theme)
    } catch (_) {}
  })();
</script>
```

**Existing `<script is:inline>` pattern** from `SEO.astro` line 61 (confirms `is:inline` is the project convention for synchronous inline scripts):
```astro
{jsonLd && <script is:inline type="application/ld+json" set:html={jsonLd} />}
```

---

### `src/components/Header.astro` (component, request-response)

**Analog:** `src/components/Header.astro` lines 36–41 — existing `.nav-actions` div

**Existing nav-actions slot** (lines 36–41 — the placeholder explicitly comments "Phase 4: dark mode toggle"):
```astro
<!-- Actions placeholder (Phase 4: dark mode toggle, Phase 7: search) -->
<div class="nav-actions" aria-label="Ações">
  <span class="text-muted" style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.1em;">
    ☁ PT-BR
  </span>
</div>
```

**Component import pattern** (from `PostLayout.astro` lines 2–4 — canonical Astro import style):
```astro
---
import BaseLayout from './BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
---
```

**Action — modify `Header.astro`:** Add `import ThemeToggle from './ThemeToggle.astro';` in the frontmatter block (lines 1–9), then replace the `.nav-actions` div content:
```astro
---
import ThemeToggle from './ThemeToggle.astro';
/* ... existing navLinks and currentPath ... */
---

<!-- Actions -->
<div class="nav-actions" aria-label="Ações">
  <ThemeToggle />
</div>
```

---

### `src/components/ThemeToggle.astro` (NEW component, event-driven DOM + localStorage)

**Analog:** `src/components/SEO.astro` — pattern of pure Astro component with inline `<script is:inline>` (line 61); `src/layouts/BaseLayout.astro` — FOUC script pattern for `localStorage` + `document.documentElement.setAttribute`

**Astro component structure pattern** (from `SEO.astro` and `Footer.astro` — frontmatter + template, no `client:` directive):
```astro
---
// TypeScript frontmatter — props if any
---

<element>...</element>

<script>
  // Plain script — runs once on mount, no framework
</script>
```

**`global.css` token usage pattern** (for inline styles — from `Header.astro` lines 36–40):
```astro
style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.1em;"
```

**Action — create `ThemeToggle.astro`** following this template (no `client:` directive; plain `<script>` — NOT `is:inline`):
```astro
---
// No props — reads theme from DOM directly
---

<button
  id="theme-toggle"
  aria-label="Mudar para modo claro"
  style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:var(--nucleo-eletrico);"
>
  <!-- Sun SVG — shown in dark mode (click to go light) -->
  <svg id="icon-sun" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
       viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
       aria-hidden="true">
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
  <!-- Moon SVG — shown in light mode (click to go dark) -->
  <svg id="icon-moon" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
       viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
       aria-hidden="true" style="display:none;">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
</button>

<script>
  const btn = document.getElementById('theme-toggle') as HTMLButtonElement;
  const iconSun = document.getElementById('icon-sun') as SVGElement;
  const iconMoon = document.getElementById('icon-moon') as SVGElement;
  const html = document.documentElement;

  function getTheme(): string {
    return html.getAttribute('data-theme') || 'dark';
  }

  function applyTheme(theme: string): void {
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

  // Sync icon state on mount (handles SSG — HTML always renders dark-default)
  applyTheme(getTheme());

  btn.addEventListener('click', () => {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
  });
</script>
```

**NOTE:** Use plain `<script>` (TypeScript, Astro-processed), NOT `<script is:inline>`. Plain scripts are bundled by Astro and run once after DOM is ready. `is:inline` bypasses Astro bundling — reserve it for FOUC-critical head scripts.

---

### `src/components/CopyCode.astro` (NEW component/island, event-driven DOM + clipboard)

**Analog:** `src/components/ThemeToggle.astro` (same pattern — DOM manipulation via `<script>`); `src/layouts/PostLayout.astro` (shows where `<CopyCodeButton client:visible />` will be inserted in the post layout)

**PostLayout mounting pattern** (lines 18–39 — how islands are used in layouts):
```astro
<BaseLayout ...>
  <Header slot="header" />
  <div class="stage">
    <article class="prose">
      <!-- ... -->
      <slot />
    </article>
  </div>
  <Footer slot="footer" />
</BaseLayout>
```

**`client:visible` island pattern** — Astro directive, not framework code. Add to the component usage site (`PostLayout.astro`), not to the component definition:
```astro
<CopyCode client:visible />
```

**Action — create `CopyCode.astro`** with `<style is:global>` for button styles (scoped `<style>` cannot reach DOM-injected elements — see RESEARCH.md Pitfall 6). Note `.copy-code-btn` CSS class is already defined in the `global.css` pattern above so `is:global` style block in this component is optional.

```astro
---
// No props — queries DOM for all pre.astro-code blocks
---

<script>
  // Runs client-side when component becomes visible
  document.querySelectorAll<HTMLPreElement>('.prose pre.astro-code').forEach((pre) => {
    // Make pre position:relative for absolute button positioning
    pre.style.position = 'relative';

    const btn = document.createElement('button');
    btn.className = 'copy-code-btn';
    btn.textContent = 'Copiar';

    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.innerText ?? pre.innerText;
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = '✓';
        setTimeout(() => { btn.textContent = 'Copiar'; }, 1500);
      } catch {
        btn.textContent = 'Erro';
        setTimeout(() => { btn.textContent = 'Copiar'; }, 1500);
      }
    });

    pre.appendChild(btn);
  });
</script>
```

**NOTE:** Button CSS (`.copy-code-btn`) must be in `global.css` (or `<style is:global>`), NOT in a scoped `<style>` block, because buttons are appended via `document.createElement` and never receive Astro's scoped `data-astro-*` attribute.

**PostLayout change required:** Add `<CopyCode client:visible />` anywhere inside `PostLayout.astro` (outside the `<article>` is fine — the script queries the DOM):
```astro
---
import CopyCode from '../components/CopyCode.astro';
---
<!-- after </article> or at bottom of stage div -->
<CopyCode client:visible />
```

---

### `astro.config.mjs` (config, build-time transform)

**Analog:** `astro.config.mjs` lines 1–20 — existing file (modify in-place)

**Existing config structure** (lines 1–20):
```javascript
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://sertaoseracloud.com',
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    // Phase 4 will add dual-theme Shiki config; default Shiki is fine for Phase 1.
  },
  legacy: {
    collectionsBackwardsCompat: true,  // MUST preserve
  },
});
```

**Action — replace the empty `markdown:` block** and add new imports:
```javascript
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
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
    rehypePlugins: [rehypeCodeTitles],  // must come BEFORE Shiki processes the block
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'houston',
      },
      defaultColor: false,  // emits --shiki-light / --shiki-dark CSS vars per token
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        transformerNotationFocus(),
        transformerMetaHighlight(),
      ],
    },
  },
  legacy: {
    collectionsBackwardsCompat: true,  // preserve — required for existing content pipeline
  },
});
```

**CRITICAL constraints from existing file:**
- `legacy.collectionsBackwardsCompat: true` must be preserved
- ESM `import` syntax (project is `"type": "module"`)
- `@tailwindcss/vite` plugin stays in `vite.plugins` (not as Astro integration)

---

### `lighthouserc.json` (CI config, batch assertion)

**Analog:** `lighthouserc.json` lines 1–9 — existing file (modify in-place)

**Existing structure** (lines 1–9):
```json
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

**Action — extend `assertions` object** with two additional keys (same format as existing):
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

**Pattern:** `["error", { "minScore": N }]` for score-based assertions; `["error", { "maxNumericValue": N }]` for numeric metric assertions. Copy the exact format from the existing accessibility assertion.

---

### `.github/workflows/deploy.yml` (CI workflow, batch)

**Analog:** `.github/workflows/deploy.yml` lines 56–65 — existing Lighthouse CI step

**Existing Lighthouse step** (lines 56–65 — no changes needed to this file):
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

**Assessment:** The existing step already uses `configPath: ./lighthouserc.json`. Since Phase 4 only adds assertions to `lighthouserc.json` (and does NOT add new CI steps), `deploy.yml` requires **no modification**. The extended `lighthouserc.json` assertions will automatically apply to the existing step.

**pnpm/Node setup pattern** (lines 24–39 — canonical for any new workflow per CLAUDE.md):
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

- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

---

## Shared Patterns

### CSS Token Reference Pattern
**Source:** `src/styles/global.css` lines 64–112 (`:root` block)
**Apply to:** All new CSS rules in `global.css` — use `var(--token-name)` from the `:root` block, never hardcode colors

Canonical token names to use in new CSS:
- Background: `var(--abismo-profundo)`, card/code bg: `var(--sub-nivel)`
- Body text: `var(--texto-principal)`, secondary: `var(--texto-secundario)`
- Accent/interactive: `var(--nucleo-eletrico)` (dark) → overridden to `#284068` in light
- Borders: `var(--hairline)` (subtle), `var(--hairline-strong)` (emphasis)
- Prose text: `var(--prose-fg)`, muted: `var(--prose-fg-muted)`

### Astro Component Frontmatter Pattern
**Source:** `src/layouts/PostLayout.astro` lines 1–16, `src/components/Header.astro` lines 1–9
**Apply to:** `ThemeToggle.astro`, `CopyCode.astro`
```astro
---
import OtherComponent from './OtherComponent.astro';

interface Props {
  propName: string;
}

const { propName } = Astro.props;
---
```
For components with no props (ThemeToggle, CopyCode), the frontmatter block is empty or contains only imports.

### Inline Script Pattern (`is:inline` vs plain `<script>`)
**Source:** `src/layouts/BaseLayout.astro` lines 50–57 (`is:inline`); `src/components/SEO.astro` line 61 (`is:inline`)
**Apply to:** FOUC extension in `BaseLayout.astro` keeps `is:inline`; ThemeToggle and CopyCode use plain `<script>` (Astro-bundled, TypeScript-enabled)

| Use `is:inline` | Use plain `<script>` |
|---|---|
| Must run synchronously before paint (FOUC prevention) | DOM interaction after paint |
| In `<head>` | In component body |
| No TypeScript | TypeScript supported |
| No Astro bundling | Bundled and deduplicated |

### `data-theme` Attribute Switching Pattern
**Source:** `src/layouts/BaseLayout.astro` lines 50–57 (reads); RESEARCH.md Pattern 3 (writes)
**Apply to:** `ThemeToggle.astro` script, and any CSS that must be theme-aware

The single source of truth for current theme is `document.documentElement.getAttribute('data-theme')`:
- No attribute / `'dark'` = dark mode (CSS default)
- `'light'` = light mode

CSS selectors use `[data-theme="light"]` prefix, NOT `@media (prefers-color-scheme: dark)` — media queries bypass manual user override.

### PT-BR Copy Convention
**Source:** `src/components/Footer.astro` (PT-BR text throughout), `src/components/Header.astro` line 20 (`☁ PT-BR` label)
**Apply to:** `ThemeToggle.astro` aria-labels, `CopyCode.astro` button text

All user-visible strings in PT-BR:
- Copy button: `'Copiar'` → `'✓'` (1.5s) → `'Copiar'`
- Toggle aria-label (dark mode): `'Mudar para modo claro'`
- Toggle aria-label (light mode): `'Mudar para modo escuro'`
- Error fallback: `'Erro'`

---

## No Analog Found

All 9 files have close analogs in the existing codebase. No file requires falling back to RESEARCH.md patterns as primary source.

| File | Analog Quality | Note |
|---|---|---|
| `ThemeToggle.astro` | role-match (SEO.astro script pattern) | RESEARCH.md Pattern 3 provides complete implementation template |
| `CopyCode.astro` | role-match (ThemeToggle pattern) | RESEARCH.md section on Pitfall 6 is critical — use `global.css` for button CSS |

---

## Metadata

**Analog search scope:** `src/components/`, `src/layouts/`, `src/styles/`, `astro.config.mjs`, `.github/workflows/`, `lighthouserc.json`
**Files scanned:** 9 source files read in full
**Pattern extraction date:** 2026-04-25

**Implementation order (from RESEARCH.md wave recommendation):**
1. Wave 1: `public/fonts/` extraction + `global.css` `@font-face` + `[data-theme="light"]` token block
2. Wave 2: `astro.config.mjs` Shiki config + `global.css` Shiki CSS + `ThemeToggle.astro` + `BaseLayout.astro` FOUC extension + `Header.astro` toggle slot + `CopyCode.astro` + `PostLayout.astro` island mount
3. Wave 3: `global.css` `@plugin "@tailwindcss/typography"` + `lighthouserc.json` Perf gate
