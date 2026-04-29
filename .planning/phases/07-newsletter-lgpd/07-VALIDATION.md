---
phase: 7
slug: newsletter-lgpd
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (existing — pnpm test:sync) + pnpm build smoke tests |
| **Config file** | none — using existing test runner + build command |
| **Quick run command** | `pnpm astro check` |
| **Full suite command** | `pnpm build && pnpm test:sync` |
| **Estimated runtime** | ~45 seconds (build ~30s + tests ~1s) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm astro check`
- **After every plan wave:** Run `pnpm build && pnpm test:sync`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | D-01 | T-07-01 | Form POSTs to Buttondown, no external JS loaded | grep | `grep "buttondown.com" src/components/NewsletterEmbed.astro` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | D-02 | T-07-02 | AJAX inline handler present | grep | `grep "is:inline" src/components/NewsletterEmbed.astro` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | D-03 | T-07-03 | Checkbox not pre-marked | grep | `grep -v 'checked' src/components/NewsletterEmbed.astro` | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 1 | D-05 | — | Newsletter section before CommentsEmbed in PostLayout | grep | `grep -n "NewsletterEmbed\|CommentsEmbed" src/layouts/PostLayout.astro` | ✅ | ⬜ pending |
| 07-01-05 | 01 | 1 | CSS | — | newsletter-section CSS present | grep | `grep "\.newsletter-section\|\.newsletter-form\|\.newsletter-submit-btn" src/styles/global.css` | ✅ | ⬜ pending |
| 07-02-01 | 02 | 2 | D-06/07 | — | /newsletter page exists with pitch copy | grep | `grep "Receba novos posts" src/pages/newsletter.astro` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | D-09/11 | T-07-04 | /privacidade names Buttondown as sub-processor | grep | `grep "Buttondown" src/pages/privacidade.astro` | ✅ | ⬜ pending |
| 07-02-03 | 02 | 2 | D-11 | T-07-04 | /privacidade contains Art. 18 rights | grep | `grep "Art\. 18\|artigo 18" src/pages/privacidade.astro` | ✅ | ⬜ pending |
| 07-02-04 | 02 | 2 | D-11 | — | /privacidade contains retention period | grep | `grep "30 dias\|retenção" src/pages/privacidade.astro` | ✅ | ⬜ pending |
| 07-02-05 | 02 | 2 | build | — | Full build succeeds | build | `pnpm build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/NewsletterEmbed.astro` — stub (empty component) so PostLayout imports don't fail during astro check
- [ ] `src/pages/newsletter.astro` — stub page so Astro router resolves /newsletter during build

*Existing infrastructure (pnpm build + pnpm test:sync + pnpm astro check) covers all other phase requirements. No new test framework needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Buttondown form submission creates subscriber | D-01 | Requires live Buttondown account (authorial prerequisite) and real email address | After account creation: fill form with real email → check Buttondown dashboard for pending subscriber → confirm email → check dashboard shows confirmed |
| Double opt-in email arrives | D-04 | Requires live Buttondown + real email inbox | After form submit → check inbox for Buttondown confirmation email → click confirm link |
| Inline success message appears after submit | D-02 | Browser interaction required (no-cors AJAX) | Run `pnpm preview` → navigate to any post → fill newsletter form → click Inscrever-se → verify success message replaces form without page reload |
| CORS mode works from localhost | — | no-cors fetch is environment-dependent | During pnpm preview: open DevTools → Network → confirm Buttondown request sent → confirm no CORS error in console |
| RSS-to-email dispatches on new post | D-08 | Requires Buttondown dashboard config + live RSS feed + waiting for cron | After Buttondown RSS integration is enabled: publish new post → wait for Buttondown cron (~1h) → check that email was dispatched |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
