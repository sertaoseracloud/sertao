---
phase: 06-comments-search
plan: "01"
subsystem: comments-search-foundations
tags:
  - giscus
  - pagefind
  - css
  - theme-bridge
dependency_graph:
  requires: []
  provides:
    - pagefind-devdep
    - phase-6-css-foundations
    - giscus-theme-bridge
    - comments-embed-component
  affects:
    - package.json
    - src/styles/global.css
    - src/components/ThemeToggle.astro
    - src/components/CommentsEmbed.astro
tech_stack:
  added:
    - pagefind@1.5.2
    - "@pagefind/default-ui@1.5.2"
  patterns:
    - postMessage cross-iframe theme bridge with hardcoded targetOrigin
    - Giscus is:inline script (required to preserve data-* attrs in Astro)
    - pagefind post-build indexing step
key_files:
  created:
    - src/components/CommentsEmbed.astro
  modified:
    - package.json
    - pnpm-lock.yaml
    - src/styles/global.css
    - src/components/ThemeToggle.astro
decisions:
  - "Task 0 authorial prerequisite (GitHub Discussions + Giscus IDs) skipped — placeholder values used in CommentsEmbed; real IDs to be substituted by author"
  - "CommentsEmbed uses is:inline (not client: directive) — Astro strips data-* on non-inline scripts; data-loading=lazy is Giscus native lazy mechanism"
  - "postMessage targetOrigin hardcoded to 'https://giscus.app' (never '*') per T-06-01 threat mitigation"
  - "Pre-existing sync-pipeline.test.ts TS errors (3x ts(2322)) confirmed out-of-scope; not introduced by this plan"
metrics:
  duration: "~15min"
  completed: "2026-04-28T20:57:14Z"
  tasks_completed: 2
  files_modified: 5
---

# Phase 06 Plan 01: Wave 1 Foundations (Pagefind + CSS + Giscus) Summary

**One-liner:** Pagefind 1.5.2 installed as devDep with post-build indexing, Phase 6 CSS foundations added to global.css, ThemeToggle extended with Giscus postMessage bridge, and CommentsEmbed component created with is:inline lazy-load Giscus script.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install Pagefind devDeps + CSS + build script | 29f5c1e | package.json, pnpm-lock.yaml, src/styles/global.css |
| 2 | Extend ThemeToggle + create CommentsEmbed | b708df5 | src/components/ThemeToggle.astro, src/components/CommentsEmbed.astro |

---

## What Was Built

### Task 1 — Pagefind + Build Script + Phase 6 CSS
- `pagefind@1.5.2` and `@pagefind/default-ui@1.5.2` added to devDependencies
- `pnpm build` script updated to `astro build && pagefind --site dist`
- 6 new Phase 6 CSS classes appended to `src/styles/global.css` (section 15):
  - `.comments-section` — margin-top spacing for comments area
  - `.tag-cloud` — flex/wrap layout for /tags/ index page
  - `.tag--cloud` — tag chip with more padding (extends .tag)
  - `.tag-count` — JetBrains Mono 10px post count annotation
  - `.search-kbd-hint` — hidden by default, visible at 768px+ (Ctrl+K hint)
  - `#pagefind-search` — CSS custom property overrides mapping design tokens to Pagefind UI vars

### Task 2 — ThemeToggle Giscus Bridge + CommentsEmbed Component
- `ThemeToggle.astro` applyTheme() extended: finds `iframe.giscus-frame` via querySelector, sends `{ giscus: { setConfig: { theme: ... } } }` postMessage with targetOrigin `'https://giscus.app'`
- Optional chaining (`?.contentWindow`) ensures no-op on pages without Giscus iframe
- `CommentsEmbed.astro` created with:
  - `is:inline` on Giscus script (required — Astro strips data-* without it)
  - `data-loading="lazy"` (Giscus native lazy mechanism)
  - `data-mapping="og:title"` (per D-02: threads keyed by post OG title)
  - `data-reactions-enabled="1"`, `data-emit-metadata="0"`, `data-input-position="top"` (per D-05)
  - Placeholder IDs `REPLACE_WITH_REPO_ID` / `REPLACE_WITH_CATEGORY_ID`
  - Inline IIFE to correct initial Giscus theme from localStorage preference

---

## Deviations from Plan

### Auto-handled: Task 0 authorial prerequisite

Task 0 is a `checkpoint:human-action` requiring the author to enable GitHub Discussions and obtain real Giscus repo/category IDs. The plan explicitly provides a "skip" option to use placeholder values and fill in later. This executor used placeholder values (`REPLACE_WITH_REPO_ID`, `REPLACE_WITH_CATEGORY_ID`) in CommentsEmbed.astro. The author must replace these before the comments feature is functional.

No other deviations — plan executed as written.

---

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `data-repo-id="REPLACE_WITH_REPO_ID"` | src/components/CommentsEmbed.astro | 19 | Authorial prerequisite: enable GitHub Discussions + run giscus.app config wizard |
| `data-category-id="REPLACE_WITH_CATEGORY_ID"` | src/components/CommentsEmbed.astro | 21 | Same — requires Discussions category ID from giscus.app |

**Impact:** Comments section will not render correctly until real IDs are substituted. The component is not used in any layout yet (Plan 06-02 wires it into PostLayout).

---

## Threat Flags

No new threat surface beyond what is documented in the plan's `<threat_model>`. All T-06-0x mitigations applied:
- T-06-01 (Spoofing): targetOrigin hardcoded to `'https://giscus.app'`
- T-06-03 (Tampering): `is:inline` applied to Giscus script

---

## Self-Check

Checking files exist and commits are valid...

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/components/CommentsEmbed.astro | FOUND |
| src/components/ThemeToggle.astro | FOUND |
| src/styles/global.css | FOUND |
| commit 29f5c1e (Task 1) | FOUND |
| commit b708df5 (Task 2) | FOUND |
