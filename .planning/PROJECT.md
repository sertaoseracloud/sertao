# O Sertão será Cloud

## What This Is

Blog pessoal autoral em português sobre computação em nuvem, com identidade visual e narrativa que funde o imaginário do Sertão brasileiro à vanguarda da tecnologia cloud. Publicação baseada em Markdown + Git, destinada à comunidade tech brasileira ampla.

## Core Value

Construir a marca pessoal do autor como voz relevante em cloud computing no Brasil, por meio de publicação consistente de conteúdo técnico de qualidade sob uma identidade visual diferenciada (Sertão + Cloud).

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Publicar posts escritos em Markdown via fluxo Git (commit → deploy automático)
- [ ] SEO sólido (meta tags, sitemap, structured data)
- [ ] Syntax highlighting de código nos posts (obrigatório para tutoriais)
- [ ] Tags / categorias para navegação por tema
- [ ] Dark mode (alternador claro/escuro)
- [ ] Feed RSS / Atom
- [ ] Captura de email / inscrição em newsletter
- [ ] Busca dentro do blog
- [ ] Sistema de comentários em posts
- [ ] Aplicar identidade visual consistente (paleta #284068 / #14878c / #65d7b1)
- [ ] Deploy sob o domínio `sertaoseracloud.com`

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Multi-autoria / plataforma com cadastro de autores — decisão explícita: blog é autoral/solo
- CMS visual ou painel admin web — escrita é via Markdown + Git, sem editor visual
- Headless CMS externo (Contentful, Sanity, Strapi) — conteúdo mora no repositório
- Conteúdo primariamente de narrativa cultural/sertaneja — Sertão é *wrapper* de identidade, não tópico; conteúdo é tech puro (tutoriais, opinião, estudos de caso)
- Custos recorrentes de hosting — orçamento zero; tudo precisa rodar em tier gratuito

## Context

- **Autor:** escreve sozinho (blog autoral, single-writer)
- **Público-alvo:** comunidade tech brasileira ampla — não restrito a profissionais do NE
- **Posicionamento:** ponte entre tradição regional e vanguarda cloud; moderno, resiliente, profissional
- **Tom regional:** diferencial de marca (visual + nome + narrativa), não restrição temática do conteúdo
- **Conteúdo planejado:** tutoriais técnicos + opinião/análise + estudos de caso (de cloud computing)
- **Identidade visual (já definida):**
  - `#284068` — azul profundo (confiança + imensidão do céu sertanejo)
  - `#14878c` — verde-azulado (tecnologia limpa + vegetação que resiste)
  - `#65d7b1` — verde-água (frescor / vigor da inovação)
- **Objetivo estratégico:** construir marca pessoal → canal próprio de posicionamento profissional em cloud

## Constraints

- **Timeline:** Prazo apertado — autor quer publicar o primeiro post em dias ou poucas semanas
- **Budget:** Orçamento zero — hosting, CDN, comentários, newsletter e busca precisam rodar em tier gratuito
- **Domain:** `sertaoseracloud.com` já adquirido — stack precisa suportar domínio customizado
- **Repo:** código hospedado em `github.com/sertaoseracloud/sertaoseracloud` — identidade GitHub é `sertaoseracloud`
- **Workflow:** Markdown + Git — escrita em `.md`, commit no repo, deploy automático (sem admin visual)
- **Idioma:** Conteúdo em PT-BR

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Blog autoral, single-writer | Usuário escolheu explicitamente — simplifica escopo, governança e stack (sem auth de autores) | — Pending |
| Workflow Markdown + Git (sem CMS) | Usuário é dev; prefere fluxo de código; elimina custo e superfície de ataque de CMS | — Pending |
| Sertão como *wrapper* de identidade, não tema do conteúdo | Usuário desmarcou "narrativa cultural" nos tipos de post — regional é marca, não tópico | — Pending |
| Paleta de marca fixa (#284068, #14878c, #65d7b1) | Já definida pelo usuário antes do kickoff — entra como constraint de design | — Pending |
| Público tech BR amplo, não só NE | Usuário escolheu explicitamente — narrativa regional é magnetismo, não segmentação | — Pending |
| v1 inclui todas as features de leitura + engajamento selecionadas | Usuário marcou SEO, highlighting, tags, dark mode, RSS, newsletter, busca, comentários como indispensáveis | — Pending (escopo será validado na fase de requisitos) |

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
*Last updated: 2026-04-21 after initialization*
