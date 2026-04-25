---
phase: 3
slug: seo-rss-a11y
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-25
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` built-in (Node 22+) + `pnpm build` smoke tests |
| **Config file** | None — `node --test` runner |
| **Quick run command** | `node --test scripts/__tests__/pr-builder.test.ts` |
| **Full suite command** | `pnpm test:sync && pnpm build` |
| **Estimated runtime** | ~30 seconds (unit tests + static build) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:sync` (keeps sync pipeline green)
- **After schema changes:** Run `pnpm astro check` (TypeScript diagnostics)
- **After every wave:** Run `pnpm build` (catches RSS/sitemap/SEO output)
- **Before `/gsd-verify-work`:** Full suite green + Lighthouse CI gate passing
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| SEO component | — | 1 | D-02 | T-03-03 (JSON-LD injection) | JSON.stringify escapes title/description in JSON-LD | manual + visual | `pnpm dev` → view-source `/posts/hello-sertao` | ❌ new | ⬜ pending |
| JSON-LD BlogPosting | — | 1 | D-04 | T-03-03 | `JSON.stringify` used for all string fields | manual | `pnpm build && grep -c 'BlogPosting' dist/posts/hello-sertao/index.html` | ❌ new | ⬜ pending |
| RSS full content | — | 1 | D-06 | T-03-01 (XSS via markdown) | `sanitize-html` cleanses HTML before feed embedding | smoke | `pnpm build && ls dist/rss.xml` | ❌ new | ⬜ pending |
| Sitemap integration | — | 1 | D-09 | — | `robots.txt` references correct `sitemap-index.xml` path | smoke | `pnpm build && ls dist/sitemap-index.xml` | ❌ new | ⬜ pending |
| robots.txt | — | 1 | D-10 | — | `Allow: /` only; `Sitemap:` references `sitemap-index.xml` | smoke | `pnpm build && cat dist/robots.txt` | ❌ new | ⬜ pending |
| formatDatePtBr helper | — | 1 | D-11 | — | Returns PT-BR formatted date string | unit | `node --test scripts/__tests__/pr-builder.test.ts` (if added) | ❌ optional | ⬜ pending |
| 404 page | — | 1 | D-12 | — | Branded, PT-BR, renders at `/404` | smoke | `pnpm build && ls dist/404.html` | ❌ new | ⬜ pending |
| Skip-link | — | 1 | D-13 | — | First focusable element, targets `#main-content` | manual | `pnpm dev` → Tab key navigates skip-link | ❌ new | ⬜ pending |
| Focus ring | — | 1 | D-14 | — | `--nucleo-eletrico` (#00FFFF) ring on all `:focus-visible` | manual | `pnpm dev` → Tab through interactive elements | ❌ new | ⬜ pending |
| Lighthouse CI gate | — | 2 | D-15 | — | A11y score ≥90 on `/`, `/posts/hello-sertao`, `/404` | CI | `treosh/lighthouse-ci-action` in deploy.yml | ❌ new | ⬜ pending |
| coverAlt superRefine | — | 1 | D-16 | — | Schema rejects post with `coverImageUrl` but no `coverAlt` | unit | `node --test scripts/__tests__/pr-builder.test.ts` | ✅ update | ⬜ pending |
| PRBuilder coverAlt fallback | — | 1 | D-17 | — | Fallback sets `coverAlt: article.title` when no alt provided | unit | `node --test scripts/__tests__/pr-builder.test.ts` | ✅ update | ⬜ pending |
| /privacidade page | — | 1 | D-18 | — | Page renders at `/privacidade` with LGPD content | smoke | `pnpm build && ls dist/privacidade/index.html` | ❌ new | ⬜ pending |
| PostLayout + [slug] route | — | 1 | (prereq) | — | `/posts/hello-sertao` renders (Lighthouse needs it) | smoke | `pnpm build && ls dist/posts/hello-sertao/index.html` | ❌ new | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Add test case in `scripts/__tests__/pr-builder.test.ts` for D-17: PRBuilder sets `coverAlt: article.title` when `coverImageUrl` is present but `coverAlt` is absent
- [ ] Add test case in `scripts/__tests__/pr-builder.test.ts` (or schema test) for D-16: Zod `.superRefine()` rejects article with `coverImageUrl` present but `coverAlt` absent
- [ ] `pnpm add @astrojs/sitemap @astrojs/rss markdown-it sanitize-html` installed before any build-smoke tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SEO meta tags render correctly in `<head>` | D-02, D-03, D-04, D-05 | Astro component rendering not testable with `node:test`; no Playwright in project | `pnpm dev` → `/posts/hello-sertao` → view-source → verify `<title>`, `<meta description>`, OG tags, `<script type="application/ld+json">` |
| Skip-link is visually hidden until Tab | D-13 | CSS visibility requires browser rendering | `pnpm dev` → press Tab once → skip-link appears; Escape or Enter → returns to hidden |
| Focus ring visible on all interactive elements | D-14 | CSS requires browser rendering | `pnpm dev` → Tab through all interactive elements on homepage and a post |
| RSS feed content is readable in RSS reader | D-06 | Full content fidelity requires human review | `pnpm build` → open `dist/rss.xml` → paste into RSS reader or validator (e.g. validator.w3.org/feed/) |
| Lighthouse A11y ≥ 90 in CI | D-15 | Requires deployed URL or local server + CI environment | Runs automatically in GitHub Actions on push to `main` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s (pnpm build is the bottleneck)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
