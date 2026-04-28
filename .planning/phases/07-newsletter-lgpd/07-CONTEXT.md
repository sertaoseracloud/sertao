# Phase 7: Newsletter + LGPD completa - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Email capture compliant with Brazilian LGPD (Lei 13.709/2018) via Buttondown. Delivers:
- Inline subscribe form in every post (PostLayout)
- Standalone `/newsletter` page with minimal pitch + form
- Full `/privacidade` page update covering email as personal data, Buttondown as sub-processor, subscriber rights
- Buttondown account + RSS-to-email wired so each new post auto-dispatches to subscribers

Not in scope: lead magnet PDF, list segmentation, modal/exit-intent popups.

</domain>

<decisions>
## Implementation Decisions

### Newsletter Form (Subscribe)

- **D-01:** Custom plain HTML `<form>` POSTing to Buttondown's embed API endpoint (`https://buttondown.com/api/emails/embed-subscribe/{username}`). Zero external JS dependency. No Buttondown embed widget. Matches the project's "no external scripts" pattern (same as CommentsEmbed using is:inline).
- **D-02:** On submit → inline success message replaces the form. PT-BR copy: "Obrigado! Confira sua caixa de entrada para confirmar." A small `<script is:inline>` handles the AJAX POST and DOM swap. No page redirect — reader stays in context.
- **D-03:** LGPD checkbox on every form instance (inline AND /newsletter page): NOT pre-marked, linked to `/privacidade`. Label: "Li e aceito a [Política de Privacidade](/privacidade) e consinto com o envio de emails."
- **D-04:** Double opt-in enforced at Buttondown account level — Buttondown sends a confirmation email before activating. No code change required; Buttondown handles the confirmation flow.

### PostLayout Placement

- **D-05:** Claude's Discretion — Newsletter form appears between end of article prose and the CommentsEmbed section. Order in PostLayout: article → Newsletter subscribe section → Comentários (CommentsEmbed). This follows the "read → subscribe → engage" flow. The section heading should be visually distinct from the comments heading (e.g., "Receba novos posts" vs. "Comentários").

### /newsletter Standalone Page

- **D-06:** Minimal design — one short paragraph (2-3 sentences) + the subscribe form + LGPD checkbox. No issue archive, no testimonials, no curated pitch.
- **D-07:** Pitch copy: "Receba novos posts sobre cloud, DevOps e arquitetura diretamente no seu email. Posts novos chegam automaticamente — sem spam, cancele quando quiser." Cadence is post-driven (RSS-to-email), not a manual digest.
- **D-08:** RSS-to-email enabled in Buttondown dashboard: Buttondown subscribes to the blog's `/rss.xml` and dispatches an email for each new post automatically. No code change required — authorial Buttondown config.

### /privacidade Expansion

- **D-09:** Buttondown Email, Inc. (EUA) named explicitly as email delivery sub-processor, with a link to Buttondown's own privacy policy. Covers LGPD Art. 33 (international data transfer) requirements.
- **D-10:** Retention period stated as: "enquanto a assinatura estiver ativa + 30 dias após cancelamento para permitir reinscrição e processamento de opt-out." After 30 days, email is purged from Buttondown.
- **D-11:** LGPD section in /privacidade must include:
  - Finalidade: envio de novos posts e atualizações editoriais
  - Base legal: consentimento (Art. 7, I, LGPD)
  - Dados coletados: endereço de e-mail
  - Sub-processador: Buttondown Email, Inc. (EUA) — link à política de privacidade do Buttondown
  - Tempo de retenção: ativo + 30 dias pós-cancelamento
  - Direitos do titular: Art. 18 (acesso, correção, eliminação, portabilidade, revogação) — exercitados via cancelamento de assinatura (link em cada email) ou contato em engcfraposo@gmail.com
  - Mecanismo de revogação: link de unsubscribe em todo email enviado (provido automaticamente pelo Buttondown)
- **D-12:** The existing `/privacidade` text ("não coleta dados pessoais") must be updated to reflect that email is now collected when the user voluntarily subscribes. The analytics/tracking section remains accurate (no cookies, no tracking).

### Claude's Discretion

- Exact CSS styling of the Newsletter subscribe form (use design system tokens: `--nucleo-eletrico` for CTA button, `--sub-nivel` for input background, consistent with tag chip and search button styles)
- Whether the /newsletter page gets a dedicated `<Header>` section callout or uses the standard stage layout like /privacidade
- Error message copy for failed subscription (e.g., network error, already subscribed)
- Whether to add a small "já sou assinante" / "desinscrever" link near the form for subscribers who already signed up

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project structure and existing pages
- `src/layouts/PostLayout.astro` — CommentsEmbed integration point; Newsletter section goes between article end and CommentsEmbed (D-05)
- `src/pages/privacidade.astro` — existing stub to expand (D-09 through D-12)
- `src/pages/rss.xml.ts` — RSS feed that Buttondown's RSS-to-email will subscribe to (D-08)

### Design system
- `src/styles/global.css` — design tokens (`--nucleo-eletrico`, `--sub-nivel`, `--texto-principal`, etc.) for form styling
- `.planning/ROADMAP.md` §"Phase 7 — Newsletter + LGPD completa" — success criteria and scope

### LGPD reference
- No external spec file — LGPD requirements are fully captured in D-09 through D-12 above

### Buttondown integration
- Buttondown embed API: `POST https://buttondown.com/api/emails/embed-subscribe/{username}` — returns 200 on success, 400 on already-subscribed. Response body is empty on success.
- No external specs — Buttondown account setup is an authorial prerequisite (same pattern as Giscus IDs in Phase 6)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/CommentsEmbed.astro` — pattern for a self-contained section appended below article in PostLayout (is:inline script, section wrapper, h2 heading)
- `src/styles/global.css` `.comments-section` — CSS pattern for the post-article section block; Newsletter section can use a similar `.newsletter-section` class
- `src/pages/privacidade.astro` — existing LGPD stub with correct markup, author contact, and prose layout — update in place, don't recreate

### Established Patterns
- Plain `<script is:inline>` blocks for small browser interactions (ThemeToggle, CopyCode, Search, CommentsEmbed) — Newsletter AJAX submit follows same pattern
- `class="stage"` + `class="prose"` for page/post content layout — /newsletter page uses same structure
- No `client:` directives for plain Astro components — Newsletter form is a plain Astro component

### Integration Points
- `src/layouts/PostLayout.astro` — add `<NewsletterEmbed />` import + usage between `<CopyCode />` and the CommentsEmbed section
- `src/pages/` — add `newsletter.astro` (new page)
- `src/pages/privacidade.astro` — update existing file to add newsletter LGPD section and update the "no personal data" language

</code_context>

<specifics>
## Specific Ideas

- Pitch copy confirmed: "Receba novos posts sobre cloud, DevOps e arquitetura diretamente no seu email. Posts novos chegam automaticamente — sem spam, cancele quando quiser."
- Success message copy: "Obrigado! Confira sua caixa de entrada para confirmar."
- LGPD checkbox label: "Li e aceito a [Política de Privacidade](/privacidade) e consinto com o envio de emails."
- Anti-feature confirmed: NO popup, NO exit-intent, NO pre-checked checkbox (matches ROADMAP anti-feature list)

</specifics>

<deferred>
## Deferred Ideas

- Lead magnet PDF cheatsheet — Phase 9 if editorial content is ready
- List segmentation by topic/tag — not meaningful <100 subscribers
- Archive of past email issues on /newsletter — add when Buttondown newsletter library grows
- "já sou assinante" / unsubscribe shortcut near form — Claude's Discretion on whether to include

</deferred>

---

*Phase: 07-newsletter-lgpd*
*Context gathered: 2026-04-28*
