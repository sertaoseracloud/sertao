---
phase: 01-bootstrap-fundacoes
reviewed: 2026-04-24T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - package.json
  - astro.config.mjs
  - tsconfig.json
  - .npmrc
  - .gitignore
  - .prettierrc.json
  - .prettierignore
  - src/env.d.ts
  - src/layouts/BaseLayout.astro
  - src/components/Header.astro
  - src/components/Footer.astro
  - src/pages/index.astro
  - src/content.config.ts
  - src/lib/consts.ts
  - public/favicon.svg
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-24T00:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Reviewed the full Phase 01 scaffold: project configuration, Astro layout/components, content schema, design tokens, and global CSS. The overall structure is solid — tsconfig strict mode, engine pinning, pnpm lockdown, and Prettier/MDX integration are all in good shape.

Three areas need attention before Phase 02 proceeds:

1. **`post.slug` is deprecated in Astro 6** — this is a runtime bug that will silently produce broken post URLs on the index page.
2. **`localStorage` access in an inline script has no error guard** — throws in sandboxed iframes and some private-browsing modes, breaking the entire page render.
3. **`SITE_TITLE` / `SITE_URL` are duplicated** in `BaseLayout.astro` instead of imported from `src/lib/consts.ts`, creating a maintenance hazard.

Four warnings and three info items are also noted below.

---

## Critical Issues

### CR-01: `post.slug` is deprecated and broken in Astro 6

**File:** `src/pages/index.astro:41`
**Issue:** `post.slug` was removed in Astro v5 content layer. In Astro 6 with `defineCollection`, the correct identifier is `post.id`. Using `post.slug` will either throw at runtime or produce `undefined`, generating broken href values like `/posts/undefined` for every card on the home page.
**Fix:**
```astro
<a href={`/posts/${post.id}`} class="card" style="text-decoration:none;">
```
If slugs with path separators are used, `post.id` may include the file extension (e.g., `my-post.md`). Strip the extension as needed:
```astro
<a href={`/posts/${post.id.replace(/\.[^.]+$/, '')}`} class="card" style="text-decoration:none;">
```

---

## Warnings

### WR-01: `localStorage` access without error guard in inline theme script

**File:** `src/layouts/BaseLayout.astro:46-49`
**Issue:** `localStorage.getItem('theme')` will throw a `SecurityError` in sandboxed iframes (e.g., CodeSandbox embeds), certain browser extensions that block storage, and some strict private-browsing modes. Because this is an `is:inline` script in `<head>`, an uncaught exception here blocks the rest of the page initialization.
**Fix:**
```html
<script is:inline>
  (function () {
    try {
      var stored = localStorage.getItem('theme');
      if (stored) document.documentElement.setAttribute('data-theme', stored);
    } catch (_) {}
  })();
</script>
```

### WR-02: `SITE_TITLE` and `SITE_URL` duplicated — not imported from `consts.ts`

**File:** `src/layouts/BaseLayout.astro:18-19`
**Issue:** `SITE_TITLE` and `SITE_URL` are re-declared as local constants with hardcoded string values, duplicating the single source of truth already exported from `src/lib/consts.ts`. If the site URL or title changes, the layout will silently serve stale canonical URLs and OG metadata while `consts.ts` is updated.
**Fix:**
```astro
---
import '../styles/global.css';
import { SITE_TITLE, SITE_URL } from '../lib/consts';
// remove the local const declarations on lines 18-19
---
```

### WR-03: Nested `<nav>` inside a `<nav>` — invalid HTML landmark nesting

**File:** `src/components/Header.astro:12-33`
**Issue:** The outer element is `<nav class="site-nav" aria-label="Navegação principal">` (line 12), and inside it there is a second `<nav class="nav-links" aria-label="Links de navegação">` (line 24). Nesting a landmark element inside a same-type landmark is invalid HTML5 and creates duplicate overlapping `navigation` landmarks for screen readers. Browsers will attempt to repair this, but behaviour varies.
**Fix:** Change the inner `<nav>` to a `<div>`:
```astro
<div class="nav-links" role="list" aria-label="Links de navegação">
  {navLinks.map(({ href, label }) => (
    <a role="listitem" ...>
      {label}
    </a>
  ))}
</div>
```
Or simply remove `role`/`aria-label` from the inner element since the outer `<nav>` already establishes the landmark.

### WR-04: Hardcoded model version literal in content schema

**File:** `src/content.config.ts:21`
**Issue:** `translated_by: z.literal('claude-haiku-4-5')` will reject any `source` object where `translated_by` is a different value. When the sync pipeline is updated to use a newer model version (e.g., `claude-haiku-4-6`), all posts synced with the new model will fail Zod validation and be silently dropped from the collection — a non-obvious data loss scenario.
**Fix:** Use `z.string()` or a broader union if specific validation is needed:
```ts
translated_by: z.string(),
// or, to allow a known set:
translated_by: z.enum(['claude-haiku-4-5', 'claude-haiku-4-6']),
```

---

## Info

### IN-01: Unsanitized tag value used as CSS class name

**File:** `src/pages/index.astro:42`
**Issue:** `class={`card-media p-${post.data.tags?.[0] ?? 'arq'}`}` injects the first tag string directly into the class attribute. While Astro/HTML escapes class attribute values (preventing XSS), an unexpected tag value such as `"cloud devops"` (containing a space) would split into two class tokens, potentially matching unintended CSS rules. This is a low-risk edge case for user-authored content, but worth noting if tags ever come from external input.
**Fix:** Restrict the class to a known allowlist or sanitize the value:
```ts
const KNOWN_CATEGORIES = ['arq', 'cloud', 'devops', 'lideranca', 'seguranca'];
const cat = KNOWN_CATEGORIES.includes(post.data.tags?.[0]) ? post.data.tags[0] : 'arq';
// <div class={`card-media p-${cat}`}></div>
```

### IN-02: External Google Fonts dependency not flagged in `.gitignore` / build pipeline

**File:** `src/styles/global.css:16`
**Issue:** Fonts are loaded from `fonts.googleapis.com` at runtime. The codebase already acknowledges this as a known pitfall (comment on line 8-9) with a TODO for self-hosting. No tracking issue or ticket reference is attached. The dependency is invisible in CI and no font-preload hint is present in `BaseLayout.astro`, meaning FOUT will occur in production.
**Fix:** This is a known, accepted deferral. Before Phase 3 (SEO/performance), download fonts to `public/fonts/`, add `@font-face` declarations, and add `<link rel="preload">` hints in `BaseLayout.astro`. Recommend converting the TODO comment to a GitHub issue for visibility.

### IN-03: `coverAlt` in schema has no paired `cover` (image URL) field

**File:** `src/content.config.ts:13`
**Issue:** The schema defines `coverAlt: z.string().optional()` but there is no corresponding `cover` (image URL) field. When a post frontmatter includes `coverAlt`, the value is recorded but there is no typed field to hold the image URL it describes. Developers must remember to add both fields as raw, unvalidated frontmatter until this is corrected.
**Fix:** Add a paired `cover` field:
```ts
cover: z.string().url().optional(),
coverAlt: z.string().optional(),
```
Consider adding a Zod `.refine()` to enforce that `cover` and `coverAlt` are either both present or both absent.

---

_Reviewed: 2026-04-24T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
