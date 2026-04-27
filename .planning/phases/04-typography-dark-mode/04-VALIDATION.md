---
phase: 4
slug: typography-dark-mode
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Build verification (`pnpm build`, `pnpm astro check`) + manual visual |
| **Config file** | `astro.config.mjs` |
| **Quick run command** | `pnpm astro check` |
| **Full suite command** | `pnpm build && node --test scripts/__tests__/**/*.test.ts` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm astro check`
- **After every plan wave:** Run `pnpm build`
- **Before `/gsd-verify-work`:** Full suite must be green + manual visual check in both themes
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | D-01–D-04 (fonts) | T-04-01 | No Google Fonts requests in built output | smoke | `grep -r "googleapis.com" dist/ && echo FAIL || echo PASS` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | D-18–D-19 (typography) | — | N/A | smoke | `pnpm build && ls dist/posts/` | ✅ | ⬜ pending |
| 04-02-01 | 02 | 1 | D-05–D-08 (light theme) | — | N/A | visual | `pnpm dev` → toggle theme | ❌ manual | ⬜ pending |
| 04-02-02 | 02 | 1 | D-09–D-12 (ThemeToggle) | — | N/A | smoke | `grep "data-theme" dist/index.html` | ✅ | ⬜ pending |
| 04-03-01 | 03 | 2 | D-13–D-15 (Shiki) | T-04-02 | No raw markdown in built HTML | smoke | `pnpm build && grep -c "astro-code" dist/posts/hello-sertao/index.html` | ✅ | ⬜ pending |
| 04-03-02 | 03 | 2 | D-16–D-17 (copy button) | — | N/A | visual | `pnpm dev` → click copy button | ❌ manual | ⬜ pending |
| 04-04-01 | 04 | 2 | D-20 (Lighthouse Perf gate) | — | N/A | CI | GitHub Actions deploy → Perf ≥90 | ✅ deploy.yml | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers the automated checks. Manual visual checks are required for:
- Theme toggle (dark ↔ light), FOUC absence on page load
- Code block rendering with `houston` theme in dark mode and `github-light` in light mode
- Font rendering (Space Grotesk loaded from /fonts/, not Google)
- Copy button feedback ("Copiar" → "✓" → reset)

*No new test files needed — Phase 4 has no business logic; verification is build + visual.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No FOUC on page load | D-11, D-12 | Requires browser observation | Hard-reload page; check if theme flashes before settling |
| Light theme renders correctly | D-05–D-08 | Visual comparison | Toggle to light; verify #F5F0E8 bg, #0A0F1E text, #284068 accents |
| Shiki `houston` dark theme in code blocks | D-13 | Visual | View `/posts/hello-sertao` in dark mode; verify code block colors |
| Copy button clipboard function | D-17 | Browser clipboard API | Click copy button; paste elsewhere; verify code copied |
| prefers-color-scheme detection | D-11 | OS-level setting | Clear localStorage, set OS to light mode, hard-reload; verify light theme auto-applied |
| Font rendering (Google Fonts blocked) | D-01–D-03 | Browser Network tab | Open DevTools Network; reload; confirm zero requests to fonts.googleapis.com |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
