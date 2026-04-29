---
phase: 07-newsletter-lgpd
verified: 2026-04-29T12:00:00Z
status: human_needed
score: 10/10
overrides_applied: 0
human_verification:
  - test: "Visual: post page shows Newsletter section between article prose and Comentários"
    expected: "A 'Receba novos posts' section with email input, Inscrever-se button, and unchecked LGPD checkbox appears below article content and above the Comentários section on any post page"
    why_human: "Rendering order and visual appearance require browser inspection of a live post page"
  - test: "Visual: LGPD consent checkbox is not pre-checked on both /newsletter and post form"
    expected: "Checkbox renders unchecked by default; user must actively check it before submitting"
    why_human: "HTML required attribute and absence of 'checked' attribute are verified in code, but actual browser rendering needs confirmation"
  - test: "Visual: Newsletter section renders correctly in both dark and light themes"
    expected: "Form fields, button, consent label, and feedback messages use design system tokens and are legible in both themes"
    why_human: "CSS token rendering and theme switching cannot be verified statically"
  - test: "Authorial: Buttondown account created with REPLACE_WITH_BUTTONDOWN_USERNAME replaced"
    expected: "Both src/components/NewsletterEmbed.astro and src/pages/newsletter.astro have the real Buttondown username in two places each"
    why_human: "REPLACE_WITH_BUTTONDOWN_USERNAME placeholder is intentionally present in code; author must complete Buttondown account setup and replace the placeholder before the form is live"
  - test: "Authorial: Double opt-in enabled in Buttondown dashboard"
    expected: "Buttondown Settings -> Subscribing -> Require double opt-in is enabled"
    why_human: "Dashboard configuration — no code representation"
  - test: "Authorial: RSS-to-email configured in Buttondown"
    expected: "Buttondown Sending -> RSS-to-email -> https://sertaoseracloud.com/rss.xml added"
    why_human: "Dashboard configuration — no code representation"
  - test: "Authorial: SPF/DKIM/DMARC configured for news@sertaoseracloud.com"
    expected: "Email authentication records present in DNS for sertaoseracloud.com"
    why_human: "DNS configuration — no code representation"
  - test: "Smoke test: Submit test email on /newsletter with real Buttondown username"
    expected: "Inline success message appears without page reload; subscriber appears as pending in Buttondown dashboard awaiting confirmation"
    why_human: "Requires live Buttondown account with placeholder replaced; cannot test no-cors fetch endpoint without real service"
  - test: "Smoke test: Export CSV from Buttondown dashboard validates subscriber portability"
    expected: "CSV download contains subscriber list — validates LGPD data portability right (Art. 18)"
    why_human: "Requires live Buttondown account with at least one subscriber"
  - test: "Confirm no popup modal or exit-intent behavior on any page"
    expected: "No modal appears on page load or scroll; newsletter form is inline only"
    why_human: "Anti-feature confirmation requires visual browser inspection"
---

# Phase 7: Newsletter + LGPD Verification Report

**Phase Goal:** Captura de email conforme LGPD. `/privacidade` completa. Inscrição inline no fim do post + página `/newsletter` dedicada.
**Verified:** 2026-04-29T12:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every post page shows a Newsletter subscribe section between article prose and Comentários | ✓ VERIFIED | PostLayout.astro line 50: `<NewsletterEmbed />` at line 50, `<CopyCode />` at line 49, `<section class="comments-section">` at line 51 — correct order confirmed |
| 2 | The subscribe form has an email input, Inscrever-se button, and an unchecked LGPD consent checkbox | ✓ VERIFIED | NewsletterEmbed.astro: `type="email"` input with `required`, button "Inscrever-se", checkbox with `required` and no `checked` attribute — grep "checked" returns zero matches |
| 3 | Submitting the form fires a no-cors AJAX POST to the Buttondown embed endpoint and shows an inline success message without page reload | ✓ VERIFIED | NewsletterEmbed.astro lines 104-112: `fetch(..., { method: 'POST', body: body, mode: 'no-cors' })` with `.then()` hiding form and showing `#newsletter-success`; `e.preventDefault()` prevents page reload; XSS safe: `errorDiv.textContent` (not innerHTML) |
| 4 | The newsletter CSS renders correctly in both dark and light themes using design system tokens | ✓ VERIFIED (code) / ? HUMAN | global.css lines 1028-1141: Phase 7 block with all 15 newsletter-* classes using `--nucleo-eletrico`, `--sub-nivel`, `--texto-principal`, `--texto-secundario`, `--hairline`, `--hairline-strong`, `--abismo-profundo` tokens. Visual rendering requires human check |
| 5 | A /newsletter page exists with the D-07 pitch copy and a working subscribe form with LGPD checkbox | ✓ VERIFIED | src/pages/newsletter.astro exists; "Receba novos posts sobre cloud, DevOps e arquitetura diretamente no seu email. Posts novos chegam automaticamente — sem spam, cancele quando quiser." at line 23-24; form with LGPD checkbox; no `checked` attribute |
| 6 | /privacidade names Buttondown Email, Inc. as the email sub-processor with a link to their privacy policy | ✓ VERIFIED | privacidade.astro line 45-46: "Buttondown Email, Inc. (EUA)" + `href="https://buttondown.com/legal/privacy"` |
| 7 | /privacidade contains all seven required LGPD disclosure items | ✓ VERIFIED | All 7 items confirmed: Finalidade (line 41), Base legal Art. 7º I (line 42), Dados coletados (line 43), Sub-processador Buttondown + link (lines 45-49), Tempo de retenção 30 dias (lines 51-53), Direitos Art. 18 (lines 55-60), Mecanismo de revogação unsubscribe (lines 62-64) |
| 8 | The /privacidade "não coleta dados pessoais de visitantes" claim is narrowed to analytics/tracking context | ✓ VERIFIED | Old claim removed — grep returns zero matches; new narrowed text at line 30-33 redirects to newsletter section |
| 9 | The Footer contains a link to /newsletter | ✓ VERIFIED | Footer.astro line 5: `{ href: '/newsletter', label: 'Newsletter' }` — first entry in socials array, no `target="_blank"` (internal link, correct) |
| 10 | The /privacidade last-updated date reflects Phase 7 implementation (2026-04-28) | ✓ VERIFIED | privacidade.astro line 18: "Última atualização: 28 de abril de 2026" |

**Score:** 10/10 truths verified (code-verifiable portion)

### Deferred Items

No items deferred to later phases — all code deliverables for Phase 7 are implemented.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/NewsletterEmbed.astro` | Newsletter subscribe section with form + is:inline AJAX handler | ✓ VERIFIED | 125 lines; contains REPLACE_WITH_BUTTONDOWN_USERNAME in 2 places (form action + USERNAME var); is:inline script; no-cors fetch; ARIA live regions |
| `src/styles/global.css` | Phase 7 CSS block with newsletter classes | ✓ VERIFIED | Section 16 at line 1024; 15 newsletter-* classes all present |
| `src/layouts/PostLayout.astro` | NewsletterEmbed wired between CopyCode and comments-section | ✓ VERIFIED | Import at line 7; usage at line 50 between CopyCode (49) and comments-section (51) |
| `src/pages/newsletter.astro` | Standalone newsletter subscribe page with pitch + form | ✓ VERIFIED | D-07 pitch copy, LGPD form, is:inline AJAX handler, REPLACE_WITH_BUTTONDOWN_USERNAME in 2 places |
| `src/pages/privacidade.astro` | Full LGPD-compliant privacy policy including newsletter email section | ✓ VERIFIED | All 7 LGPD items, updated date, corrected personal data claim, updated meta description |
| `src/components/Footer.astro` | Footer with Newsletter nav link | ✓ VERIFIED | /newsletter as first socials entry |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/layouts/PostLayout.astro` | `src/components/NewsletterEmbed.astro` | import + JSX between CopyCode and comments-section | ✓ WIRED | Import line 7; usage line 50; correct document order |
| `src/components/NewsletterEmbed.astro` | Buttondown embed endpoint | fetch() in is:inline script, mode: no-cors | ✓ WIRED | Lines 104-107: `fetch('https://buttondown.com/api/emails/embed-subscribe/' + USERNAME, { method: 'POST', body: body, mode: 'no-cors' })` |
| `src/pages/newsletter.astro` | Buttondown embed endpoint | form action + is:inline script, mode: no-cors | ✓ WIRED | Form action at line 31; fetch at lines 109-112 with mode: 'no-cors' |
| `src/pages/privacidade.astro` | `https://buttondown.com/legal/privacy` | anchor link within Buttondown sub-processor prose | ✓ WIRED | Line 46: `<a href="https://buttondown.com/legal/privacy" target="_blank" rel="noopener noreferrer">` |

### Data-Flow Trace (Level 4)

Not applicable — all components are static HTML forms with inline JavaScript. There are no React/framework components with state management. The data flow is: user types email → JS intercepts submit → URLSearchParams POST to Buttondown → opaque response → DOM swap. All DOM mutations use `textContent` (not `innerHTML`), `removeAttribute('hidden')`, and `style.display = 'none'` — no dynamic data from a database or API is rendered into the DOM.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| NewsletterEmbed import resolves in PostLayout | `grep -c "NewsletterEmbed" C:/Repo/blog_sertao/src/layouts/PostLayout.astro` | 2 (import + usage) | ✓ PASS |
| No pre-checked checkbox in NewsletterEmbed | `grep "checked" C:/Repo/blog_sertao/src/components/NewsletterEmbed.astro` | 0 matches | ✓ PASS |
| No pre-checked checkbox in newsletter.astro | `grep "checked" C:/Repo/blog_sertao/src/pages/newsletter.astro` | 0 matches | ✓ PASS |
| XSS safe: errorDiv uses textContent not innerHTML | `grep "textContent" C:/Repo/blog_sertao/src/components/NewsletterEmbed.astro` | 3 matches (textContent only, no innerHTML) | ✓ PASS |
| Old inaccurate privacy claim removed | `grep "não coleta dados pessoais de visitantes" C:/Repo/blog_sertao/src/pages/privacidade.astro` | 0 matches | ✓ PASS |
| All 7 LGPD items present | `grep -c "Art\. 7\|Art\. 18\|Finalidade\|Base legal\|Sub-processador\|retenção\|Mecanismo de revogação" privacidade.astro` | 7 matches | ✓ PASS |
| Footer newsletter link exists | `grep "/newsletter" C:/Repo/blog_sertao/src/components/Footer.astro` | 1 match at line 5 | ✓ PASS |
| Build check (no-cors fetch, live Buttondown) | Cannot test without real Buttondown account | n/a | ? SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| D-01 | 07-01 | Custom plain HTML form POSTing to Buttondown embed API, zero external JS | ✓ SATISFIED | NewsletterEmbed.astro uses `<form>` + is:inline AJAX; no external scripts |
| D-02 | 07-01 | Inline success message replaces form on submit, no page reload | ✓ SATISFIED | `e.preventDefault()` + `form.style.display = 'none'` + `successDiv.removeAttribute('hidden')` |
| D-03 | 07-01 | LGPD checkbox NOT pre-marked, linked to /privacidade | ✓ SATISFIED | `required` only, no `checked` attribute; label links to `/privacidade` in both form instances |
| D-04 | 07-02 | Double opt-in at Buttondown account level | ? NEEDS HUMAN | Authorial Buttondown dashboard action; no code representation |
| D-05 | 07-01 | Newsletter between article prose and CommentsEmbed in PostLayout | ✓ SATISFIED | PostLayout lines 49-51: CopyCode → NewsletterEmbed → comments-section |
| D-06 | 07-02 | /newsletter minimal design: 2-3 sentence pitch + form + LGPD checkbox | ✓ SATISFIED | newsletter.astro: single pitch paragraph + form section; no testimonials/archive |
| D-07 | 07-02 | Locked pitch copy present on /newsletter page | ✓ SATISFIED | "Receba novos posts sobre cloud, DevOps e arquitetura diretamente no seu email. Posts novos chegam automaticamente — sem spam, cancele quando quiser." at newsletter.astro lines 23-24 |
| D-08 | 07-02 | RSS-to-email in Buttondown subscribed to /rss.xml | ? NEEDS HUMAN | Authorial Buttondown dashboard action; no code representation |
| D-09 | 07-02 | Buttondown Email, Inc. named as sub-processor with privacy policy link | ✓ SATISFIED | privacidade.astro lines 45-46; link to https://buttondown.com/legal/privacy |
| D-10 | 07-02 | Retention period: active + 30 days post-cancellation | ✓ SATISFIED | privacidade.astro lines 51-53: "enquanto a assinatura estiver ativa + 30 dias após cancelamento" |
| D-11 | 07-02 | All 7 LGPD disclosure items in /privacidade | ✓ SATISFIED | All 7 items confirmed at privacidade.astro lines 41-64 |
| D-12 | 07-02 | "não coleta dados pessoais" claim narrowed to tracking context | ✓ SATISFIED | Old claim removed; new text at line 30-33 accurately scopes claim to "dados de navegação" and redirects to newsletter section |

**ROADMAP success criteria cross-check:**

| ROADMAP Criterion | Status | Notes |
|-------------------|--------|-------|
| Conta Buttondown criada + SPF/DKIM/DMARC | ? NEEDS HUMAN | Authorial prerequisite |
| Formulário inline no fim do post + /newsletter standalone | ✓ CODE VERIFIED | Both form instances present |
| Double opt-in habilitado no Buttondown | ? NEEDS HUMAN | Authorial prerequisite |
| Checkbox NÃO pré-marcado + link /privacidade | ✓ CODE VERIFIED | No `checked` attr; link present |
| /privacidade completa com 7 LGPD items | ✓ CODE VERIFIED | All items present |
| Teste de export CSV da lista | ? NEEDS HUMAN | Requires live Buttondown account |
| RSS-to-email ativo no Buttondown | ? NEEDS HUMAN | Authorial dashboard action |
| Anti-feature: sem popup modal | ✓ CODE VERIFIED (code) / ? HUMAN | No modal code in codebase; visual check still advised |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/NewsletterEmbed.astro` | 25, 83 | `REPLACE_WITH_BUTTONDOWN_USERNAME` placeholder | ℹ️ Info | Intentional authorial stub — newsletter form will silently fail (no-cors, opaque response) until replaced. Documented in SUMMARY.md Known Stubs. Does NOT block LGPD compliance or page rendering. |
| `src/pages/newsletter.astro` | 31, 91 | `REPLACE_WITH_BUTTONDOWN_USERNAME` placeholder | ℹ️ Info | Same as above — intentional authorial placeholder. Two occurrences (form action + USERNAME var) as designed. |

No blocker anti-patterns. The placeholder username is classified Info because: (a) it is explicitly documented and intentional, (b) it does not affect rendering or LGPD compliance, (c) the plan frontmatter acknowledges it as a known stub requiring authorial action.

### Human Verification Required

#### 1. Visual rendering — Newsletter section in post pages

**Test:** Run `pnpm preview`, navigate to any post (e.g., the CKA post at `/posts/{slug}`), scroll past the article body.
**Expected:** A "Receba novos posts" section appears with email input, "Inscrever-se" button, and an unchecked LGPD checkbox — positioned between article content and the "Comentários" section.
**Why human:** Component rendering order and visual appearance require browser inspection.

#### 2. Theme rendering — Dark and light mode

**Test:** Toggle dark/light mode on a post page with the newsletter section visible.
**Expected:** All form elements (input, button, checkbox, labels, feedback message placeholders) render legibly with correct brand colors in both modes.
**Why human:** CSS custom property resolution in browser cannot be verified statically.

#### 3. LGPD checkbox not pre-checked (live browser)

**Test:** Open `/newsletter` and any post page in a browser.
**Expected:** The consent checkbox is visually unchecked when the page loads.
**Why human:** HTML attribute absence is code-verified, but actual browser rendering needs visual confirmation.

#### 4. No popup / no exit-intent anti-feature

**Test:** Browse the site, scroll posts, wait on pages.
**Expected:** No modal or exit-intent popup appears anywhere.
**Why human:** Visual confirmation needed for the anti-feature guarantee.

#### 5. Authorial: Replace REPLACE_WITH_BUTTONDOWN_USERNAME

**Test:** Create a Buttondown account at https://buttondown.com, find your username, replace the placeholder in both `src/components/NewsletterEmbed.astro` (2 occurrences) and `src/pages/newsletter.astro` (2 occurrences).
**Expected:** Forms POST to your real Buttondown newsletter endpoint.
**Why human:** Requires author account setup — no code can pre-supply this.

#### 6. Authorial: Enable double opt-in in Buttondown

**Test:** Buttondown dashboard -> Settings -> Subscribing -> enable "Require double opt-in".
**Expected:** Subscribers receive a confirmation email before being activated.
**Why human:** Dashboard configuration, no code representation.

#### 7. Authorial: Configure RSS-to-email in Buttondown (D-08)

**Test:** Buttondown dashboard -> Sending -> RSS-to-email -> add feed URL `https://sertaoseracloud.com/rss.xml`.
**Expected:** New posts automatically dispatch newsletter emails.
**Why human:** Dashboard configuration, no code representation.

#### 8. Smoke test: End-to-end subscribe flow

**Test:** After replacing the username placeholder, run `pnpm preview`, submit a test email address through the form on `/newsletter` (with checkbox checked), open browser DevTools Network tab.
**Expected:** A POST request fires to `https://buttondown.com/api/emails/embed-subscribe/{username}`; inline success message "Obrigado! Confira sua caixa de entrada para confirmar." replaces the form without page reload; subscriber appears in Buttondown dashboard as pending confirmation.
**Why human:** Requires live Buttondown account; no-cors opaque response cannot be inspected programmatically.

#### 9. Authorial: Validate subscriber data portability (D-11 Art. 18)

**Test:** After acquiring at least one subscriber, use Buttondown dashboard -> Subscribers -> Export CSV.
**Expected:** CSV download contains subscriber list, confirming data portability right is exercisable.
**Why human:** Requires live account with subscriber data.

### Gaps Summary

No code gaps were identified. All ten observable truths are verified at the code level. All twelve requirement IDs (D-01 through D-12) are accounted for — ten are satisfied by code artifacts, two (D-04, D-08) are explicitly designated as authorial Buttondown dashboard actions with no code representation, matching the plan's `user_setup` documentation.

The `human_needed` status reflects nine human verification items that include both visual/behavioral checks and authorial setup steps (Buttondown account, double opt-in, RSS-to-email, SPF/DKIM/DMARC). These are prerequisites for the newsletter to actually function — the code infrastructure is complete and correct.

---

_Verified: 2026-04-29T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
