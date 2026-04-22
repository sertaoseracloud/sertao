# Phase 1: Bootstrap & Fundações - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Entrega: repositório Astro 6 scaffoldado (minimal template + setup manual), paleta semântica em CSS vars com camada dual-ready (light agora, dark hook vazio), tipografia self-hosted (Inter + Fira Code), schema Zod completo (incluindo campos do Phase 2 pipeline), e deploy "hello world" em `sertaoseracloud.com` via GitHub Pages Actions com SSL.

**Fora de escopo** (outras fases):
- Sync dev.to → tradução (Phase 2)
- SEO completo / RSS / sitemap / robots (Phase 3)
- Syntax highlighting configurado / dark mode ativo / copy button (Phase 4)
- Posts reais traduzidos (chegam via sync em Phase 2)

</domain>

<decisions>
## Implementation Decisions

### Deploy & Domain
- **D-01:** GitHub Pages via **Actions-native workflow** (`actions/deploy-pages@v4`, não branch `gh-pages`). Build roda em `ubuntu-latest` Node 22, publica `dist/`.
- **D-02:** Domínio apex canonical: `sertaoseracloud.com`. `www.sertaoseracloud.com` redireciona 301 → apex.
- **D-03:** DNS: A records pro apex apontando pros IPs do GitHub Pages (`185.199.108.153`, `.154`, `.155`, `.156`). Arquivo `CNAME` no repo com conteúdo literal `sertaoseracloud.com`.
- **D-04:** Deploy workflow usa `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`. Single job: `build-and-deploy`. Trigger: push em `main` + `workflow_dispatch`.

### Paleta & CSS tokens
- **D-05:** Paleta semântica com camada dual-ready desde Phase 1. `:root { --color-*: light value }` + `[data-theme='dark'] { /* vazio por enquanto, preenchido em Phase 4 */ }`. Custo zero agora, refator zero depois.
- **D-06:** Tokens semânticos definidos:
  - `--color-bg` — fundo da página (light: `#ffffff`)
  - `--color-surface` — cartões/blocos elevados (light: `#f7f7f9`)
  - `--color-text-primary` — texto corrido (light: `#284068`) — **WCAG 10.39:1 PASS**
  - `--color-text-secondary` — metadata, timestamps (light: cinza neutro custom `#4a5a7a`)
  - `--color-accent` — ícones ≥24px, heading large, borders (light: `#14878c`) — **apenas onde 3:1 é suficiente**
  - `--color-decorative` — backgrounds decorativos, ilustrações (light: `#65d7b1`) — **nunca texto**
  - `--color-border` — bordas sutis (light: cinza neutro `#e2e2ea`)
  - `--color-focus-ring` — `#284068` (WCAG-safe)
- **D-07:** Tailwind v4 via `@theme` directive em `src/styles/global.css`, mapeando tokens semânticos pra utilities (`bg-brand-bg`, `text-brand-primary`, etc.). Não usar HEX direto em componentes.
- **D-08:** Nenhum componente pode aplicar `#14878c` ou `#65d7b1` em texto sem validação visual explícita — lint manual até Phase 3 ter axe CI gate.

### Typography
- **D-09:** Fonte body: **Inter variable** self-hosted (WOFF2 em `public/fonts/inter/`). Arquivo: `Inter-roman.var.woff2` + `Inter-italic.var.woff2`.
- **D-10:** Fonte monospace: **Fira Code variable** self-hosted (WOFF2 em `public/fonts/fira-code/`).
- **D-11:** CSS `@font-face` com `font-display: swap`. `<link rel="preload">` do Inter roman em `BaseLayout`.
- **D-12:** Zero requests para `fonts.googleapis.com` ou `fonts.gstatic.com`. Validar via Network tab + comentário explícito em `global.css`.
- **D-13:** Fallback stack: `'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif` para body; `'Fira Code', ui-monospace, 'SF Mono', Menlo, Monaco, monospace` para código.

### Content Schema
- **D-14:** Schema Zod completo em `src/content.config.ts` já em Phase 1 — preempta Phase 2. Inclui todos os campos do pipeline dev.to:
  ```ts
  z.object({
    title: z.string().max(80),
    description: z.string().max(200),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    cover: image().optional(),
    coverAlt: z.string().optional(),
    source: z.object({
      platform: z.literal('dev.to'),
      id: z.number(),
      url: z.string().url(),
      hash: z.string(),
      synced_at: z.coerce.date(),
      translated_by: z.literal('claude-haiku-4-5'),
    }).optional(),
    canonical_url: z.string().url().optional(),
    manual_override: z.boolean().default(false),
  })
  ```
- **D-15:** 1 post mock em `src/content/posts/hello-sertao.md` com `source.*` fictício mas plausível — valida shape end-to-end antes de Phase 2 começar a escrever posts reais. Mock tem título "Hello, Sertão!" e corpo Markdown básico.
- **D-16:** `draft: true` filter no build: `getCollection('posts', ({ data }) => import.meta.env.PROD ? !data.draft : true)`. Drafts visíveis em dev, nunca em prod.

### Scaffold & Folder Structure
- **D-17:** Scaffold via **`pnpm create astro@latest -- --template minimal --typescript strict`** (não blog template) — começa limpo, sem bagagem de posts exemplo.
- **D-18:** Integrações adicionadas manualmente após scaffold: `pnpm astro add tailwind mdx`. RSS + sitemap só em Phase 3.
- **D-19:** Estrutura de pastas conforme `ARCHITECTURE.md`:
  ```
  src/
  ├── content/
  │   ├── posts/hello-sertao.md    # mock
  │   └── authors/cfraposo.md      # single-writer, future-proof
  ├── content.config.ts             # schema Zod completo
  ├── components/
  │   ├── Header.astro
  │   └── Footer.astro
  ├── layouts/
  │   ├── BaseLayout.astro          # lang="pt-BR", font preload, theme init stub
  │   └── PostLayout.astro          # wraps BaseLayout
  ├── pages/
  │   ├── index.astro               # Hello world + link pro mock post
  │   └── posts/[slug].astro        # renderiza posts
  ├── styles/
  │   ├── global.css                # @theme tokens + @font-face
  │   └── typography.css            # prose styles (stub pra Phase 4)
  ├── lib/
  │   └── consts.ts                 # SITE_URL, SITE_TITLE, AUTHOR, SOCIAL
  public/
  ├── fonts/                         # self-hosted WOFF2
  ├── CNAME                          # sertaoseracloud.com
  └── favicon.svg                    # placeholder (polish em Phase 8)
  ```
- **D-20:** `src/lib/consts.ts` exporta: `SITE_URL = 'https://sertaoseracloud.com'`, `SITE_TITLE = 'O Sertão será Cloud'`, `AUTHOR = { name: 'Cláudio Filipe Lima Rapôso', handle: 'sertaoseracloud' }`, `SOCIAL = { github: '...', linkedin: '...', devto: 'https://dev.to/sertaoseracloud' }`.
- **D-21:** `package.json` scripts:
  - `dev`: `astro dev`
  - `build`: `astro build`
  - `preview`: `astro preview`
  - `sync:devto`: stub `node -e "console.log('Phase 2: implement sync')"` — será preenchido em Phase 2

### Package Manager & Tooling
- **D-22:** **pnpm** obrigatório (não npm/yarn). `packageManager` field em `package.json` fixa versão. `.npmrc` com `package-manager-strict=true`.
- **D-23:** Node 22.12+ LTS (`engines.node` em `package.json`).
- **D-24:** Dev tooling básico (apenas): `prettier` + `prettier-plugin-astro`. ESLint deferido pra quando houver mais código (Phase 2+).

### Claude's Discretion
- Nomenclatura exata dos tokens Tailwind no `@theme` (prefix `brand-*` vs sem prefix)
- Conteúdo do body do mock post `hello-sertao.md` (parágrafo curto de boas-vindas com tom da marca)
- Configuração exata do `prettier-plugin-astro` (defaults são OK)
- Estrutura do GitHub Actions workflow YAML (detalhes de cache, concorrência)
- Favicon placeholder — SVG simples com iniciais "SC" ou símbolo genérico; polish real vai pra Phase 8

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project constraints & decisions
- `.planning/PROJECT.md` — what the blog is, budget constraints, paleta WCAG rules, schema expectations, Key Decisions table
- `.planning/ROADMAP.md` §"Phase 1 — Bootstrap & Fundações" — success criteria, scope in/out, threat model, estimate
- `.planning/research/SUMMARY.md` — synthesis, stack lock-in, phase slicing rationale

### Stack & install
- `.planning/research/STACK.md` — Astro 6 + Tailwind v4 + pnpm + Node 22 specifics; install commands
- `.planning/research/STACK.md` §"Amendment — 2026-04-22" — Claude Haiku SDK addition (relevant for schema shape even in Phase 1)

### Architecture & schema
- `.planning/research/ARCHITECTURE.md` §"Recommended Project Structure" — folder conventions to follow literally in D-19
- `.planning/research/ARCHITECTURE.md` §"Pattern 1: Content Collections with Zod Schema" — reference Zod schema pattern
- `.planning/research/ARCHITECTURE.md` §"Amendment — 2026-04-22" — extended schema with `source.*`, `canonical_url`, `manual_override` (D-14)

### Pitfalls to prevent in Phase 1
- `.planning/research/PITFALLS.md` Pitfall 2 — WCAG contrast table driving D-06 to D-08
- `.planning/research/PITFALLS.md` Pitfall 4 — URL structure must be frozen in Phase 1 (apex canonical from D-02)
- `.planning/research/PITFALLS.md` Pitfall 6 — self-host fonts, no Google Fonts (D-09 to D-13)
- `.planning/research/PITFALLS.md` Pitfall 9 — `lang="pt-BR"` obrigatório no layout base

### Glossary (Phase 2-relevant but schema anticipates it)
- `.planning/glossary.json` — no direct use em Phase 1 mas schema em D-14 deve acomodar pipeline Phase 2

### External authoritative docs
- [Astro docs — GitHub Pages deploy](https://docs.astro.build/en/guides/deploy/github/) — canonical recipe for D-01/D-04
- [Astro docs — Content Collections](https://docs.astro.build/en/guides/content-collections/) — Zod schema API
- [Astro docs — Tailwind integration](https://docs.astro.build/en/guides/integrations-guide/tailwind/) — Tailwind v4 via `@astrojs/tailwind` or Vite plugin
- [Inter font — rsms.me/inter](https://rsms.me/inter/) — official Inter variable fonts source (WOFF2)
- [Fira Code — fonts.google.com/specimen/Fira+Code](https://fonts.google.com/specimen/Fira+Code) — source for self-host (download, NOT embed)
- [GitHub Pages — Apex domain setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) — A records list for D-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
**Nenhum** — projeto é greenfield. Apenas `.planning/` existe (docs) e `.claude/`, `.obsidian/`, `.openclaude/` (tooling, irrelevante pra build).

### Established Patterns
**Esta fase estabelece** os patterns que fases seguintes seguem:
- Design tokens semânticos (não HEX direto)
- Folder structure (espelhado de ARCHITECTURE.md)
- Schema Zod como single source of truth para frontmatter
- pnpm + Node 22 + Astro 6 como runtime
- GitHub Actions como único compute layer (depois reusado pro sync em Phase 2)

### Integration Points
- **Phase 2 → src/content/posts/\*.md:** sync pipeline escreve posts com `source.*` preenchido. Schema em D-14 **precisa bater exatamente** com o shape que o `PRBuilder` do Phase 2 vai escrever.
- **Phase 3 → BaseLayout.astro:** SEO component plugará no `<head>` definido em Phase 1. Deixar slot/placeholder obvio.
- **Phase 4 → [data-theme='dark'] hook:** CSS vars em `:root` precisam ter contrapartes override em `[data-theme='dark']` (vazio em Phase 1). Tokens em D-06 **já anticipam** isso.
- **Phase 2 → .github/workflows/:** diretório criado em Phase 1 (deploy workflow) vai ganhar `sync-devto.yml` irmão em Phase 2.

</code_context>

<specifics>
## Specific Ideas

- **Título mock post:** "Hello, Sertão!" (wordplay com tagline do blog).
- **CNAME file content:** literal `sertaoseracloud.com` (sem https, sem path, sem trailing newline).
- **DNS A records:** 4 IPs do GitHub Pages (185.199.108.153, .154, .155, .156) + AAAA opcional pra IPv6.
- **Monospace ligatures:** Fira Code tem ligatures (`=>`, `===`, `!=`) por default — manter ligado; é parte da personalidade da escolha.
- **Inter axis:** variable font suporta weights 100-900 + italic; subset mínimo carregado é `wght 400..700` + italic (cobrir negrito e ênfase).
- **font-display strategy:** `swap` para Inter (evita FOIT). Sem fallback font-metric-override em Phase 1 (refino em Phase 4 se CLS virar problema).

</specifics>

<deferred>
## Deferred Ideas

### Para fases futuras (dentro do roadmap atual)
- **Analytics provider** — ROADMAP/PROJECT.md listam "Github Web Analytics" mas GitHub não oferece esse produto standalone. Decisão concreta (Plausible free self-host, Umami hosted, GoatCounter, ou aceitar cookie banner com Plausible Cloud/Fathom) precisa acontecer em Phase 3 quando o snippet de analytics for instalado. Budget $0 força self-host em VPS OU provedor hosted realmente free.
- **Dark mode activation** — CSS hooks existem desde Phase 1 (D-05), implementação real em Phase 4.
- **Shiki syntax highlighting config** — Phase 4. Token `--color-accent` em Phase 1 já é input.
- **Favicon final + brand mark** — placeholder SVG na Phase 1; design polido em Phase 8 (Share + OG + About).
- **ESLint config** — deferido pra Phase 2 quando houver mais código pra linting valer a pena.
- **Lighthouse/axe CI gate** — Phase 3 (A11y foundation).

### Fora do milestone v1
- `www.sertaoseracloud.com` como CNAME alias — só se estrategicamente necessário; por ora redirect 301 é suficiente
- Preview deploys por PR (GitHub Pages não suporta nativamente como Cloudflare Pages suportava) — deferido; autor pode rodar `pnpm preview` local pra revisar PRs de sync

</deferred>

---

*Phase: 01-bootstrap-fundacoes*
*Context gathered: 2026-04-22*
