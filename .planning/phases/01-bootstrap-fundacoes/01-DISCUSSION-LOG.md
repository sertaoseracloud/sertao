# Phase 1: Bootstrap & Fundações - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `01-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 01-bootstrap-fundacoes
**Areas discussed:** Deploy mechanism, Palette + dark-mode readiness, Typography (body + mono), Domain (apex vs www), Content schema scope, Scaffold strategy

---

## A. Deploy mechanism no GitHub Pages

| Option | Description | Selected |
|--------|-------------|----------|
| A1. Actions-native | `actions/deploy-pages@v4` workflow buildando e publicando. SSL automático, sem branch `gh-pages`. Padrão moderno 2026. | ✓ |
| A2. Branch `gh-pages` | CI pusha build output pro branch que Pages serve. Legacy, menos idiomático. | |

**User's choice:** A1 (Actions-native)
**Notes:** Alinhado com Phase 2, que usa GitHub Actions também — consistência de compute layer no mesmo provider.

---

## B. Paleta semântica — dark-mode-ready desde Phase 1 ou só light?

| Option | Description | Selected |
|--------|-------------|----------|
| B1. CSS vars dual-ready | `:root { light values }` + `[data-theme='dark'] { /* empty hook */ }`. Tokens pensados pra serem trocáveis. Custo zero agora, refator zero em Phase 4. | ✓ |
| B2. Só light em Phase 1 | Tokens só pra light mode; refator quando dark chegar em Phase 4. | |
| B3. Dark mode completo em Phase 1 | Quebra escopo do roadmap (dark é Phase 4). | |

**User's choice:** B1 (dual-ready scaffolding)
**Notes:** Decisão conservadora de arquitetura — sem custo adicional agora, evita dívida técnica inevitável.

---

## C. Typography — escolha da fonte body

| Option | Description | Selected |
|--------|-------------|----------|
| C1. IBM Plex Sans | Variable, personalidade, design open-source IBM | |
| C2. Inter | Variable, neutra, padrão da indústria dev, leve | ✓ |
| C3. Recife | Feita no Brasil, personalidade forte — mas paga, fora do budget | |
| C4. System fonts only | `system-ui, -apple-system` — zero peso mas sem identidade tipográfica | |

**User's choice:** C2 (Inter variable, self-hosted)
**Notes:** Escolha neutra e idiomática. Mais fácil de aceitar universalmente; combina com posicionamento "profissional" do blog sem roubar foco do conteúdo.

---

## F. Monospace font (follow-up de C)

| Option | Description | Selected |
|--------|-------------|----------|
| F1. JetBrains Mono | Padrão comunidade dev, ligatures, free, variable | |
| F2. IBM Plex Mono | Par natural com IBM Plex Sans; coerência tipográfica | |
| F3. Fira Code | Ligatures famosos, free, classic dev pick | ✓ |
| F4. system-ui monospace | Zero peso; sem identidade | |

**User's choice:** F3 (Fira Code)
**Notes:** Fira Code tem as ligatures mais reconhecíveis no ecossistema dev — boa sinalização de "blog técnico sério".

---

## G. Domínio — apex ou www?

| Option | Description | Selected |
|--------|-------------|----------|
| G1. Apex canonical | `sertaoseracloud.com` como URL canônica; www redireciona 301 → apex. DNS A records. | ✓ |
| G2. www canonical | `www.sertaoseracloud.com` canônico; apex redireciona → www. DNS CNAME. | |

**User's choice:** G1 (apex canonical)
**Notes:** URL mais curta é preferível especialmente pra compartilhamento em BR (WhatsApp/LinkedIn). Nenhuma razão técnica pra www em 2026.

---

## D. Content schema — escopo do Zod em Phase 1

| Option | Description | Selected |
|--------|-------------|----------|
| D1. Schema completo agora | Todos os campos (`source.*`, `canonical_url`, `manual_override`) mesmo sem uso em Phase 1. Phase 2 não mexe no schema. | |
| D2. Schema mínimo Phase 1 | Só `title`, `description`, `pubDate`, `tags`, `cover`. Estende em Phase 2. | |
| D3. Schema completo + 1 post mock | D1 + mock post em `hello-sertao.md` com `source.*` fictício pra validar shape end-to-end | ✓ |

**User's choice:** D3 (schema completo + mock post)
**Notes:** Valida shape antes de Phase 2 ter que descobrir schema quebrado no meio do sync pipeline. Mock post também serve como smoke test de render.

---

## E. Scaffold strategy

| Option | Description | Selected |
|--------|-------------|----------|
| E1. `--template blog` | Oficial wireframe com Content Collections + RSS pré-wired, MDX, exemplos de post. Rápido mas traz bagagem. | |
| E2. `--template minimal` + setup manual | Parte do zero; Content Collections + Tailwind + MDX adicionados manualmente. Mais controle, menos ruído. | ✓ |
| E3. Scaffold custom from scratch | Sem `create astro`; controle total, mais lento. | |

**User's choice:** E2 (minimal + manual setup)
**Notes:** Combina com preferência geral do projeto por não carregar bagagem; começa limpo, configura só o que precisa. Ligeiramente mais trabalho, mas cada decisão é explícita.

---

## Claude's Discretion

Áreas onde o autor delegou escolhas:

- Nomenclatura exata dos tokens Tailwind no `@theme` directive
- Conteúdo do body do mock post `hello-sertao.md` (parágrafo de boas-vindas curto, tom da marca)
- Config detalhado do `prettier-plugin-astro` (defaults são OK)
- YAML fino do GitHub Actions (cache, concorrência)
- Favicon placeholder SVG

## Deferred Ideas

- **Analytics provider** — PROJECT.md/ROADMAP.md referenciam "Github Web Analytics" que não existe como produto standalone. Decisão real de provider vai acontecer em Phase 3.
- **Preview deploys por PR** — GitHub Pages não suporta nativamente; autor roda `pnpm preview` local.
- **`www` subdomain** — não precisa ser registrado separadamente; redirect cobre.
