# Roadmap — O Sertão será Cloud

**Milestone:** v1 — Blog público com pipeline dev.to → PT-BR
**Created:** 2026-04-22
**Target deliverable:** primeiro post ao ar em `sertaoseracloud.com` via pipeline automática (dev.to EN → Haiku PT-BR → PR → merge → deploy)

## Visão do milestone

Transformar o fluxo "escrever em inglês no dev.to" em "publicação dupla (dev.to EN + blog PT-BR)" com revisão editorial preservada via PR. Entregar plataforma completa de leitura + engajamento alinhada com a marca Sertão+Cloud, sem estourar budget near-zero (exceção: ~$3-5/ano em Claude Haiku API).

## Estrutura de ship

| Ship | Conteúdo | Fases |
|------|----------|-------|
| **v1.0 — Ler** | Blog público + 1 post sincronizado | Phases 1-5 |
| **v1.2 — Engajar** | Comments, search, newsletter, share | Phases 6-7 |
| **v1.3 — Polir** | OG dinâmico, About, a11y refinement | Phase 8 |
| v2+ | Differentiators (TOC, series, Mermaid, /uses) | Phase 9 |

---

## Phase 1 — Bootstrap & Fundações

**Goal:** Repositório Astro escaffoldado, paleta semântica configurada, deploy `hello world` em `sertaoseracloud.com` via Github Pages funcionando.

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Astro scaffold, pnpm+Node pinning, Prettier tooling
- [x] 01-02-PLAN.md — Design system tokens, layout components, content schema
- [x] 01-03-PLAN.md — GitHub Pages deploy workflow, CNAME, ROADMAP CSS token aliases (gap closure)

**Success criteria:**

- [x] `pnpm dev` roda localmente em <5s — confirmed 3777ms (HUMAN-UAT 2026-04-24)
- [x] `pnpm build` produz `dist/` estático sem warnings — confirmed 3.45s, noise-only warning (HUMAN-UAT 2026-04-24)
- [ ] `sertaoseracloud.com` retorna HTTP 200 com SSL válido via Github Pages — **PENDING authorial action** (enable GitHub Pages in Settings + DNS A records)
- [x] Paleta semântica em CSS vars (`--color-text-primary`, `--color-accent`, `--color-decorative`) + fallbacks neutros para texto — aliases added in 01-03
- [x] `src/content.config.ts` com schema Zod incluindo `source.*`, `canonical_url`, `manual_override` — done in 01-02
- [x] `lang="pt-BR"` em `<html>` via `BaseLayout.astro` — done in 01-02
- [ ] Domínio `sertaoseracloud.com` apontando pro deploy (DNS configurado) — **PENDING authorial action**
- [x] `package.json` scripts: `dev`, `build`, `preview`, `sync:devto` (stub) — **DONE in 01-01**

**Scope in:**

- Astro 6 scaffold via `pnpm create astro@latest -- --template blog --typescript strict`
- Tailwind v4 via Vite plugin
- Github Pages conexão com repo
- Domínio custom + SSL
- Estrutura de pastas conforme `ARCHITECTURE.md`
- Design tokens brand-aware semânticos
- `consts.ts` com `SITE_URL`, `SITE_TITLE`, `AUTHOR`, socials
- Design system "Código Chama Azul" (blog-design-system/Blog Design System.html) — tokens, fonts, component CSS
- Astro layout components: BaseLayout, Header, Footer using design system tokens

**Scope out:**

- Qualquer post real (usar 1 mock para validar build)
- Conteúdo dev.to ingestion (Phase 2)
- SEO/RSS/sitemap (Phase 3)
- Syntax highlighting além do default Shiki (Phase 4)

**Dependencies:**

- Blocker autoral: conta Github Pages + DNS de `sertaoseracloud.com`

**Threat model (pitfalls-to-address):**

- Pitfall 2 (paleta vs WCAG) — codificar CSS vars semânticas desde o início
- Pitfall 6 (perf) — self-host fontes (IBM Plex Sans / Inter) desde Phase 1
- Pitfall 9 (lang) — `lang="pt-BR"` no layout base
- Design system supersedes Sertão brand colors from early planning — see blog-design-system/ for source of truth

**Estimate:** S (setup work, idiomático)

---

## Phase 2 — Dev.to Sync Pipeline (MVP)

**Goal:** Rodar `pnpm run sync:devto` localmente (e via GH Actions workflow_dispatch) e ver um PR draft aparecer com markdown traduzido de um artigo real do dev.to.

**Plans:** 5 plans

Plans:
- [x] 02-01-PLAN.md — Package setup + test scaffold (deps install, 6 failing test files)
- [x] 02-02-PLAN.md — DevToClient, DiffDetector, Translator, GlossaryEnforcer (Wave 2 core components)
- [x] 02-03-PLAN.md — PRBuilder, sync-devto.ts orchestrator, circuit breaker (Wave 3)
- [x] 02-04-PLAN.md — GH Actions workflow (workflow_dispatch-only fallback), Windows Task Scheduler local setup (run-sync.ps1 + setup-scheduled-task.ps1, semanal segunda-feira 09:00)
- [x] 02-05-PLAN.md — Runbook (docs/sync-pipeline.md) + E2E test checkpoint

**Success criteria:**

- [x] Script `scripts/sync-devto.ts` (Node 22 + `fetch` nativo + `@anthropic-ai/sdk`)
- [x] DevToClient: `GET /api/articles?username=sertaoseracloud` + per-article fetch de `body_markdown`
- [x] DiffDetector: SHA-256 de `body_markdown` normalizado vs `source.hash` nos posts commitados
- [x] Translator: chamada Haiku 4.5 com `.planning/glossary.json` inlined no system prompt + chunking por parágrafo + retry 3x em erro
- [x] GlossaryEnforcer: valida preservação de todos os termos em `preserve_as_is` (contagem PT ≥ contagem EN); falha sync se drift
- [x] PRBuilder: escreve `src/content/posts/{slug}.md` com frontmatter completo + abre PR draft via GitHub REST API direto (não peter-evans — portabilidade com Claude Code agent; confirmado em planning)
- [x] Circuit breaker: `MAX_TRANSLATIONS_PER_RUN=5` respeitado
- [x] `.github/workflows/sync-devto.yml` com `workflow_dispatch` apenas (fallback manual — scheduling via Windows Task Scheduler local no PC do autor)
- [x] `scripts/run-sync.ps1` wrapper + `scripts/setup-scheduled-task.ps1` — cron semanal (segunda-feira 09:00) via Windows Task Scheduler; `StartWhenAvailable` para catchup se PC estava desligado
- [x] `ANTHROPIC_API_KEY` configurado como secret no repo
- [x] Budget alert $5/mês configurado na Anthropic console
- [x] `docs/sync-pipeline.md` runbook: falhas comuns (429, timeout, drift, overflow) + como corrigir
- [x] Teste end-to-end com 1 artigo real do dev.to → PR gerado → markdown traduzido revisável

**Scope in:**

- Script de sync + todos os componentes (DevToClient, DiffDetector, Translator, GlossaryEnforcer, PRBuilder)
- GH Actions workflow
- Secrets setup
- Frontmatter com `source.*` preenchido pelo bot
- Cover image download + salvar local em `src/content/posts/images/`
- Circuit breaker + budget alert docs
- PR template body (`.github/SYNC_PR_BODY.md`) com source link + diff summary

**Scope out:**

- Webhook sync (deferido para v2+; cron 24h é MVP)
- Diff-aware update (MVP = overwrite; sync v2 trata conflito)
- Multi-source (só dev.to por agora)
- `manual_override` flag enforcement (deferido pra sync v2 — MVP ignora)

**Dependencies:**

- Phase 1 (precisa do schema Zod)
- Blocker autoral: conta Anthropic + API key gerada

**Threat model:**

- Pitfall 15 (translation drift) — glossary enforcer é gate obrigatório
- Pitfall 16 (rate limit) — delta fetch + exponential backoff
- Pitfall 17 (custo) — circuit breaker + budget alert
- Pitfall 19 (canonical) — sync lint abre GH Issue se `canonical_url` do dev.to não aponta pro blog

**Estimate:** L (componente novo; é o coração do projeto)

---

## Phase 3 — SEO + RSS + A11y Foundation

**Goal:** Qualquer post que passe pela pipeline é publicado com SEO de primeira, RSS feed gerado, e zero violations de a11y no Lighthouse.

**Plans:** 4 plans

Plans:
- [ ] 03-01-PLAN.md — SEO component (SEO.astro, PostLayout, [slug] route, BaseLayout update)
- [ ] 03-02-PLAN.md — RSS feed + sitemap + robots.txt (markdown-it, sanitize-html, @astrojs/sitemap)
- [ ] 03-03-PLAN.md — A11y primitives + pages (skip-link, focus ring, 404, /privacidade, format-date)
- [ ] 03-04-PLAN.md — Schema enforcement + Lighthouse CI gate (D-16, D-17, test cases, deploy.yml)

**Success criteria:**

- [ ] Componente `<SEO>` em `src/components/SEO.astro` com: `<title>`, `<meta description>`, `<link rel="canonical">`, OpenGraph, Twitter Card, `og:locale=pt_BR`
- [ ] JSON-LD `BlogPosting` por post (headline, author, datePublished, dateModified, image, mainEntityOfPage) — valida no [Rich Results Test](https://search.google.com/test/rich-results)
- [ ] `@astrojs/sitemap` integration produz `sitemap-index.xml`
- [ ] `public/robots.txt` referenciando sitemap
- [ ] `src/pages/rss.xml.ts` produz feed Atom-compatible; `<language>pt-BR</language>` explícito; full content ou summary+link
- [ ] Canonical URL coerente em todo post: `<link rel="canonical" href="https://sertaoseracloud.com/posts/{slug}">`
- [ ] Data PT-BR via helper `formatDatePtBr()` em `src/lib/format-date.ts` (timezone `America/Sao_Paulo`)
- [ ] 404 page brandada em `src/pages/404.astro`
- [ ] Skip-link "Pular para conteúdo" em `BaseLayout`
- [ ] Focus visible em todo `:focus-visible` (custom ring em `#284068`)
- [ ] Alt text obrigatório no schema Zod de imagens do post (Zod required)
- [ ] Lighthouse A11y ≥95 em `/`, `/posts/exemplo` e `/404`
- [ ] Github Web Analytics snippet em `BaseLayout` (sem cookie banner necessário)
- [ ] `/privacidade` stub inicial (LGPD: descrição de analytics, ausência de cookies, contato do controlador)

**Scope in:**

- SEO component + JSON-LD
- Sitemap + robots + RSS
- Canonical bidirectional (blog side; dev.to side já configurado pelo autor)
- A11y primitives (skip link, focus, alt)
- Lighthouse CI step (falha PR se score <90)
- Analytics Github
- `/privacidade` stub

**Scope out:**

- `hreflang` — explicitamente NÃO usar entre dev.to e blog
- Dynamic OG image (deferido Phase 8)
- Full LGPD flow (newsletter) — Phase 7
- Search Console verification — processo autoral, pós-deploy

**Dependencies:**

- Phase 1 (layout + schema)
- Phase 2 (posts chegando via sync)

**Threat model:**

- Pitfall 5 (SEO anti-patterns) — canonical + JSON-LD + sitemap obrigatórios
- Pitfall 8 (analytics LGPD) — CF Web Analytics evita banner
- Pitfall 14 (a11y além de cor) — skip link + focus + alt no schema
- Pitfall 19 (canonical misconfig) — `<link rel="canonical">` no HTML do blog

**Estimate:** M (configuração idiomática + CI gate)

---

## Phase 4 — Typography + Dark mode + Syntax highlighting

**Goal:** Ler um post longo no blog é tão bom quanto ler no dev.to; código é lindo nos dois modos (light/dark).

**Success criteria:**

- [ ] Reading typography: 65-75ch max-width em prose; 16-18px body; line-height 1.5-1.7; flush-left
- [ ] Fonte self-hosted (IBM Plex Sans variável ou Inter variável); WOFF2 em `public/fonts/`; `font-display: swap` + preload
- [ ] Dark mode toggle (`<ThemeToggle>`) com persistência em `localStorage` + respeita `prefers-color-scheme`
- [ ] Inline script anti-FOUC em `<head>` do `BaseLayout`
- [ ] Shiki dual-theme configurado (light: `github-light`, dark: `github-dark` OU brand-aligned pair)
- [ ] Code blocks têm: filename label (`` ```ts title="..." ``), copy button, line highlight (`{3,5-7}`), mobile horizontal scroll legível
- [ ] `@shikijs/transformers` para anotações diff/highlight/focus
- [ ] Sem requests para `fonts.googleapis.com` (verify via Network tab) — Pitfall 6 mitigado
- [ ] Core Web Vitals: LCP <2.5s, INP <200ms, CLS <0.1 em `/posts/{slug}` (teste com 1 post real)
- [ ] Bundle JS <50KB em página de post (Lighthouse "Unused JavaScript" gate)

**Scope in:**

- `@tailwindcss/typography` config para prose
- Self-host fonts pipeline
- ThemeToggle component + inline script
- Shiki config com 2 temas + transformers
- Copy-code button (pequeno JS em island)
- Lighthouse perf CI gate (Performance ≥90, CLS <0.1)

**Scope out:**

- Callout/admonition components (Phase 9)
- Footnote polish (Phase 9)
- Reading progress indicator (não P1)

**Dependencies:**

- Phase 1 (Tailwind config + CSS vars)
- Phase 3 (a11y primitives)

**Threat model:**

- Pitfall 6 (perf) — self-host fonts + AVIF/WebP pipeline
- Pitfall 12 (dark mode + brand) — OG + favicon testados nos 2 modos

**Estimate:** M (typography + dark mode + Shiki config + perf gate)

---

## Phase 5 — First Post Shipped (GATE)

**Goal:** **MARCO CRÍTICO.** Primeiro post real do dev.to é sincronizado, revisado, mergeado, publicado, indexado no Google e compartilhável. Encerra ship v1.0.

**Success criteria:**

- [ ] Um artigo real do dev.to foi selecionado para primeiro deploy (autor escolhe qual)
- [ ] Autor adicionou `canonical_url: https://sertaoseracloud.com/posts/{slug}` no frontmatter desse artigo no dev.to
- [ ] Sync pipeline rodou (manualmente via `workflow_dispatch` ou pelo cron)
- [ ] PR draft foi aberto automaticamente com tradução
- [ ] Autor revisou a tradução, corrigiu 0-N termos, mergeou
- [ ] Github Pages buildou e deployou
- [ ] Post acessível em `sertaoseracloud.com/posts/{slug}` com HTTPS
- [ ] View-source do post contém: `<link rel="canonical">` (pro blog), JSON-LD `BlogPosting` válido, OG tags completas
- [ ] Post está no sitemap XML
- [ ] Post está no RSS feed
- [ ] Google Search Console verificado para o domínio + sitemap submetido
- [ ] Lighthouse mobile ≥90 em todos os scores no post
- [ ] Compartilhamento em LinkedIn/X/WhatsApp mostra OG correto
- [ ] Glossário atualizado com N termos descobertos durante review (se aplicável)

**Scope in:**

- Seleção editorial + review manual
- Google Search Console setup + sitemap submission
- Post-mortem do primeiro sync: o que falhou, o que surpreendeu, atualizações ao glossário

**Scope out:**

- Tudo de Phases 6+ (comments, newsletter, search, OG dinâmico, etc.)

**Dependencies:**

- Phases 1-4 todas concluídas
- Blocker autoral: autor existir 1 artigo publicado no dev.to com `canonical_url` configurado

**Threat model:**

- Pitfall 1 (pretty empty blog) — este é o gate que encerra isso
- Pitfall 15 (translation drift) — PR review obrigatório confirma glossário funciona
- Pitfall 19 (canonical) — verificar no Rich Results Test antes de publicar

**Estimate:** S (maior parte é verificação + review; bugs encontrados alimentam back-to-Phase 2-4)

**🚢 SHIP: v1.0 released.**

---

## Phase 6 — Comments + Search

**Goal:** Leitores podem comentar (via GitHub identity) e buscar posts por texto livre. Nenhuma interação precisa de backend próprio.

**Success criteria:**

- [ ] GitHub Discussions habilitado em `sertaoseracloud/sertaoseracloud`, categoria "Comments" criada
- [ ] Giscus instalado via [giscus.app](https://giscus.app/) config
- [ ] `<CommentsEmbed client:visible>` no `PostLayout` (lazy hydrate)
- [ ] Giscus config match: categoria, mapping `og:title`, theme inherit do dark mode toggle
- [ ] Pagefind configurado: `pagefind --site dist` rodando no build após Astro
- [ ] UI de busca (`<Search>`) com atalho `/` ou `Ctrl+K` + modal overlay
- [ ] Resultado de busca respeita `lang="pt-BR"` (Pagefind detecta)
- [ ] Tag pages: `/tags/` index + `/tags/{tag}` filter — tags vêm de `tag_list` do dev.to via frontmatter
- [ ] Tag normalization: lowercase + dedup no build

**Scope in:**

- Giscus integration
- Pagefind integration + search UI
- Tag pages + tag index

**Scope out:**

- Reactions próprias (Giscus já oferece via GitHub reactions)
- Comment moderation workflow (processo autoral)
- Related posts (Phase 9)

**Dependencies:**

- Phase 5 (ship v1.0 first — nunca lançar comments no v1.0)

**Threat model:**

- Pitfall 7 (comments privacy) — Giscus é seguro; nunca Disqus
- Pitfall 1 (engagement features prematuras) — só depois do primeiro post estar no ar

**Estimate:** M (integrations idiomáticas)

---

## Phase 7 — Newsletter + LGPD completa

**Goal:** Captura de email conforme LGPD. `/privacidade` completa. Inscrição inline no fim do post + página `/newsletter` dedicada.

**Success criteria:**

- [ ] Conta Buttondown criada + domínio `news@sertaoseracloud.com` configurado (SPF/DKIM/DMARC)
- [ ] Formulário inline no fim do post (MDX component `<Newsletter>`) + em `/newsletter` standalone
- [ ] Double opt-in habilitado no Buttondown
- [ ] Checkbox de consentimento NÃO pré-marcado + link pra `/privacidade`
- [ ] `/privacidade` completa: finalidade, base legal (consentimento), tempo de retenção, direitos do titular (LGPD Art. 18), contato do controlador (email), revocation mechanism (link em todo email)
- [ ] Teste de export CSV da lista de subscribers (valida portabilidade)
- [ ] RSS-to-email ativo no Buttondown (post novo dispara newsletter automaticamente)
- [ ] **Anti-feature confirmado:** sem popup modal ao carregar página; sem exit-intent

**Scope in:**

- Buttondown setup
- Form components
- LGPD-compliant `/privacidade`
- RSS-to-email integration
- Lead magnet opcional (se autor tem conteúdo pronto; caso contrário, "updates" genérico é OK no MVP desta phase)

**Scope out:**

- Lead magnet sofisticado (PDF cheatsheet) — se aparecer, ok; se não, Phase 9
- Segmentação de lista — não faz sentido <100 subs

**Dependencies:**

- Phase 5 (ship v1.0 first)

**Threat model:**

- Pitfall 3 (LGPD newsletter) — double opt-in + checkbox + `/privacidade` todos obrigatórios
- Pitfall 13 (newsletter lock-in) — export CSV testado antes de escalar

**Estimate:** M (Buttondown + LGPD content writing + form UI)

**🚢 SHIP: v1.2 released.**

---

## Phase 8 — Share + OG dinâmico + About/Sobre

**Goal:** Todo compartilhamento nas redes gera um banner branded; `/sobre` consolida identidade autoral.

**Success criteria:**

- [ ] Dynamic OG image per post via satori OU `@vercel/og` rodando no build (ou edge function de CF Pages)
- [ ] Template de OG: título + autor + paleta de marca + "O Sertão será Cloud" wordmark
- [ ] `og:image` e `twitter:image` corretamente preenchidos por post
- [ ] Share buttons: X, LinkedIn, **WhatsApp** (`wa.me/?text=...`), copy-link — anchor tags nativos, sem SDKs
- [ ] `/sobre` deep page: foto do autor, bio narrativa, thesis "por que 'Sertão será Cloud'", links de GitHub/LinkedIn/X/email
- [ ] Validar em LinkedIn Post Inspector + Twitter Card Validator (ou X Composer)

**Scope in:**

- OG image generation pipeline
- Share buttons component
- `/sobre` redação + design

**Scope out:**

- Speaking/`/palestras` (Phase 9)
- Projects/`/projetos` (Phase 9)
- Uses/`/uses` (Phase 9)

**Dependencies:**

- Phase 5 (ship v1.0 first)

**Threat model:**

- Pitfall 12 (brand consistency) — OG testado nos 2 temas; favicon testado
- Brand visibility — share amplifica

**Estimate:** M (OG pipeline é o item mais complexo)

**🚢 SHIP: v1.3 released.**

---

## Phase 9 — Polish + Differentiators

**Goal:** Diferenciais que elevam o blog de "ok" para "THE cloud voice in BR" — TOC, series, Mermaid build-time, callouts, `/uses`, `/agora`, `/palestras`, `/projetos`.

**Success criteria:** (cada sub-item é opcional e pode virar mini-phase se demandar)

- [ ] Table of Contents sticky em posts >1500 palavras
- [ ] Related posts (tag overlap via Jaccard) — 3-5 sugestões
- [ ] Previous/next post navigation
- [ ] Post series / tracks (frontmatter `series` + `order`) — quando primeiro multi-part for escrito
- [ ] Mermaid diagrams build-time via `rehype-mermaid` ou `mermaid-cli` (SVG no HTML, zero client JS)
- [ ] Callouts/admonitions (Info, Warning, Tip, Danger) — 5 cores da paleta
- [ ] Footnotes polish
- [ ] `/uses` page (registrar em [uses.tech](https://uses.tech))
- [ ] `/agora` page (Derek Sivers "now" style)
- [ ] `/palestras` page
- [ ] `/projetos` page
- [ ] Newsletter lead magnet (PDF cheatsheet de cloud costs BR)
- [ ] Axe/Lighthouse CI gate ≥95 a11y em todas as páginas

**Scope in:** todos os diferenciadores selecionados conforme demanda real de conteúdo

**Scope out:**

- Webhook sync (requer dev.to feature beta)
- Sync v2 diff-aware
- i18n / blog bilíngue
- PWA
- AI chatbot
- Reactions próprias além do Giscus

**Dependencies:**

- Phases 6 e 7 (base de engajamento)
- Demanda editorial real (não fazer speculativamente)

**Threat model:**

- Pitfall 1 (feature creep) — só fazer quando conteúdo pede

**Estimate:** XL (muitas sub-features; usar `/gsd-add-phase` ou `/gsd-insert-phase` para desmembrar)

---

## Dependency graph

```
Phase 1 (Bootstrap) ────┬──> Phase 2 (Sync) ──┬──> Phase 5 (First Post SHIP v1.0) ──┬──> Phase 6 (Comments+Search)
                        │                      │                                      │
                        ├──> Phase 3 (SEO+RSS) ┤                                      ├──> Phase 7 (Newsletter+LGPD) ──> 🚢 v1.2
                        │                      │                                      │
                        └──> Phase 4 (Type+DM) ┘                                      ├──> Phase 8 (Share+OG+About) ───> 🚢 v1.3
                                                                                      │
                                                                                      └──> Phase 9 (Differentiators)
```

Phases 2, 3, 4 podem rodar em **paralelo** (autor só precisa de bootstrap + schema). Phase 5 é gate de consolidação. 6, 7, 8 são paralelos.

---

## Cross-phase concerns

**Documentação autoral a manter junto do código:**

- `docs/sync-pipeline.md` (Phase 2) — runbook da pipeline
- `docs/editorial-workflow.md` (Phase 5) — como revisar PR de tradução
- `docs/deploy-troubleshooting.md` (Phase 1) — gotchas do Github Pages

**Processos autorais documentados (não código):**

- Template de post no dev.to com `canonical_url` pré-preenchido
- Checklist pré-merge do PR de tradução
- Cadência de publicação (mensal? semanal? decidir após 3 posts)

**Métricas de saúde:**

- Anthropic spend mensal (alvo: <$1)
- Sync success rate (alvo: ≥95%)
- Translation manual-edit rate (alvo: <10% de parágrafos editados — indica glossary maduro)
- Core Web Vitals (alvo: todos green)
- Search Console canonical issues (alvo: zero)

---

## Out of milestone (v2+)

- Webhook sync quando dev.to abrir publicamente
- Sync v2 diff-aware (conflict-aware)
- Blog bilíngue (se estrategicamente justificado)
- PWA / app install
- AI chatbot
- Forum/Discord integration
- Multi-author / cadastro

---

*Roadmap for milestone v1 of "O Sertão será Cloud".*
*Created: 2026-04-22 · Based on research in `.planning/research/` (synthesized in `SUMMARY.md`).*
