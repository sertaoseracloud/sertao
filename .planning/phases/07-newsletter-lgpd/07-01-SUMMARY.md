---
phase: 07-newsletter-lgpd
plan: 01
subsystem: ui
tags: [astro, newsletter, buttondown, lgpd, css, is:inline, no-cors, form]

# Dependency graph
requires:
  - phase: 06-comments-search
    provides: CommentsEmbed.astro is:inline pattern; PostLayout.astro placement reference; global.css Phase 6 block
provides:
  - NewsletterEmbed.astro component with AJAX subscribe form and LGPD consent
  - global.css Phase 7 Newsletter CSS block (16 classes)
  - PostLayout.astro wired with NewsletterEmbed between CopyCode and CommentsEmbed
affects:
  - 07-02-PLAN.md (newsletter page and privacidade update use same CSS tokens and pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Buttondown embed API via no-cors fetch POST with URLSearchParams body"
    - "is:inline AJAX handler with opaque-response success detection (fetch resolve = success)"
    - "LGPD consent checkbox: required attribute, no pre-checked, browser-native validation"

key-files:
  created:
    - src/components/NewsletterEmbed.astro
  modified:
    - src/styles/global.css
    - src/layouts/PostLayout.astro

key-decisions:
  - "no-cors fetch treats resolved promise as success — opaque response cannot provide HTTP status (documented Pitfall 1)"
  - "URLSearchParams body (application/x-www-form-urlencoded) matches native browser form POST; avoids multipart FormData issue (Pitfall 2)"
  - "REPLACE_WITH_BUTTONDOWN_USERNAME placeholder in two places: form action (fallback) and USERNAME var in is:inline script"
  - "Pre-existing 4 astro check errors confirmed out-of-scope (sync-pipeline.test.ts ts(2322) + Search.astro ts(2307) — predates Phase 7)"

patterns-established:
  - "Pattern: NewsletterEmbed follows CommentsEmbed is:inline AJAX pattern — self-contained section, no client: directive, no external JS"
  - "Pattern: Newsletter CSS block appended as section 16 in global.css following Phase 6 section 15"

requirements-completed: [D-01, D-02, D-03, D-05]

# Metrics
duration: 4min
completed: 2026-04-29
---

# Phase 7 Plan 01: Newsletter + LGPD — NewsletterEmbed Component Summary

**Buttondown embed subscribe form with LGPD consent checkbox wired into PostLayout using is:inline no-cors AJAX pattern**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-29T10:51:32Z
- **Completed:** 2026-04-29T10:56:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Phase 7 Newsletter CSS block added to global.css (16 newsletter-* classes using design system tokens)
- NewsletterEmbed.astro created with AJAX subscribe form, LGPD-compliant unchecked consent checkbox, no-cors fetch, ARIA live regions
- PostLayout.astro updated to render NewsletterEmbed between CopyCode and CommentsEmbed (article → Newsletter → Comentários order per D-05)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Phase 7 Newsletter CSS block to global.css** - `11d0b78` (feat)
2. **Task 2: Create NewsletterEmbed.astro component** - `37a29d0` (feat)
3. **Task 3: Wire NewsletterEmbed into PostLayout** - `5a4cf21` (feat)

## Files Created/Modified
- `src/styles/global.css` - Phase 7 newsletter CSS block appended (section 16); 16 classes for newsletter form, consent, feedback messages
- `src/components/NewsletterEmbed.astro` - Self-contained newsletter subscribe section with is:inline AJAX handler, LGPD checkbox, REPLACE_WITH_BUTTONDOWN_USERNAME placeholder
- `src/layouts/PostLayout.astro` - Import + usage of NewsletterEmbed between CopyCode and comments-section

## Decisions Made
- `no-cors fetch` is the correct pattern for Buttondown embed endpoint on a static GitHub Pages site — opaque response means fetch resolve = success signal (cannot read HTTP status)
- `URLSearchParams` body (not `FormData`) ensures `application/x-www-form-urlencoded` encoding matching native browser form POST
- LGPD checkbox uses HTML `required` attribute only — no custom JS validation; browser-native constraint validation is sufficient and intentional
- `tabindex="-1"` on success/error divs enables `.focus()` for screen reader announcement fallback; `role="status"` and `role="alert"` provide ARIA live region announcements
- Pre-existing `pnpm astro check` errors (4 total) confirmed out-of-scope and predating Phase 7: `sync-pipeline.test.ts` ts(2322) from Phase 2, `Search.astro` ts(2307) from Phase 6

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `pnpm astro check` reports 4 errors but all are pre-existing (confirmed by git stash test). Documented in STATE.md as out-of-scope. No new errors introduced by Phase 7 changes.

## User Setup Required

**Buttondown account configuration required before newsletter form is live.**

Steps (from plan user_setup):
1. Create a Buttondown account at https://buttondown.com
2. Enable Double opt-in: Buttondown Settings → Subscribing → Require double opt-in
3. Find your username: Buttondown dashboard → Settings → General
4. Replace `REPLACE_WITH_BUTTONDOWN_USERNAME` in `src/components/NewsletterEmbed.astro` — two occurrences: form `action` attribute (line ~30) and `USERNAME` var in `<script is:inline>` (line ~74)
5. Enable RSS-to-email: Buttondown dashboard → Settings → subscribe to `/rss.xml` feed

**Smoke test before shipping:** Open browser DevTools, submit the form on any post page, confirm subscriber appears in Buttondown dashboard.

## Next Phase Readiness
- NewsletterEmbed component ready for use on /newsletter standalone page (07-02)
- Same CSS classes (.newsletter-section, .newsletter-field-row, etc.) can be reused on newsletter.astro page
- /privacidade update needed in 07-02 to reflect email collection and Buttondown sub-processor disclosure (D-09 through D-12)

---
*Phase: 07-newsletter-lgpd*
*Completed: 2026-04-29*
