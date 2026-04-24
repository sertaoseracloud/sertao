---
phase: 01-bootstrap-fundacoes
fixed_at: 2026-04-24T00:00:00Z
review_path: .planning/phases/01-bootstrap-fundacoes/01-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-04-24T00:00:00Z
**Source review:** .planning/phases/01-bootstrap-fundacoes/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (1 Critical, 4 Warning)
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01: `post.slug` is deprecated and broken in Astro 6

**Files modified:** `src/pages/index.astro`
**Commit:** 7286a81
**Applied fix:** Replaced `post.slug` with `post.id.replace(/\.[^.]+$/, '')` so post URLs strip the file extension and remain clean. The deprecated `slug` field is removed from the Astro 6 content layer and would have produced `/posts/undefined` for every card.

### WR-01: `localStorage` access without error guard in inline theme script

**Files modified:** `src/layouts/BaseLayout.astro`
**Commit:** 4d24691
**Applied fix:** Wrapped the `localStorage.getItem('theme')` call inside a `try { } catch (_) {}` block. Changed `const` to `var` inside the IIFE for safe older-runtime compatibility. This prevents a `SecurityError` from blocking page initialization in sandboxed iframes, strict private-browsing modes, and storage-blocking browser extensions.

### WR-02: `SITE_TITLE` and `SITE_URL` duplicated — not imported from `consts.ts`

**Files modified:** `src/layouts/BaseLayout.astro`
**Commit:** f32811e
**Applied fix:** Added `import { SITE_TITLE, SITE_URL } from '../lib/consts';` to the frontmatter and removed the two hardcoded local `const` declarations. The layout now sources its values from the single source of truth, keeping canonical URLs and OG metadata in sync with `consts.ts`.

### WR-03: Nested `<nav>` inside a `<nav>` — invalid HTML landmark nesting

**Files modified:** `src/components/Header.astro`
**Commit:** ba4756e
**Applied fix:** Changed the inner `<nav class="nav-links" aria-label="Links de navegação">` to `<div class="nav-links">`. The outer `<nav class="site-nav" aria-label="Navegação principal">` already establishes the landmark; the inner element needs only to be a container. The redundant `aria-label` on the inner element was also dropped since it duplicated the outer landmark's label.

### WR-04: Hardcoded model version literal in content schema

**Files modified:** `src/content.config.ts`
**Commit:** 0005392
**Applied fix:** Changed `translated_by: z.literal('claude-haiku-4-5')` to `translated_by: z.string()`. This prevents Zod from silently dropping posts translated by any newer model version. If stricter validation is needed in the future, a `z.enum([...])` with explicit allowed values can be substituted.

## Skipped Issues

None — all findings were fixed.

---

_Fixed: 2026-04-24T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
