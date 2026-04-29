---
phase: 07-newsletter-lgpd
fixed_at: 2026-04-29T00:00:00Z
review_path: .planning/phases/07-newsletter-lgpd/07-REVIEW.md
iteration: 1
fix_scope: critical_warning
findings_in_scope: 4
fixed: 3
skipped: 1
status: partial
---

# Phase 7: Code Review Fix Report

**Fixed at:** 2026-04-29T00:00:00Z
**Source review:** .planning/phases/07-newsletter-lgpd/07-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4
- Fixed: 3
- Skipped: 1

## Fixed Issues

### WR-04: `outline: none` on email input silently disables keyboard focus ring

**Files modified:** `src/styles/global.css`
**Commit:** fb825a3
**Applied fix:** Removed the `outline: none` declaration from `.newsletter-field-row input[type="email"]` (line 1051). Replaced it with a comment clarifying that the global `:focus-visible` rule now fires correctly. Also updated the adjacent `:focus-visible` block comment to remove the now-incorrect claim that `outline: none` had been applied. The focus ring is fully restored for keyboard users, resolving the WCAG 2.4.7 failure.

---

### WR-01: Null dereference on `submitBtn` in `NewsletterEmbed.astro`

**Files modified:** `src/components/NewsletterEmbed.astro`
**Commit:** bf247c6
**Applied fix:** Added `if (!submitBtn) return;` immediately after `var submitBtn = form.querySelector('button[type="submit"]')` (line 89). This mirrors the existing `form` guard pattern directly above it and prevents a silent TypeError if the submit button is ever removed from the template during refactoring.

---

### WR-02: Null dereferences on `submitBtn` and `emailInput` in `newsletter.astro`

**Files modified:** `src/pages/newsletter.astro`
**Commit:** e40a299
**Applied fix:** Two guards applied:
1. Added `if (!submitBtn) return;` after `var submitBtn = form.querySelector(...)` (same pattern as WR-01 fix).
2. Changed the direct `.value` dereference on `document.getElementById('newsletter-email')` to a guarded pattern: assigned to `emailInput`, added `if (!emailInput) return;`, then read `emailInput.value`. This eliminates the null-dereference risk on both variables.

---

## Skipped Issues

### WR-03: Full form + script duplicated between `newsletter.astro` and `NewsletterEmbed.astro`

**File:** `src/pages/newsletter.astro:29-128`
**Reason:** Intentional architectural decision — duplicate IDs would result from importing `<NewsletterEmbed />` into `newsletter.astro`.

Both files share element IDs: `newsletter-form`, `newsletter-email`, `newsletter-consent`, `newsletter-success`, `newsletter-error`. The `newsletter.astro` page already contains its own full form markup with these IDs. If `<NewsletterEmbed />` were imported and rendered inside the same page, the page would have duplicate IDs, and the `<script is:inline>` IIFE in the component (which queries by these IDs) would attach event handlers to whichever element the browser's `getElementById` finds first — leading to broken form behavior on the newsletter page.

The 07-02-SUMMARY.md frontmatter explicitly documents this decision: "newsletter.astro duplicates NewsletterEmbed form markup intentionally — keeps is:inline script co-located with markup, avoids prop drilling (per 07-UI-SPEC.md)". This is a known, accepted trade-off of the `is:inline` pattern.

**Mitigation already applied:** WR-01 and WR-02 fixes ensure both files now have the same null-guard patterns. Future fixes should continue to be applied in both files when the shared logic diverges. The `USERNAME` placeholder comment in both files reminds authors to update both locations.

**Original issue:** `newsletter.astro` re-implements the entire form HTML and `<script is:inline>` IIFE instead of importing `<NewsletterEmbed />`, creating a maintenance burden where fixes must be applied in two places independently.

---

_Fixed: 2026-04-29T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
