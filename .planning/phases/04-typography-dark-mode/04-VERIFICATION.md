---
phase: 04-typography-dark-mode
verified: 2026-04-25T18:45:00Z
status: human_needed
score: 10/10 automated must-haves verified
overrides_applied: 0
deferred:
  - truth: "Core Web Vitals: LCP <2.5s, INP <200ms, CLS <0.1 on /posts/{slug} with a real post"
    addressed_in: "Phase 5"
    evidence: "Phase 5 success criteria: 'Lighthouse mobile ≥90 em todos os scores no post'"
  - truth: "Bundle JS <50KB on post page (Lighthouse Unused JavaScript gate)"
    addressed_in: "Phase 5"
    evidence: "Phase 5 success criteria: 'Lighthouse mobile ≥90 em todos os scores no post' — requires live deploy for measurement"
human_verification:
  - test: "Toggle dark/light mode with the ThemeToggle button in the browser header"
    expected: "Page switches between dark theme (--abismo-profundo: #0A0F1E background, cyan accents) and light theme (--abismo-profundo: #F5F0E8 background, navy #284068 accents). The sun icon is shown in dark mode; the moon icon in light mode. Icons swap on click. Preference persists across page reloads."
    why_human: "Visual rendering and localStorage persistence require a live browser session"
  - test: "Hard-reload the page without any localStorage value (clear site data in DevTools)"
    expected: "If OS is set to light mode, light theme is applied immediately with no flash. If OS is dark, dark theme is applied. No FOUC (flash of wrong theme) before the FOUC script runs."
    why_human: "prefers-color-scheme detection and FOUC absence require browser observation"
  - test: "Navigate to /posts/hello-sertao and view a code block in dark mode, then switch to light mode"
    expected: "In dark mode: code block uses houston theme (dark blue background ~#17191e, cyan tokens). In light mode: code block switches to github-light theme (white background, standard token colors). The switch is instant (no page reload)."
    why_human: "Shiki dual-theme rendering requires visual comparison in both modes"
  - test: "Click the 'Copiar' button on any code block in a post page"
    expected: "Button shows 'Copiar'. On click it shows '✓' for 1.5s then resets to 'Copiar'. Pasting the clipboard contents matches the code block text exactly."
    why_human: "Clipboard API behavior requires browser interaction; navigator.clipboard.writeText cannot be tested statically"
  - test: "Open DevTools Network panel, reload a page, filter by Fonts"
    expected: "Zero requests to fonts.googleapis.com or fonts.gstatic.com. All font requests serve from the same origin (/fonts/*.woff2). Space Grotesk 400 is fetched first as a preloaded resource."
    why_human: "Network-tab verification confirms no Google Fonts CDN requests leak — the dist/ check confirms statically but browser Network tab is the authoritative test per Roadmap success criterion wording"
---

# Phase 4: Typography + Dark Mode + Syntax Highlighting — Verification Report

**Phase Goal:** Ler um post longo no blog é tão bom quanto ler no dev.to; código é lindo nos dois modos (light/dark).
**Verified:** 2026-04-25T18:45:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | pnpm build dist/ has zero fonts.googleapis.com references | ✓ VERIFIED | `grep` on dist/ returns exit 1 (no matches); Google Fonts CDN eliminated |
| 2 | Nine WOFF2 files exist at public/fonts/ (all non-zero) | ✓ VERIFIED | `ls -la public/fonts/` shows 9 files ranging 9.7KB–22.2KB with correct names |
| 3 | global.css has 9 @font-face declarations (Space Grotesk 400/500/600, Chakra Petch 400/500/600/700, JetBrains Mono 400 + italic) | ✓ VERIFIED | `grep -c "@font-face" src/styles/global.css` returns 9 |
| 4 | global.css has [data-theme="light"] block with all 8 D-08 token overrides | ✓ VERIFIED | Lines 189-198 confirm all 8 tokens: --abismo-profundo, --sub-nivel, --texto-principal, --texto-secundario, --nucleo-eletrico, --prose-fg, --prose-fg-muted, --hairline-strong |
| 5 | BaseLayout.astro has font preload link for space-grotesk-400.woff2 with as=font, crossorigin | ✓ VERIFIED | Line 48: `<link rel="preload" href="/fonts/space-grotesk-400.woff2" as="font" type="font/woff2" crossorigin />` |
| 6 | BaseLayout.astro FOUC script checks prefers-color-scheme when localStorage is empty | ✓ VERIFIED | Lines 51-63: `window.matchMedia('(prefers-color-scheme: light)').matches` present inside is:inline script |
| 7 | global.css has @plugin "@tailwindcss/typography" directive before .prose class | ✓ VERIFIED | Line 92: `@plugin "@tailwindcss/typography";` — .prose class begins at line 587 |
| 8 | ThemeToggle.astro exists with sun/moon SVG icons, 40x40px touch target, PT-BR aria-labels | ✓ VERIFIED | File exists; button has `width:40px;height:40px`; both "Mudar para modo claro" and "Mudar para modo escuro" aria-labels present |
| 9 | Header.astro imports and renders ThemeToggle; old placeholder span removed | ✓ VERIFIED | Line 2: `import ThemeToggle`; line 38: `<ThemeToggle />`; no "☁ PT-BR" or placeholder span |
| 10 | astro.config.mjs has houston+github-light, defaultColor:false, 4 transformers, rehypeCodeTitles | ✓ VERIFIED | All 4 transformers (NotationDiff, NotationHighlight, NotationFocus, MetaHighlight), `defaultColor: false`, both theme names, `rehypeCodeTitles` in rehypePlugins, `collectionsBackwardsCompat: true` preserved |
| 11 | global.css has .astro-code dual-theme CSS using --shiki-dark and --shiki-light vars | ✓ VERIFIED | Lines 716-735: dark default (.astro-code with !important), light override ([data-theme="light"] .astro-code) |
| 12 | global.css has transformer annotation CSS (.diff.add, .diff.remove, .has-focused, .highlighted) | ✓ VERIFIED | Lines 744-769 confirm all annotation classes present |
| 13 | global.css has .rehype-code-title with JetBrains Mono, --texto-secundario, --sub-nivel | ✓ VERIFIED | Lines 777-793 confirm all three properties |
| 14 | global.css has .copy-code-btn and .copy-code-btn:hover global styles | ✓ VERIFIED | Lines 800-820 confirm both rules present |
| 15 | CopyCode.astro queries .prose pre.astro-code and appends .copy-code-btn button | ✓ VERIFIED | Line 11: `querySelectorAll('.prose pre.astro-code')`; line 13: `btn.className = 'copy-code-btn'` |
| 16 | CopyCode shows Copiar/✓/Erro states with 1.5s reset | ✓ VERIFIED | Lines 14, 21, 28, 26, 31: all three states present with `setTimeout(..., 1500)` |
| 17 | PostLayout.astro imports CopyCode and renders it (no client:visible per Astro native component deviation) | ✓ VERIFIED | Line 5: `import CopyCode`; line 37: `<CopyCode />` — deviation documented in 04-03-SUMMARY.md (correct per Astro 6 behavior) |
| 18 | lighthouserc.json has Performance warn ≥0.9 and CLS warn ≤0.1 alongside accessibility error ≥0.9 | ✓ VERIFIED | All 3 assertions confirmed; deploy.yml at line 63 reads `configPath: ./lighthouserc.json` |
| 19 | Reading typography: max-width 68ch, 18px body, 1.72 line-height, flush-left (default) | ✓ VERIFIED | Lines 150-152 confirm token values (68ch, 18px, 1.72lh); no text-align:justify found. Note: 1.72lh slightly exceeds roadmap range 1.5-1.7 — this is intentional per CONTEXT.md D-18 which explicitly states "68ch, 18px, 1.72lh" as the correct values |
| 20 | Core Web Vitals: LCP <2.5s, INP <200ms, CLS <0.1 on live post | DEFERRED | Requires live GitHub Pages deployment — addressed in Phase 5 |
| 21 | Bundle JS <50KB on post page | DEFERRED | Requires live Lighthouse run — addressed in Phase 5. Static evidence: dist/ contains no separate .js bundle files; scripts are inline in HTML |

**Score:** 19/19 automated truths verified (2 deferred to Phase 5)

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Core Web Vitals: LCP <2.5s, INP <200ms, CLS <0.1 em `/posts/{slug}` (pending deploy) | Phase 5 | Phase 5 success criteria: "Lighthouse mobile ≥90 em todos os scores no post" |
| 2 | Bundle JS <50KB em página de post (Lighthouse Unused JavaScript gate) | Phase 5 | Phase 5 success criteria: "Lighthouse mobile ≥90 em todos os scores no post" — live measurement required |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `public/fonts/space-grotesk-400.woff2` | Critical-path body font 400 weight | ✓ VERIFIED | 13.3KB, committed |
| `public/fonts/space-grotesk-500.woff2` | Body font medium weight | ✓ VERIFIED | 13.0KB |
| `public/fonts/space-grotesk-600.woff2` | Body font semibold weight | ✓ VERIFIED | 13.0KB |
| `public/fonts/chakra-petch-400.woff2` | Display/label font regular | ✓ VERIFIED | 9.5KB |
| `public/fonts/chakra-petch-500.woff2` | Display/label font medium | ✓ VERIFIED | 9.7KB |
| `public/fonts/chakra-petch-600.woff2` | Display/label font semibold | ✓ VERIFIED | 9.7KB |
| `public/fonts/chakra-petch-700.woff2` | Display/label font bold | ✓ VERIFIED | 9.7KB |
| `public/fonts/jetbrains-mono-400.woff2` | Monospace code font normal | ✓ VERIFIED | 20.7KB |
| `public/fonts/jetbrains-mono-400-italic.woff2` | Monospace code font italic | ✓ VERIFIED | 21.7KB |
| `src/styles/global.css` | @font-face, light theme, typography plugin | ✓ VERIFIED | 9 @font-face, [data-theme="light"] block, @plugin directive present |
| `src/layouts/BaseLayout.astro` | Font preload link, extended FOUC script | ✓ VERIFIED | preload at line 48, prefers-color-scheme at line 57 |
| `src/components/ThemeToggle.astro` | Dark/light mode toggle with SVG icons | ✓ VERIFIED | sun/moon SVGs, 40x40px target, localStorage, PT-BR aria-labels |
| `src/components/CopyCode.astro` | Copy-code island for post pages | ✓ VERIFIED | queries .prose pre.astro-code, Copiar/✓/Erro states, 1.5s reset |
| `src/components/Header.astro` | ThemeToggle wired in nav-actions | ✓ VERIFIED | imports ThemeToggle, renders in .nav-actions, placeholder removed |
| `src/layouts/PostLayout.astro` | Mounts CopyCode | ✓ VERIFIED | imports CopyCode, renders `<CopyCode />` (no client: directive — correct for Astro native) |
| `astro.config.mjs` | Shiki dual-theme + 4 transformers + rehypeCodeTitles | ✓ VERIFIED | All config present; collectionsBackwardsCompat preserved |
| `lighthouserc.json` | 3 CI gate assertions | ✓ VERIFIED | accessibility error ≥0.9, performance warn ≥0.9, CLS warn ≤0.1 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| BaseLayout.astro `<head>` | public/fonts/space-grotesk-400.woff2 | `link rel=preload href=/fonts/space-grotesk-400.woff2` | ✓ WIRED | Line 48 in BaseLayout.astro |
| global.css @font-face | public/fonts/*.woff2 | `src: url('/fonts/...')` | ✓ WIRED | All 9 @font-face blocks use url('/fonts/...') |
| BaseLayout.astro FOUC script | `[data-theme]` on `<html>` | `document.documentElement.setAttribute('data-theme', ...)` | ✓ WIRED | Line 56-58: sets data-theme from localStorage or prefers-color-scheme |
| Header.astro .nav-actions | ThemeToggle.astro | `import ThemeToggle + <ThemeToggle />` | ✓ WIRED | Lines 2, 38 in Header.astro |
| ThemeToggle.astro script | `document.documentElement` data-theme | `html.setAttribute('data-theme', theme)` | ✓ WIRED | Line 60 in ThemeToggle.astro |
| global.css .astro-code | Shiki --shiki-dark/--shiki-light CSS vars | `color: var(--shiki-dark) !important` | ✓ WIRED | Lines 716-735 in global.css |
| astro.config.mjs shikiConfig | markdown processing pipeline | `defaultColor: false` + dual themes | ✓ WIRED | Lines 22-34 in astro.config.mjs |
| PostLayout.astro | CopyCode.astro | `import CopyCode + <CopyCode />` | ✓ WIRED | Lines 5, 37 in PostLayout.astro |
| CopyCode.astro script | .prose pre.astro-code elements | `document.querySelectorAll('.prose pre.astro-code')` | ✓ WIRED | Line 11 in CopyCode.astro |
| CopyCode.astro button | .copy-code-btn CSS in global.css | `btn.className = 'copy-code-btn'` | ✓ WIRED | Line 13 in CopyCode.astro |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| ThemeToggle.astro | `theme` (string) | `html.getAttribute('data-theme') \|\| 'dark'` + `localStorage.getItem('theme')` in FOUC script | Yes — real DOM attribute and real localStorage | ✓ FLOWING |
| CopyCode.astro | `code` (string from pre innerText) | `pre.querySelector('code')?.innerText ?? pre.innerText` | Yes — reads real DOM content of code blocks | ✓ FLOWING |
| global.css .astro-code | --shiki-dark/--shiki-light CSS vars | Shiki build-time processing via astro.config.mjs | Yes — Shiki emits CSS vars with real token colors | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Shiki renders code blocks in built post | `grep -c "astro-code" dist/posts/hello-sertao/index.html` | 1 match | ✓ PASS |
| Zero Google Fonts in dist/ | `grep -rn "fonts.googleapis.com" dist/` | exit code 1 (no matches) | ✓ PASS |
| Font files in dist/fonts/ | `ls dist/fonts/` | 9 WOFF2 files present | ✓ PASS |
| CopyCode script present in post HTML | `grep -o "querySelectorAll.*prose" dist/posts/hello-sertao/index.html` | Match found | ✓ PASS |
| No separate JS bundles in dist/ | `find dist/ -name "*.js"` | 0 files | ✓ PASS (Astro inlines scripts in SSG output) |
| preload link in built HTML | `grep "preload.*space-grotesk-400" dist/index.html` | Match at dist/index.html | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| D-01 | 04-01 | Self-host Space Grotesk as WOFF2 | ✓ SATISFIED | 3 WOFF2 files committed, @font-face declarations verified |
| D-02 | 04-01 | Space Grotesk weights 400/500/600 only | ✓ SATISFIED | Exactly 3 Space Grotesk @font-face blocks |
| D-03 | 04-01 | WOFF2 in public/fonts/, font-display:swap, preload for 400 | ✓ SATISFIED | All 9 have font-display:swap; preload at BaseLayout line 48 |
| D-04 | 04-01 | Chakra Petch 400/500/600/700, JetBrains Mono 400 normal + italic | ✓ SATISFIED | 4 Chakra Petch + 2 JetBrains Mono @font-face blocks confirmed |
| D-05 | 04-01 | Full branded light theme under [data-theme="light"] | ✓ SATISFIED | Block at global.css lines 189-198 |
| D-06 | 04-01 | Light mode bg: warm off-white #F5F0E8; dark text: #0A0F1E | ✓ SATISFIED | --abismo-profundo: #F5F0E8; --texto-principal: #0A0F1E |
| D-07 | 04-01 | Light mode accents: deep navy #284068 for focus rings, links, interactive | ✓ SATISFIED | --nucleo-eletrico: #284068 in light block |
| D-08 | 04-01 | 8-token light mode override mapping | ✓ SATISFIED | All 8 tokens present in [data-theme="light"] block |
| D-09 | 04-02 | ThemeToggle in Header.astro, right-aligned in .nav-actions | ✓ SATISFIED | ThemeToggle in .nav-actions div in Header.astro |
| D-10 | 04-02 | Icon-only toggle, 20px SVG, 40x40px touch target | ✓ SATISFIED | width:40px, height:40px, 20px SVGs confirmed |
| D-11 | 04-01/04-02 | Auto-detect prefers-color-scheme on first visit | ✓ SATISFIED | FOUC script checks matchMedia; ThemeToggle reads data-theme on mount |
| D-12 | 04-01 | FOUC script extended with prefers-color-scheme fallback | ✓ SATISFIED | BaseLayout.astro lines 51-63 |
| D-13 | 04-02 | Shiki theme pair: houston (dark) + github-light (light) | ✓ SATISFIED | astro.config.mjs lines 23-26 |
| D-14 | 04-02 | defaultColor:false, CSS vars approach for dual-theme | ✓ SATISFIED | defaultColor: false at line 27; CSS vars in global.css |
| D-15 | 04-02 | All 4 @shikijs/transformers enabled | ✓ SATISFIED | All 4 transformer imports and calls confirmed |
| D-16 | 04-02 | Code block title label via rehype-code-titles | ✓ SATISFIED | rehypeCodeTitles in rehypePlugins; .rehype-code-title CSS in global.css |
| D-17 | 04-03 | Copy-code button: PT-BR Copiar/✓/Erro, 1.5s reset, top-right | ✓ SATISFIED | CopyCode.astro confirms all states and timeout |
| D-18 | 04-01 | @tailwindcss/typography @plugin directive | ✓ SATISFIED | Line 92 in global.css |
| D-19 | 04-02 | Code blocks: overflow-x:auto on mobile, 14px font, no line wrap | ✓ SATISFIED | .prose pre has overflow-x:auto and font-size:14px (verified in Phase 3 carry-forward; CopyCode plan references it) |
| D-20 | 04-03 | Lighthouse CI gate: Performance ≥0.9 (warn) + CLS ≤0.1 (warn) | ✓ SATISFIED | lighthouserc.json confirmed; deploy.yml reads configPath |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

No TODO/FIXME/PLACEHOLDER comments, empty implementations, stub data sources, or hardcoded empty arrays found in any Phase 4 files.

Notable: `CopyCode.astro` comment still says "Astro island (client:visible)" in line 1, but `client:visible` was intentionally removed at implementation time (Astro native `<script>` blocks don't support client: directives). The comment is misleading but the implementation is correct. This is info-level only.

### Human Verification Required

#### 1. Theme Toggle Visual Rendering

**Test:** Open the blog in a browser, navigate to any page, and click the sun/moon icon in the header.
**Expected:** Page switches between dark theme (near-black background, cyan accents) and light theme (warm off-white #F5F0E8 background, navy #284068 accents, dark text). The sun icon is visible in dark mode; the moon icon in light mode. Icons swap correctly on each click. Refreshing the page retains the chosen theme.
**Why human:** Visual rendering, icon swap, and localStorage persistence require a live browser session.

#### 2. No FOUC on Page Load

**Test:** Clear site data in DevTools (Application > Storage > Clear site data). Set the OS to light mode. Hard-reload the page.
**Expected:** Light theme is applied immediately with no flash of dark theme. The FOUC prevention script reads prefers-color-scheme before paint.
**Why human:** FOUC absence requires real-time browser observation of the first paint; cannot be tested statically.

#### 3. Shiki Dual-Theme Code Block Rendering

**Test:** Navigate to `/posts/hello-sertao` (or any post with code blocks). View code blocks in dark mode, then toggle to light mode.
**Expected:** In dark mode, code blocks use the houston theme (deep blue background ~#17191e, cyan/teal token colors). In light mode, code blocks switch to github-light (white background, black/colored tokens). The switch is instantaneous via CSS variable swap.
**Why human:** Shiki theme rendering requires visual comparison of actual output in both modes.

#### 4. Copy Button Clipboard Functionality

**Test:** Navigate to any post page with code blocks. Click the "Copiar" button in the top-right corner of a code block.
**Expected:** Button text changes to "✓" immediately after click. After 1.5 seconds, it resets to "Copiar". Paste the clipboard contents into a text editor — it should match the code block exactly.
**Why human:** Clipboard API behavior (`navigator.clipboard.writeText`) requires browser interaction and actual clipboard access.

#### 5. Google Fonts Network Verification

**Test:** Open DevTools Network panel, click "Fonts" filter, reload any page.
**Expected:** Zero requests to fonts.googleapis.com or fonts.gstatic.com. All font requests are for /fonts/*.woff2 served from the same origin. Space Grotesk 400 appears as a preloaded resource at the top.
**Why human:** The roadmap success criterion specifically says "verify via Network tab." While the static dist/ check passes, browser Network panel verification is the authoritative test required by the specification.

### Gaps Summary

No blocking gaps. All automated must-haves verified at all four levels (exists, substantive, wired, data flowing). The two open roadmap success criteria (Core Web Vitals, Bundle JS) are deployment-dependent and explicitly deferred to Phase 5 where Lighthouse CI gate will measure them against a live deployment.

One intentional deviation from plan was documented: `client:visible` was removed from `<CopyCode />` because Astro native components with `<script>` blocks do not support client: hydration directives. The resulting behavior is functionally identical — the script executes client-side automatically.

Phase 4 is ready to proceed to Phase 5. The five human verification items above are standard browser/UX checks that cannot be automated statically.

---

_Verified: 2026-04-25T18:45:00Z_
_Verifier: Claude (gsd-verifier)_
