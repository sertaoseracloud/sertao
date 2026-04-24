# O Sertão será Cloud

## What This Is

Blog pessoal autoral em português sobre computação em nuvem, com identidade visual e narrativa que funde o imaginário do Sertão brasileiro à vanguarda da tecnologia cloud. **Conteúdo origina em [dev.to/@sertaoseracloud](https://dev.to/sertaoseracloud) em inglês e é automaticamente traduzido para PT-BR via pipeline (Claude Haiku + revisão via PR) antes de publicar em `sertaoseracloud.com`.** Publicação final baseada em Markdown + Git (markdown é gerado pela pipeline de sync).

## Core Value

Construir a marca pessoal do autor como voz relevante em cloud computing no Brasil, por meio de publicação consistente de conteúdo técnico de qualidade sob uma identidade visual diferenciada (Sertão + Cloud). Autor já escreve em inglês no dev.to; blog PT-BR amplifica alcance na comunidade brasileira sem duplicar esforço de escrita.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- [x] Astro 6 + Tailwind v4 + MDX scaffold with pnpm@9.15.0 / Node 22 pinning — validated in Phase 1
- [x] Código Chama Azul design system (62 CSS custom properties, 3-font stack) wired into BaseLayout — validated in Phase 1
- [x] `pnpm dev` starts in <5s, `pnpm build` produces clean `dist/` — validated in Phase 1 (HUMAN-UAT 2026-04-24)
- [x] GitHub Actions deploy workflow targeting `main` branch + `public/CNAME` for sertaoseracloud.com — validated in Phase 1
- [x] Semantic CSS vars (`--color-text-primary`, `--color-accent`, `--color-decorative`) + Código Chama Azul canonical names — validated in Phase 1

### Active

<!-- Current scope. Building toward these. -->

- [ ] Sync automático dev.to → blog via Forem API (cron 24h no GitHub Actions)
- [ ] Tradução EN→PT-BR via Claude Haiku 4.5 com preservação de glossário técnico
- [ ] Fluxo editorial via PR draft (`peter-evans/create-pull-request`) — nunca auto-merge
- [ ] Glossário técnico (`.planning/glossary.json`) inlined no system prompt da tradução
- [ ] GlossaryEnforcer lint no CI — falha sync se termo preservado foi mistraduzido
- [ ] Circuit breaker de custo (`MAX_TRANSLATIONS_PER_RUN=5`) + budget alert Anthropic em $5/mês
- [ ] Canonical URL bidirecional (`canonical_url` no dev.to → blog; `<link rel="canonical">` no blog)
- [ ] SEO sólido (meta tags, sitemap, structured data JSON-LD `BlogPosting`)
- [ ] Syntax highlighting de código nos posts (Shiki dual-theme, re-highlight no build sobre markdown traduzido)
- [ ] Tags / categorias para navegação por tema (vindo de `tag_list` da API dev.to)
- [ ] Dark mode (alternador claro/escuro + detecção via `prefers-color-scheme`)
- [ ] Feed RSS / Atom (gerado pelo blog a partir do markdown traduzido — não proxy do dev.to)
- [ ] Captura de email / inscrição em newsletter (Buttondown, double opt-in, LGPD)
- [ ] Busca dentro do blog (Pagefind, estático, detecta `lang="pt-BR"`)
- [ ] Sistema de comentários em posts (Giscus via GitHub Discussions)
- [ ] Aplicar identidade visual consistente (paleta semântica derivada de #284068 / #14878c / #65d7b1 — ver Pitfall 2 de acessibilidade)
- [ ] Deploy sob o domínio `sertaoseracloud.com` (Github Pages)
- [ ] Página `/privacidade` (LGPD — newsletter + analytics)
- [ ] Analytics privacy-first (Github Web Analytics, sem cookies, sem banner)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Multi-autoria / plataforma com cadastro de autores — decisão explícita: blog é autoral/solo
- CMS visual / painel admin web no domínio do blog — autor escreve no dev.to, não em editor próprio
- **dev.to substitui os CMS headless considerados:** Contentful, Sanity, Strapi foram descartados em favor do dev.to como source porque o autor já publica lá e ganha dois canais (dev.to + blog próprio) com um único fluxo de escrita
- Conteúdo primariamente de narrativa cultural/sertaneja — Sertão é *wrapper* de identidade, não tópico; conteúdo é tech puro (tutoriais, opinião, estudos de caso)
- Blog bilíngue (EN+PT lado a lado) — blog é PT-BR only; dev.to mantém a versão EN como side effect do source
- Webhook dev.to → blog em tempo real — sync é cron 24h no MVP; webhooks são private beta na plataforma
- Re-tradução automática em edições subsequentes do dev.to sem intervenção — no MVP, edições disparam overwrite PR, mas revisão manual é obrigatória; sync v2 trata conflito diff-aware
- Auto-merge de PR de tradução — **nunca**; PR é sempre draft; autor revisa manualmente

## Context

- **Autor:** escreve sozinho (blog autoral, single-writer); publica tecnicamente no [dev.to/@sertaoseracloud](https://dev.to/sertaoseracloud)
- **Fonte de conteúdo:** dev.to (EN) → tradução automática → blog (PT-BR). Blog é canonical; dev.to declara `canonical_url` apontando pro blog
- **Engine de tradução:** Claude Haiku 4.5 (Anthropic SDK); ~$0.06/post longo → ~$3-5/ano no volume projetado
- **Compute de sync:** GitHub Actions (cron diário, tier gratuito); PR editorial via `peter-evans/create-pull-request`
- **Público-alvo:** comunidade tech brasileira ampla — não restrito a profissionais do NE
- **Posicionamento:** ponte entre tradição regional e vanguarda cloud; moderno, resiliente, profissional
- **Tom regional:** diferencial de marca (visual + nome + narrativa), não restrição temática do conteúdo
- **Conteúdo planejado:** tutoriais técnicos + opinião/análise + estudos de caso de cloud computing
- **Identidade visual (já definida):**
  - `#284068` — azul profundo (confiança + imensidão do céu sertanejo) — seguro para texto corrido
  - `#14878c` — verde-azulado (tecnologia limpa + vegetação que resiste) — **apenas acento ≥24px ou ícones** (falha WCAG AA em texto corrido)
  - `#65d7b1` — verde-água (frescor / vigor da inovação) — **apenas decorativo** (falha WCAG AA em qualquer texto)
  - Regras de uso derivadas de teste WCAG — ver `.planning/research/PITFALLS.md` Pitfall 2
- **Objetivo estratégico:** construir marca pessoal → canal próprio de posicionamento profissional em cloud

## Constraints

- **Timeline:** Prazo apertado — autor quer publicar o primeiro post sincronizado em dias ou poucas semanas
- **Budget:** Near-zero — hosting, CDN, comentários, newsletter, busca, analytics e compute de sync (GH Actions) rodam em tier gratuito. **Única exceção aceita:** Claude Haiku API (~$3-5/ano em volume projetado)
- **Domain:** `sertaoseracloud.com` já adquirido — stack precisa suportar domínio customizado
- **Repo do blog:** código hospedado em `github.com/sertaoseracloud/sertaoseracloud` — identidade GitHub é `sertaoseracloud`
- **Workflow de escrita:** escrever no dev.to em EN → sync cron 24h traduz → PR draft abre → autor revisa/edita → merge → Github Pages deploya automaticamente
- **Idioma do blog:** PT-BR; idioma do source (dev.to): EN. Glossário técnico preserva anglicismos consolidados (AWS, deploy, endpoint, etc.)
- **Secrets:** `ANTHROPIC_API_KEY` como GitHub Actions secret; `GITHUB_TOKEN` fornecido pelo runtime

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Blog autoral, single-writer | Usuário escolheu explicitamente — simplifica escopo, governança e stack (sem auth de autores) | — Pending |
| dev.to como fonte da verdade do conteúdo | Autor já escreve em inglês lá; evita esforço duplicado de escrita; amplifica distribuição (dev.to + blog próprio) | — Pending |
| Forem API (não RSS) para ingestão | API expõe `body_markdown` bruto + `tag_list` + `canonical_url` + `cover_image`; RSS entrega só HTML renderizado — pior pra re-highlight com Shiki | — Pending |
| Tradução EN→PT-BR via Claude Haiku 4.5 | Melhor qualidade técnica PT-BR com menor custo; preserva glossário via system prompt; DeepL não aceita glossário programático | — Pending |
| Workflow editorial: PR draft + revisão manual obrigatória | Preserva qualidade editorial crucial para posicionamento profissional; tradução automática sem review destrói credibilidade | — Pending |
| Glossário técnico versionado (`.planning/glossary.json`) | Evita "implantação" em vez de "deploy", preserva nomes de serviço cloud (AWS, Lambda, SNS) | — Pending |
| Canonical URL bidirecional (dev.to → blog) | Google vê blog como canonical; evita duplicate-content penalty que ranquearia dev.to acima do blog | — Pending |
| Cron 24h no GitHub Actions (não webhook) | Webhook dev.to é private beta; cron funciona no tier gratuito; latência de até 24h é aceitável para blog autoral | — Pending |
| Circuit breaker de custo (`MAX_TRANSLATIONS_PER_RUN=5`) | Protege contra bug em diff detector que re-traduz tudo; budget Anthropic tem alerta em $5/mês | — Pending |
| Stack estática: Astro 6 + Github Pages + Shiki + Pagefind + Giscus + Buttondown | Consenso 2026 para blogs de conteúdo; ajusta zero-JS-por-default com islands para features interativas; tier gratuito real (commercial-use permitido, bandwidth ilimitado) | — Pending |
| Sertão como *wrapper* de identidade, não tema do conteúdo | Usuário desmarcou "narrativa cultural" nos tipos de post — regional é marca, não tópico | — Pending |
| Paleta de marca com regras semânticas WCAG-aware | Paleta fixa define marca; aplicação precisa de CSS vars semânticas (`--text-primary`, `--accent`, `--decorative`) porque `#14878c` e `#65d7b1` falham WCAG AA em texto corrido | — Pending |
| Público tech BR amplo, não só NE | Usuário escolheu explicitamente — narrativa regional é magnetismo, não segmentação | — Pending |
| Fatiamento v1.0 → v1.1 → v1.2 | Preemptivo contra "pretty empty blog" pitfall: primeiro post no ar antes de polir engajamento | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-24 — Phase 1 complete (Bootstrap & Fundações — 3/3 plans executed)*
