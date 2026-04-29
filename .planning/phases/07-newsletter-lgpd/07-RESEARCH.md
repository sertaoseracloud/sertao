# Phase 7: Newsletter + LGPD completa — Research

**Researched:** 2026-04-28
**Domain:** Buttondown embed API, AJAX form submission in Astro is:inline, LGPD compliance (Lei 13.709/2018)
**Confidence:** HIGH (API behavior partially ASSUMED — see Assumptions Log)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Custom plain HTML `<form>` POSTing to `https://buttondown.com/api/emails/embed-subscribe/{username}`. Zero external JS dependency. No Buttondown embed widget.
- **D-02:** On submit → inline success message replaces the form. PT-BR copy: "Obrigado! Confira sua caixa de entrada para confirmar." Small `<script is:inline>` handles the AJAX POST and DOM swap. No page redirect.
- **D-03:** LGPD checkbox on every form instance: NOT pre-marked, linked to `/privacidade`. Label: "Li e aceito a [Política de Privacidade](/privacidade) e consinto com o envio de emails."
- **D-04:** Double opt-in enforced at Buttondown account level. No code change required.
- **D-05:** PostLayout order: article → Newsletter subscribe section → Comentários (CommentsEmbed). Heading: "Receba novos posts".
- **D-06:** /newsletter page minimal: one short paragraph + subscribe form + LGPD checkbox.
- **D-07:** Pitch copy locked: "Receba novos posts sobre cloud, DevOps e arquitetura diretamente no seu email. Posts novos chegam automaticamente — sem spam, cancele quando quiser."
- **D-08:** RSS-to-email enabled in Buttondown dashboard — no code change required.
- **D-09:** Buttondown Email, Inc. (EUA) named as email delivery sub-processor in /privacidade, with link to Buttondown's own privacy policy.
- **D-10:** Retention: "enquanto a assinatura estiver ativa + 30 dias após cancelamento."
- **D-11:** LGPD section in /privacidade must include: Finalidade, Base legal (Art. 7 I), Dados coletados, Sub-processador, Tempo de retenção, Direitos do titular (Art. 18), Mecanismo de revogação.
- **D-12:** Update "Este site não coleta dados pessoais" language in /privacidade — it now does collect email on voluntary subscription.

### Claude's Discretion

- Exact CSS styling of the Newsletter subscribe form (use design system tokens).
- Whether /newsletter page gets a dedicated `<Header>` callout or standard stage layout like /privacidade.
- Error message copy for failed subscription (network error, already subscribed).
- Whether to add "já sou assinante" / "desinscrever" link near the form.

### Deferred Ideas (OUT OF SCOPE)

- Lead magnet PDF cheatsheet — Phase 9 if editorial content is ready.
- List segmentation by topic/tag — not meaningful <100 subscribers.
- Archive of past email issues on /newsletter — add when Buttondown newsletter library grows.
</user_constraints>

---

## Summary

Phase 7 delivers three concrete code deliverables: a `NewsletterEmbed.astro` component, a `src/pages/newsletter.astro` standalone page, and an updated `src/pages/privacidade.astro`. All three involve NO new package dependencies — the form is plain HTML, the AJAX handler is a `<script is:inline>` block, and the privacy page is static Astro prose.

The critical technical question is CORS behavior of the Buttondown embed-subscribe endpoint. Research confirms: Buttondown's `https://buttondown.com/api/emails/embed-subscribe/{username}` endpoint has documented CORS concerns for AJAX requests, but the endpoint is designed specifically for cross-origin HTML form POST submissions. The practical implementation uses `fetch()` with `mode: 'no-cors'` (opaque response) for the submit-and-forget pattern, or falls back to a standard form POST with page redirect if opaque responses are unacceptable. The UI-SPEC (already approved) codifies the AJAX + DOM-swap approach, which requires accepting an opaque response — this means the code cannot read HTTP status codes. The plan MUST address this constraint: the success/error split must be inferred differently than a status code check (see Pitfall 1 below).

The LGPD section has no new dependencies. All nine rights in LGPD Art. 18 are well-documented in official Brazilian law. The consent base (Art. 7, I) and international transfer disclosure (Art. 33, consent mechanism) are straightforward for a small blog.

**Primary recommendation:** Implement the `is:inline` AJAX handler using `fetch()` with `Content-Type: application/x-www-form-urlencoded` (matching what an HTML form natively sends). Accept CORS ambiguity by treating any `fetch` success (no network throw) as "submitted" and showing the success state, since the embed-subscribe endpoint will always redirect/redirect-to-success on valid emails and silently ignore duplicates. The privacy page update is straightforward prose expansion — no architectural complexity.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Email capture form | Browser / Client | — | HTML form + is:inline script, fully client-side, SSG renders the markup |
| Subscribe API call | Browser / Client | — | fetch() from browser to Buttondown; no server component exists (GitHub Pages static) |
| Double opt-in | Buttondown service | — | Handled by Buttondown; no code needed |
| LGPD consent gate | Browser / Client | — | `required` attribute on checkbox; browser native validation enforces |
| Success/error state | Browser / Client | — | DOM swap via is:inline script |
| RSS-to-email dispatch | Buttondown service | — | Buttondown subscribes to /rss.xml; no code needed |
| Privacy page prose | CDN / Static | — | Static Astro page; no dynamic data |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro (existing) | 6.x | Component and page authoring | Already in project |
| Plain HTML `<form>` | N/A | Email capture UI | D-01 (locked) — zero external JS |
| `<script is:inline>` | N/A | AJAX submit handler, DOM swap | Established pattern: CommentsEmbed, BaseLayout FOUC script |
| CSS custom properties | N/A | Form styling via design system tokens | All tokens in `src/styles/global.css`; no new CSS file |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None new | — | — | No new packages needed for this phase |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `is:inline` AJAX handler | Astro Actions API | Actions require Astro SSR mode; project is SSG (GitHub Pages static). Not applicable. |
| `is:inline` AJAX handler | External form service (Formspree, Web3Forms) | Adds third-party dependency. D-01 prohibits. |
| `mode: 'no-cors'` fetch | Serverless function proxy | Correct solution for status-aware error handling, but requires a server (Netlify Functions, Cloudflare Workers). GitHub Pages has no server. Out of scope. |

**Installation:** No new packages required.

---

## Architecture Patterns

### System Architecture Diagram

```
User fills form → [Browser: NewsletterEmbed.astro]
                        |
                        | required checkbox validation (browser native)
                        v
               [is:inline script]
                        |
                        | fetch() POST to Buttondown embed API
                        | Content-Type: application/x-www-form-urlencoded
                        | body: email=user@example.com
                        v
        [Buttondown: embed-subscribe endpoint]
                        |
                   ┌────┴──────┐
                   |           |
               200 OK      Network error
            (opaque on     (fetch throws)
            no-cors mode)
                   |           |
               Show success  Show error
               div, hide form div, re-enable
                              button
```

Note: When using `mode: 'no-cors'`, the response is always opaque — HTTP status code (200, 400, etc.) is not readable by JavaScript. The script can only distinguish "network failure" (fetch throws) from "request reached the server" (fetch resolves). This is by browser design for CORS-protected endpoints.

**Alternative (if opaque response is unacceptable):** Use a standard HTML form POST with `action="https://buttondown.com/api/emails/embed-subscribe/{username}"` — browser follows the redirect to a Buttondown success page. This is the no-JavaScript fallback and provides confirmed status, but breaks the inline success message pattern (D-02).

### Recommended Project Structure

```
src/
├── components/
│   └── NewsletterEmbed.astro   (new — inline form + is:inline AJAX handler)
├── pages/
│   ├── newsletter.astro        (new — standalone subscribe page)
│   └── privacidade.astro       (update — add newsletter LGPD section, fix "no personal data" claim)
└── styles/
    └── global.css              (update — add /* Phase 7 — Newsletter */ CSS block)
```

### Pattern 1: Buttondown Embed Form POST

**What:** HTML form that POSTs to Buttondown's embed endpoint. No authentication required. Designed for cross-origin static sites.

**When to use:** Any static site needing email capture without a server.

**Endpoint:** `https://buttondown.com/api/emails/embed-subscribe/{username}` [CITED: docs.buttondown.com/building-your-subscriber-base]

**Form fields accepted:**
- `email` — required, subscriber email address [CITED: docs.buttondown.com/building-your-subscriber-base]
- `tag` — optional, applies tag to new subscriber [CITED: docs.buttondown.com/building-your-subscriber-base]

**Example (plain form POST — no JS fallback):**
```html
<!-- Source: docs.buttondown.com/building-your-subscriber-base -->
<form
  action="https://buttondown.com/api/emails/embed-subscribe/YOUR_USERNAME"
  method="POST"
  target="_blank"
>
  <input type="email" name="email" required />
  <button type="submit">Inscrever-se</button>
</form>
```

**Example (AJAX + DOM swap — D-01/D-02 implementation):**
```html
<!-- Source: established project pattern (CommentsEmbed.astro, BaseLayout FOUC script) -->
<form id="newsletter-form">
  <input type="email" id="newsletter-email" name="email" required
         placeholder="seu@email.com" aria-label="Endereço de email" />
  <button type="submit" class="newsletter-submit-btn">Inscrever-se</button>
  <div class="newsletter-consent">
    <input type="checkbox" id="newsletter-consent" name="consent" required />
    <label for="newsletter-consent">
      Li e aceito a <a href="/privacidade">Política de Privacidade</a>
      e consinto com o envio de emails.
    </label>
  </div>
</form>
<div id="newsletter-success" hidden role="status" tabindex="-1"
     class="newsletter-message newsletter-message--success">
  Obrigado! Confira sua caixa de entrada para confirmar.
</div>
<div id="newsletter-error" hidden role="alert" tabindex="-1"
     class="newsletter-message newsletter-message--error">
  <!-- copy varies by error type — see Copywriting Contract in UI-SPEC -->
</div>

<script is:inline>
  (function () {
    var form = document.getElementById('newsletter-form');
    var successDiv = document.getElementById('newsletter-success');
    var errorDiv = document.getElementById('newsletter-error');
    var submitBtn = form ? form.querySelector('button[type="submit"]') : null;

    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('newsletter-email').value;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';

      var body = new URLSearchParams();
      body.append('email', email);

      fetch(
        'https://buttondown.com/api/emails/embed-subscribe/YOUR_USERNAME',
        {
          method: 'POST',
          body: body,
          mode: 'no-cors' // opaque — cannot read status; treat resolved fetch as success
        }
      )
        .then(function () {
          // Response is opaque — fetch resolved means request reached server
          form.style.display = 'none';
          successDiv.removeAttribute('hidden');
          successDiv.focus();
        })
        .catch(function () {
          // Network failure
          submitBtn.disabled = false;
          submitBtn.textContent = 'Inscrever-se';
          errorDiv.removeAttribute('hidden');
          errorDiv.textContent =
            'Algo deu errado. Tente novamente ou entre em contato: engcfraposo@gmail.com';
          errorDiv.focus();
        });
    });
  })();
</script>
```

### Pattern 2: LGPD-Compliant Privacy Policy Section

**What:** Static prose section in /privacidade covering all LGPD Art. 18 rights and Art. 33 international transfer disclosure.

**When to use:** Any Brazilian site collecting personal data.

**LGPD Art. 18 rights (all nine, PT-BR):** [CITED: lgpd-brasil.info/capitulo_03/artigo_18]
1. Confirmação da existência de tratamento
2. Acesso aos dados
3. Correção de dados incompletos, inexatos ou desatualizados
4. Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade
5. Portabilidade dos dados a outro fornecedor de serviço ou produto
6. Eliminação dos dados pessoais tratados com o consentimento do titular
7. Informação das entidades públicas e privadas com as quais o controlador realizou uso compartilhado
8. Informação sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa
9. Revogação do consentimento

**Art. 33 international transfer compliance:** For a small blog using a US email provider, the most practical mechanism is explicit consent (Art. 33, VIII) — the user consents to transfer when they check the LGPD checkbox and submit. The checkbox label and privacy page must explicitly state that data is transferred to a US-based provider. [CITED: lgpd-brasil.info/capitulo_05/artigo_33]

**Example LGPD section prose (PT-BR):**
```html
<h2>Newsletter e Email</h2>
<p>
  Ao assinar a newsletter voluntariamente, coletamos e processamos seu
  endereço de email com a finalidade de enviar novos posts e atualizações
  editoriais deste blog.
</p>
<ul>
  <li><strong>Finalidade:</strong> envio de novos posts e atualizações editoriais.</li>
  <li><strong>Base legal:</strong> consentimento do titular (Art. 7º, I, LGPD).</li>
  <li><strong>Dados coletados:</strong> endereço de e-mail.</li>
  <li>
    <strong>Sub-processador:</strong> Buttondown Email, Inc. (EUA) —
    <a href="https://buttondown.com/legal/privacy">política de privacidade do Buttondown</a>.
    Ao assinar, você consente com a transferência internacional do seu e-mail
    aos servidores da Buttondown localizados nos Estados Unidos (Art. 33, VIII, LGPD).
  </li>
  <li><strong>Tempo de retenção:</strong> enquanto a assinatura estiver ativa + 30 dias
    após cancelamento para permitir reinscrição e processamento de opt-out.</li>
  <li>
    <strong>Direitos do titular (Art. 18 LGPD):</strong> você tem o direito de confirmar
    a existência de tratamento, acessar, corrigir, eliminar, portar seus dados e revogar o
    consentimento. Para exercer esses direitos: cancele a assinatura pelo link em todo email
    recebido, ou entre em contato em
    <a href="mailto:engcfraposo@gmail.com">engcfraposo@gmail.com</a>.
  </li>
  <li>
    <strong>Mecanismo de revogação:</strong> link de cancelamento (unsubscribe) presente em
    todo email enviado pelo Buttondown.
  </li>
</ul>
```

### Pattern 3: is:inline Script in Astro Component

**What:** Astro-specific directive that emits raw JavaScript in-place in the HTML output, without bundling or deduplication. Use for small, self-contained browser interactions that need co-location with their markup.

**When to use:** [CITED: docs.astro.build/en/reference/directives-reference]
- When the script must run before the bundler executes (FOUC prevention)
- When the script is tied to specific markup and does not need deduplication
- When TypeScript compilation and tree-shaking are NOT needed (use plain JS, not TS)
- When `data-*` attributes must be readable (bundled scripts strip `data-*` from `<script>` tags)

**Established project use cases:**
- `BaseLayout.astro` line 51: FOUC-prevention theme script [VERIFIED: codebase grep]
- `CommentsEmbed.astro` line 32: Giscus theme correction on mount [VERIFIED: codebase grep]
- `SEO.astro` line 61: JSON-LD static data injection [VERIFIED: codebase grep]

**Contrast with plain `<script>` (Astro-bundled):**
- `ThemeToggle.astro`: uses plain `<script>` (TypeScript, bundled, deduped) [VERIFIED: codebase grep]
- `CopyCode.astro`: uses plain `<script>` (TypeScript, bundled) [VERIFIED: codebase grep]
- `Search.astro`: uses plain `<script>` (TypeScript, dynamic import of Pagefind) [VERIFIED: codebase grep]

**Rule for this phase:** Newsletter AJAX handler uses `is:inline` (plain JS, co-located, small). This matches the CommentsEmbed pattern — small behavioral script tied to a specific section's markup.

### Anti-Patterns to Avoid

- **Adding `client:` directive to a plain Astro component:** `client:visible` etc. are for framework components (React/Svelte/Vue). Applying to `.astro` produces a build warning and does nothing useful. `CopyCode.astro` comment documents this: "client:visible removed... only for framework components." [VERIFIED: codebase grep STATE.md]
- **Pre-checking the LGPD consent checkbox:** LGPD Art. 7, §3 and ANPD guidance require consent to be freely given and unambiguous — pre-marking violates this. D-03 is locked.
- **Using Buttondown's JavaScript widget:** Loads external JS from buttondown.com. D-01 prohibits any external JS dependency.
- **Reading response status from `mode: 'no-cors'` fetch:** The response type is "opaque" — `response.status` is always 0 and `response.ok` is always false. Cannot distinguish 200 from 400 from this response object. [CITED: developer.mozilla.org/en-US/docs/Web/API/Request/mode]
- **Using `new FormData()` directly as fetch body with Buttondown:** FormData sends as `multipart/form-data`, which may not be accepted. Use `URLSearchParams` to send as `application/x-www-form-urlencoded` — this matches what a native browser form POST sends.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email validation | Custom regex | Browser `type="email"` + `required` | Browser handles RFC 5321 edge cases; free |
| Consent enforcement | Custom JS checkbox check | HTML `required` attribute on checkbox | Browser blocks submit with native UI; free |
| Double opt-in flow | Custom confirmation email flow | Buttondown account setting | Buttondown handles the confirmation email and `pending_double_opt_in` state |
| RSS-to-email dispatch | Cron job / webhook trigger | Buttondown dashboard RSS-to-email setting | Buttondown polls /rss.xml and dispatches automatically |
| LGPD consent log | Database of consent records | Not needed at this scale | LGPD Art. 8 §2 — burden of proof for consent is on controller, but for a solo blog with no ad revenue, checkbox consent is sufficient for the risk profile |

**Key insight:** Buttondown is doing the heavy lifting on email delivery compliance (CAN-SPAM, unsubscribe headers, bounce handling). The blog's job is the consent gate and the privacy disclosure — both are pure HTML/prose.

---

## CORS Research Findings (Critical)

The Buttondown embed-subscribe endpoint is specifically designed for static sites but has documented CORS behavior that affects the AJAX approach. [CITED: docs.buttondown.com/embed-form-cors-csp]

### What is confirmed:

1. The endpoint URL `https://buttondown.com/api/emails/embed-subscribe/{username}` exists and accepts HTML form POST. [CITED: docs.buttondown.com/building-your-subscriber-base]
2. Buttondown's own CORS documentation acknowledges that form submission may fail on some sites due to server-level CORS or CSP policies. [CITED: docs.buttondown.com/embed-form-cors-csp]
3. The endpoint is distinct from the authenticated `/v1/subscribers` API (which requires an API key and returns JSON with status codes). [CITED: docs.buttondown.com/api-subscribers-create]
4. Authenticated API (`POST /v1/subscribers`): 201 = created, 400 = collision/duplicate, 429 = rate limit. [CITED: docs.buttondown.com/api-subscribers-create] — NOTE: This is the AUTHENTICATED endpoint, NOT the embed endpoint.

### What is ASSUMED (unverified by official source):

- That the embed-subscribe endpoint allows `mode: 'no-cors'` fetch from `sertaoseracloud.com` (a GitHub Pages domain). Buttondown's CORS page describes issues but does not confirm wildcard `Access-Control-Allow-Origin`. [ASSUMED]
- That the embed-subscribe endpoint returns HTTP 200 on first subscribe and HTTP 400 on already-subscribed. The CONTEXT.md states this, but the official docs do not enumerate these codes for the embed endpoint specifically. [ASSUMED — from CONTEXT.md, not verified against live endpoint]

### Practical consequence for planning:

Use `mode: 'no-cors'` in `fetch()`. This makes the response opaque — the JS cannot read the HTTP status. The plan treats any successful `fetch()` resolve as "submitted OK" and shows the success state. Network failures (DNS failure, Buttondown down) throw a catch. The already-subscribed case cannot be distinguished from a first-time subscribe — both will show the success message. This is the standard pattern for static site email forms without a server proxy.

**Alternative considered and rejected:** Using `mode: 'cors'` (default) — if Buttondown does not send `Access-Control-Allow-Origin: *`, this will throw a CORS error and the catch block shows the error message even though the subscription may have succeeded. Worse UX than `no-cors`.

---

## Common Pitfalls

### Pitfall 1: Assuming fetch() can read the response status from an opaque request

**What goes wrong:** Developer writes `if (response.ok)` or `response.status === 200` after a `mode: 'no-cors'` fetch. Both checks always fail (`ok` is false, `status` is 0), so the code always shows the error state even on successful subscribes.

**Why it happens:** MDN's fetch examples typically use `mode: 'cors'` (same-origin or CORS-enabled APIs) where `response.ok` works. The embed endpoint requires `no-cors` for cross-origin POST.

**How to avoid:** Structure the `then()` callback to always show success — the resolved promise itself is the success signal, not the response object. Put error copy only in `catch()`.

**Warning signs:** Form shows error message but Buttondown dashboard shows new subscribers arriving. This confirms `no-cors` resolved but the code misread the response.

### Pitfall 2: Using `new FormData()` directly causes multipart instead of urlencoded

**What goes wrong:** `fetch(url, { body: new FormData(form) })` sends as `multipart/form-data` with a boundary. Some form-processing endpoints only accept `application/x-www-form-urlencoded`.

**Why it happens:** `FormData` is convenient but sends multipart. Buttondown's embed endpoint was designed for native browser form POST, which sends urlencoded by default.

**How to avoid:** Use `new URLSearchParams()` instead of `FormData()` for the body. `URLSearchParams` sends as `application/x-www-form-urlencoded`.

**Warning signs:** Network tab shows `Content-Type: multipart/form-data` on the request. Subscriptions don't appear in Buttondown.

### Pitfall 3: Checkbox `required` alone prevents form submission but shows no custom error

**What goes wrong:** Developer expects a red border or custom message when checkbox is unchecked. Browser shows its own native validation UI, which may not match the design system.

**Why it happens:** HTML5 `required` on checkboxes triggers browser-native constraint validation. The UI varies by browser and OS.

**How to avoid:** Accept the native browser UI for consent checkbox validation. This is intentional — consistent with the "no custom JS validation" approach and simpler. The native validation tooltip is sufficient for LGPD consent.

**Warning signs:** Attempting to style the native validation bubble via CSS or override with JS. This is unnecessary complexity.

### Pitfall 4: Forgetting `tabindex="-1"` on success/error divs before calling `.focus()`

**What goes wrong:** `document.getElementById('newsletter-success').focus()` silently fails — non-interactive elements are not focusable by default. Screen readers do not announce the state change.

**Why it happens:** `focus()` only works on elements that are inherently focusable (buttons, inputs, links) or have `tabindex` set.

**How to avoid:** Add `tabindex="-1"` to both `#newsletter-success` and `#newsletter-error` divs in the static HTML. Also add `role="status"` and `role="alert"` respectively as ARIA live regions — these announce changes without needing `.focus()` as a backup.

**Warning signs:** Screen reader testing shows no announcement when success/error state appears.

### Pitfall 5: Updating /privacidade without updating the `<meta description>`

**What goes wrong:** The existing description reads "Este site não utiliza cookies de rastreamento nem coleta dados pessoais." After Phase 7, this is factually incorrect — email is collected.

**Why it happens:** Description is in the `<BaseLayout>` call, separate from the prose content.

**How to avoid:** Update the `description` prop in the `<BaseLayout>` call in `privacidade.astro` along with the prose.

### Pitfall 6: Not updating the last-updated date in /privacidade

**What goes wrong:** Privacy policy displays "Última atualização: 25 de abril de 2026" after material changes. This misrepresents when the policy was last updated.

**Why it happens:** The date is hardcoded as a string (STATE.md documents this was intentional to avoid cross-plan import dependency).

**How to avoid:** Update the hardcoded date string to the Phase 7 implementation date.

---

## Code Examples

### Complete NewsletterEmbed AJAX handler (production pattern)

```html
<!-- Source: established codebase pattern (CommentsEmbed.astro is:inline) + Buttondown docs -->
<script is:inline>
  (function () {
    var USERNAME = 'YOUR_BUTTONDOWN_USERNAME'; // replaced at plan implementation time
    var form = document.getElementById('newsletter-form');
    var successDiv = document.getElementById('newsletter-success');
    var errorDiv = document.getElementById('newsletter-error');
    if (!form) return;
    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailVal = document.getElementById('newsletter-email').value;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      errorDiv.setAttribute('hidden', '');

      var body = new URLSearchParams();
      body.append('email', emailVal);

      fetch(
        'https://buttondown.com/api/emails/embed-subscribe/' + USERNAME,
        { method: 'POST', body: body, mode: 'no-cors' }
      )
        .then(function () {
          // Opaque response — fetch resolved = request reached Buttondown
          form.style.display = 'none';
          successDiv.removeAttribute('hidden');
          successDiv.focus();
        })
        .catch(function () {
          // Network failure (DNS, timeout, Buttondown down)
          submitBtn.disabled = false;
          submitBtn.textContent = 'Inscrever-se';
          errorDiv.textContent =
            'Algo deu errado. Tente novamente ou entre em contato: engcfraposo@gmail.com';
          errorDiv.removeAttribute('hidden');
          errorDiv.focus();
        });
    });
  })();
</script>
```

### CSS additions to global.css (Phase 7 block)

```css
/* Source: UI-SPEC 07-UI-SPEC.md — CSS Additions section */
/* Phase 7 — Newsletter */
.newsletter-section {
  margin-top: var(--space-8);
  margin-bottom: var(--space-7);
}
.newsletter-field-row {
  display: flex;
  gap: var(--space-2);
  align-items: stretch;
  flex-wrap: wrap;
}
.newsletter-field-row input[type="email"] {
  flex: 1 1 200px;
  min-width: 0;
  height: 44px;
  padding: 0 var(--space-4);
  background: var(--sub-nivel);
  border: 1px solid var(--hairline);
  color: var(--texto-principal);
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: 18px;
  outline: none;
}
.newsletter-field-row input[type="email"]:focus-visible {
  border-color: var(--nucleo-eletrico);
}
.newsletter-field-row input[type="email"]::placeholder {
  color: var(--texto-secundario);
  opacity: 0.7;
}
.newsletter-submit-btn {
  height: 44px;
  padding: 0 var(--space-5);
  background: var(--nucleo-eletrico);
  color: var(--abismo-profundo);
  border: none;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
}
.newsletter-submit-btn:hover { opacity: 0.88; }
.newsletter-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.newsletter-consent {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
  min-height: 44px;
}
.newsletter-consent input[type="checkbox"] {
  width: 16px;
  height: 16px;
  min-width: 16px;
  accent-color: var(--nucleo-eletrico);
  cursor: pointer;
}
.newsletter-consent label {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--texto-secundario);
  line-height: 1.5;
  cursor: pointer;
}
.newsletter-consent label a {
  color: var(--nucleo-eletrico);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.newsletter-message {
  margin-top: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--hairline-strong);
  font-size: 18px;
  line-height: 1.5;
  color: var(--texto-principal);
}
.newsletter-message--success {
  border-color: rgba(107, 255, 180, 0.4);
  background: rgba(107, 255, 180, 0.05);
}
.newsletter-message--error {
  border-color: rgba(255, 107, 214, 0.35);
  background: rgba(255, 107, 214, 0.04);
  color: var(--texto-secundario);
}
```

### PostLayout insertion point

```astro
<!-- Source: src/layouts/PostLayout.astro (verified) -->
<!-- Insert NewsletterEmbed between CopyCode and .comments-section -->
<CopyCode />
<NewsletterEmbed />     <!-- NEW — Phase 7 -->
<section class="comments-section" aria-labelledby="comments-heading">
  <h2 id="comments-heading" ...>Comentários</h2>
  <CommentsEmbed />
</section>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LGPD stub ("não coleta dados") | Full LGPD section with email data disclosure | Phase 7 | /privacidade is now accurate after newsletter launch |
| No subscriber capture | Buttondown embed form inline in posts + /newsletter page | Phase 7 | RSS-to-email enables automatic dispatch to subscribers |
| Redirect-on-subscribe | Inline DOM swap (D-02) | Phase 7 | Subscriber stays in article context after subscribing |

**Deprecated/outdated:**
- `/privacidade` line "Este site não coleta dados pessoais": must be updated to scope this claim to the analytics/tracking context (where it remains true) and add the newsletter email collection disclosure.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The embed-subscribe endpoint at `https://buttondown.com/api/emails/embed-subscribe/{username}` accepts `mode: 'no-cors'` fetch POST from a `sertaoseracloud.com` origin without browser blocking the preflight | CORS Research, Code Examples | If the endpoint triggers a CORS preflight (which `no-cors` skips), the form will silently appear to submit but nothing arrives at Buttondown. Mitigation: test manually after Buttondown account is created before shipping. |
| A2 | HTTP 200 = first-time subscribe success, HTTP 400 = already subscribed (from CONTEXT.md) | Standard Stack, Pitfall 1 | The distinction does not matter for the `no-cors` implementation since the response is opaque anyway. Risk is LOW. |
| A3 | Buttondown's embed endpoint accepts `Content-Type: application/x-www-form-urlencoded` (from URLSearchParams body) | Code Examples | If it only accepts multipart/form-data, switch body to `new FormData()`. Either way, no-cors mode works the same. Risk is LOW — worst case is swapping URLSearchParams for FormData. |
| A4 | LGPD Art. 33 explicit consent (clause VIII) is sufficient transfer mechanism for a solo blog subscriber using a US email service | LGPD Pattern | ANPD could interpret this more strictly for commercial operations. For a personal technical blog with no revenue, consent is the accepted lightweight mechanism. Risk for this use case is very LOW. |

---

## Open Questions

1. **Buttondown username for the embed URL**
   - What we know: The endpoint is `https://buttondown.com/api/emails/embed-subscribe/{username}`.
   - What's unclear: The author's Buttondown username (same as the email sender identity).
   - Recommendation: Plan tasks must treat username as an authorial prerequisite (same pattern as Giscus data-repo-id in Phase 6 — placeholder in code, human replaces before go-live).

2. **CORS behavior in production (post-account-creation)**
   - What we know: Buttondown's CORS docs acknowledge issues; `no-cors` fetch is the static-site workaround.
   - What's unclear: Whether sertaoseracloud.com origin is blocked by Buttondown's backend.
   - Recommendation: Phase plan must include a manual smoke test after account creation: open browser DevTools, submit the form, confirm Buttondown dashboard shows the subscriber. This is a go/no-go gate before merging.

3. **`/newsletter` page nav link**
   - What we know: The Header component has nav links. The context does not specify whether `/newsletter` should appear in the main nav.
   - What's unclear: Whether the author wants a nav link or footer link or none.
   - Recommendation: Claude's Discretion — add a `/newsletter` link to the Footer alongside existing links. Do not add to the main nav (adds nav clutter to every page). Planner should note this is a two-line addition to `Footer.astro`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | pnpm build | ✓ | v24.14.1 | — |
| pnpm | pnpm build | ✓ | 9.15.0 | — |
| Buttondown account | Form endpoint | ✗ (authorial prerequisite) | — | Placeholder username in code until account created |
| GitHub Discussions (Giscus) | Phase 6 (pre-existing) | ✗ (pending authorial action) | — | Placeholder IDs already in CommentsEmbed.astro |

**Missing dependencies with no fallback:**
- Buttondown account — required before the form endpoint URL is complete. This is an authorial action identical in nature to the Giscus setup in Phase 6. Plan tasks must include a placeholder and a NOTE to the author.

**Missing dependencies with fallback:**
- None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | node:test (built-in, established in Phase 2) |
| Config file | none — scripts run via `node --test` |
| Quick run command | `pnpm test:sync` |
| Full suite command | `pnpm test:sync` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-07-01 | NewsletterEmbed renders form with consent checkbox unchecked | Visual / manual | Manual browser check | ❌ Wave 0 (optional) |
| REQ-07-02 | LGPD checkbox is `required` — prevents submit when unchecked | Manual browser | Manual browser check | ❌ manual-only |
| REQ-07-03 | AJAX submit shows success div, hides form | Manual browser smoke test | DevTools Network + DOM | ❌ manual-only |
| REQ-07-04 | /privacidade contains all 9 LGPD Art. 18 rights | Build smoke test | `pnpm build && grep -l "Art. 18" dist/privacidade/index.html` | ❌ Wave 0 |
| REQ-07-05 | /newsletter page renders with correct title | Build smoke test | `pnpm build && grep -l "Newsletter" dist/newsletter/index.html` | ❌ Wave 0 |
| REQ-07-06 | pnpm build succeeds with no TS errors | Build gate | `pnpm build` | ✅ (existing CI gate) |
| REQ-07-07 | Lighthouse A11y ≥95 on /newsletter | CI gate | `pnpm build` (Lighthouse CI in deploy.yml) | ✅ (existing CI gate) |

### Sampling Rate

- **Per task commit:** `pnpm build` — confirms no TypeScript/Astro errors.
- **Per wave merge:** `pnpm build` + manual browser test of form submission.
- **Phase gate:** Full build green + manual Buttondown smoke test (subscriber appears in dashboard) before closing phase.

### Wave 0 Gaps

- [ ] No automated test for form HTML structure — manually verify in browser.
- [ ] grep smoke test for /privacidade content: `grep "Art. 18" dist/privacidade/index.html` — can be run manually post-build.

*(No new test framework required — this phase has no server-side logic to unit test. The Buttondown integration is manual-smoke-test territory, same as Giscus in Phase 6.)*

---

## Project Constraints (from CLAUDE.md)

- **Stack:** Astro 6 SSG with TypeScript strict mode. No SSR — GitHub Pages static only.
- **Tailwind:** v4 via `@tailwindcss/vite`. No legacy integration. CSS custom properties are the design tokens.
- **No `client:` directives on Astro components.** Use plain `<script>` or `<script is:inline>` only.
- **pnpm 9.15.0 / Node ≥22.12.0.** Environment confirmed: Node v24.14.1, pnpm 9.15.0.
- **Font stack:** Space Grotesk / Chakra Petch / JetBrains Mono. All self-hosted.
- **`lang="pt-BR"` on `<html>`.** All user-facing copy must be Portuguese.
- **No Google Fonts CDN.** Fonts are self-hosted WOFF2 in `public/fonts/`. Confirmed resolved in Phase 4.
- **Design system:** `src/styles/global.css` is source of truth. Token names: `--nucleo-eletrico`, `--sub-nivel`, `--abismo-profundo`, `--texto-principal`, `--texto-secundario`, `--hairline`, `--hairline-strong`, `--space-*`.
- **WCAG:** `--nucleo-eletrico` (#00FFFF) on `--abismo-profundo` (#0A0F1E) = 16.5:1 (AAA). CTA button: `background: var(--nucleo-eletrico)`, `color: var(--abismo-profundo)`.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No login/auth in this phase |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | Public form, no restricted resources |
| V5 Input Validation | yes | Browser `type="email"` + `required`; Buttondown validates server-side |
| V6 Cryptography | no | HTTPS inherited from GitHub Pages + Buttondown |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Email harvesting via form replay | Information Disclosure | Buttondown rate limits (documented); double opt-in prevents garbage emails from activating |
| LGPD checkbox bypassed via DevTools | Tampering | Server-side: Buttondown has no knowledge of checkbox state — mitigation is that the form is designed for consent display only; actual legal consent evidence is the form submission from the user's device |
| Form spam (bot subscribe) | Denial of Service | Buttondown has built-in bot protection on the embed endpoint; double opt-in means spammed addresses won't activate |
| XSS via email input | Tampering | Email is sent to Buttondown API (not reflected in the DOM). `URLSearchParams` encoding prevents injection. No innerHTML with user content. |

---

## Sources

### Primary (HIGH confidence)
- `src/components/CommentsEmbed.astro` — is:inline pattern reference [VERIFIED: codebase read]
- `src/layouts/BaseLayout.astro` — is:inline FOUC script pattern [VERIFIED: codebase read]
- `src/components/ThemeToggle.astro` — plain `<script>` (bundled) vs is:inline contrast [VERIFIED: codebase read]
- `src/layouts/PostLayout.astro` — insertion point for NewsletterEmbed [VERIFIED: codebase read]
- `src/pages/privacidade.astro` — existing structure to update [VERIFIED: codebase read]
- `src/styles/global.css` — all design tokens [VERIFIED: codebase read]
- `lgpd-brasil.info/capitulo_03/artigo_18` — Art. 18 rights verbatim [CITED: lgpd-brasil.info]
- `lgpd-brasil.info/capitulo_05/artigo_33` — Art. 33 international transfer cases [CITED: lgpd-brasil.info]
- `docs.buttondown.com/building-your-subscriber-base` — embed endpoint URL, accepted fields [CITED]
- `docs.buttondown.com/embed-form-cors-csp` — CORS documentation [CITED]
- `docs.buttondown.com/api-subscribers-create` — authenticated API response codes [CITED]
- `buttondown.com/legal/privacy` — Buttondown US company, GDPR rights, DPA reference [CITED]
- `.planning/phases/07-newsletter-lgpd/07-UI-SPEC.md` — approved UI contract (CSS, interaction, copy) [VERIFIED: file read]
- `.planning/phases/07-newsletter-lgpd/07-CONTEXT.md` — locked decisions [VERIFIED: file read]
- `developer.mozilla.org/en-US/docs/Web/API/Request/mode` — no-cors opaque response behavior [CITED: MDN]

### Secondary (MEDIUM confidence)
- `docs.buttondown.com/embed-form-cors-csp` cross-referenced with MDN no-cors mode docs — CORS behavior for embed endpoint

### Tertiary (LOW confidence / ASSUMED)
- Embed-subscribe endpoint behavior (200/400 codes) — stated in CONTEXT.md but not in official Buttondown embed docs. Marked [ASSUMED].
- `mode: 'no-cors'` works without being blocked by Buttondown CORS policy — inferred from "designed for static sites" claim. Marked [ASSUMED].

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all existing patterns verified in codebase
- Architecture: HIGH — identical pattern to CommentsEmbed (verified); CORS constraint is well-understood
- LGPD content: HIGH — statutory text verified from official LGPD source
- Buttondown API response codes for embed endpoint: LOW — stated in CONTEXT.md, not in official embed docs

**Research date:** 2026-04-28
**Valid until:** 2026-07-28 (stable — Buttondown API and LGPD law are not fast-moving)
