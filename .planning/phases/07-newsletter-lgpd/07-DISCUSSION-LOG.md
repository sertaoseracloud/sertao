# Phase 7: Newsletter + LGPD completa - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 07-newsletter-lgpd
**Areas discussed:** Buttondown embed vs. custom form, /newsletter standalone page, /privacidade expansion scope

---

## Buttondown embed vs. custom form

| Option | Description | Selected |
|--------|-------------|----------|
| Custom HTML form (Recommended) | Plain `<form>` POSTing to Buttondown API. Zero external JS, full design control. Matches "no external scripts" pattern. | ✓ |
| Buttondown embed widget | Copy-paste `<script>` from Buttondown dashboard. Easier but adds external JS and limits style control. | |

**User's choice:** Custom HTML form
**Notes:** Consistent with project pattern — CommentsEmbed uses is:inline for same reason.

---

## Submit UX (follow-up to form approach)

| Option | Description | Selected |
|--------|-------------|----------|
| Inline success message (Recommended) | AJAX POST, form replaced with PT-BR confirmation. No redirect. | ✓ |
| Redirect to Buttondown confirmation page | Standard form POST, redirects. Simpler code, breaks reading flow. | |

**User's choice:** Inline success message

---

## /newsletter standalone page

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal — form + one paragraph (Recommended) | 2-3 sentence pitch + form + LGPD checkbox. No archive. | ✓ |
| Curated pitch page | Longer copy, sample topics, social proof, potential issue archive. More editorial work. | |

**User's choice:** Minimal

---

## Newsletter pitch / cadence

| Option | Description | Selected |
|--------|-------------|----------|
| Novos posts + extras ocasionais | RSS-to-email: each new post dispatched automatically. "Sem spam." | ✓ |
| Curadoria mensal | Manual monthly digest. More editorial work, requires disabling RSS-to-email. | |

**User's choice:** Novos posts + extras ocasionais (RSS-to-email)

---

## /privacidade — Buttondown disclosure

| Option | Description | Selected |
|--------|-------------|----------|
| Named as sub-processor (Recommended) | Buttondown Email, Inc. (EUA) listed explicitly, link to their privacy policy. LGPD Art. 33 international transfer disclosure. | ✓ |
| Generic 'third-party provider' | Role described without naming Buttondown. Simpler to maintain but less transparent. | |

**User's choice:** Named as sub-processor

---

## /privacidade — Retention period

| Option | Description | Selected |
|--------|-------------|----------|
| While subscribed + 30 days after unsubscribe (Recommended) | Standard practice, LGPD Art. 16 necessity principle. | ✓ |
| While subscribed only | Deleted immediately on unsubscribe. Strictest interpretation. | |

**User's choice:** While subscribed + 30 days after unsubscribe

---

## Claude's Discretion

- Form placement in PostLayout (skipped by user — between article and CommentsEmbed)
- CSS styling of newsletter form
- /newsletter page header/layout treatment
- Error message copy for failed subscription

## Deferred Ideas

- Lead magnet PDF — Phase 9
- List segmentation — not meaningful <100 subs
- Issue archive on /newsletter — add when content grows
