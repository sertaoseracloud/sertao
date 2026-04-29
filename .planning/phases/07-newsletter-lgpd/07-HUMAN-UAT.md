---
status: partial
phase: 07-newsletter-lgpd
source: [07-VERIFICATION.md]
started: 2026-04-29T12:00:00Z
updated: 2026-04-29T12:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Visual: Newsletter section renders on post pages
expected: A "Receba novos posts" section with email input, Inscrever-se button, and unchecked LGPD checkbox appears below article content and above the Comentários section on any post page
result: [pending]

### 2. Visual: LGPD consent checkbox is not pre-checked (live browser)
expected: Checkbox renders unchecked by default in both /newsletter and post pages; user must actively check it before submitting
result: [pending]

### 3. Visual: Newsletter section renders correctly in both dark and light themes
expected: Form fields, button, consent label, and feedback messages use design system tokens and are legible in both themes
result: [pending]

### 4. Visual: No popup / no exit-intent behavior on any page
expected: No modal appears on page load or scroll; newsletter form is inline only
result: [pending]

### 5. Authorial: Replace REPLACE_WITH_BUTTONDOWN_USERNAME in 4 locations
expected: Both src/components/NewsletterEmbed.astro and src/pages/newsletter.astro have the real Buttondown username in two places each (form action + USERNAME var)
result: [pending]

### 6. Authorial: Double opt-in enabled in Buttondown dashboard
expected: Buttondown Settings → Subscribing → Require double opt-in is enabled (D-04)
result: [pending]

### 7. Authorial: RSS-to-email configured in Buttondown for /rss.xml
expected: Buttondown Sending → RSS-to-email → https://sertaoseracloud.com/rss.xml added (D-08)
result: [pending]

### 8. Smoke test: End-to-end subscribe flow
expected: POST fires to Buttondown endpoint; inline success message appears without page reload; subscriber appears as pending in Buttondown dashboard awaiting confirmation
result: [pending]

### 9. Authorial: Validate subscriber data portability (LGPD Art. 18)
expected: Buttondown dashboard → Subscribers → Export CSV downloads subscriber list confirming data portability right is exercisable
result: [pending]

## Summary

total: 9
passed: 0
issues: 0
pending: 9
skipped: 0
blocked: 0

## Gaps
