# Research Synthesis — O Sertão será Cloud

**Consolidada em:** 2026-04-22 (após pivô dev.to + tradução automática)
**Fontes:** `STACK.md`, `FEATURES.md`, `ARCHITECTURE.md`, `PITFALLS.md` (todas em `.planning/research/`)
**Objetivo deste documento:** entrada direta para criação do `ROADMAP.md`. Toda decisão travada, todo trade-off explicitado, todos os riscos mapeados.

---

## 1. Arquitetura em uma imagem

```
AUTHOR escreve em dev.to (EN)  →  [Sync 24h]  →  Blog PT-BR em sertaoseracloud.com
         │                            │                      │
         │ canonical_url pro blog     │ Haiku + glossary      │ Astro + Shiki + Pagefind
         │                            │ PR draft              │ Cloudflare Pages
         ▼                            ▼                      ▼
   Canal secundário EN          src/content/posts/*.md    Canal principal PT-BR
   (distribuição orgânica)       commitado pelo bot       (SEO + brand canonical)
```

**Três time-axes independentes:**
- **Author time** (no dev.to)
- **Sync time** (GitHub Actions — novo)
- **Build time** (Cloudflare Pages — Astro)
- **Runtime** (browser — JS mínimo)

---

## 2. Stack travada (decisões finais)

| Camada | Tecnologia | Versão | Grau de lock-in |
|--------|------------|--------|-----------------|
| SSG | Astro | `^6.0.0` | Alto (content collections + islands model) |
| Styling | Tailwind CSS | `^4.0` | Médio (pode migrar pra CSS custom) |
| Syntax | Shiki | `^3.x` (bundled) | Baixo (só markup, HTML portable) |
| Search | Pagefind | `^1.4` | Baixo (build-step isolado) |
| Comments | Giscus | latest | Baixo (dados em GitHub Discussions, portáteis) |
| Newsletter | Buttondown | free tier (<100 subs) | Baixo (export CSV funciona) |
| Analytics | Cloudflare Web Analytics | hosted | Baixo (no vendor data) |
| Hosting | Cloudflare Pages | hosted | Médio (deploy hooks específicos) |
| Content source | dev.to (Forem API) | v1 | **Alto — escolha core de produto** |
| Translation engine | Claude Haiku 4.5 via `@anthropic-ai/sdk` | `^0.40.x` | Médio (prompt portável, pode trocar engine) |
| Sync compute | GitHub Actions | hosted | Baixo (YAML + script Node, portável) |
| PR automation | `peter-evans/create-pull-request@v7` | `v7` | Baixo (substituível por CLI `gh`) |

**Node.js:** `>=22.12` LTS (hard requirement de Astro 6).
**Package manager:** pnpm.

---

## 3. Fatiamento proposto (anti-"pretty empty blog")

**Regra de ouro:** primeiro post no ar antes de polir engajamento. Sugestão de slicing:

### v1.0 — "Ler" (first post published)
Escopo mínimo que torna o blog *credivelmente publicado* com 1 post.
- Astro scaffolded + Cloudflare Pages deploy em `sertaoseracloud.com`
- Sync pipeline básico (API dev.to → Haiku → markdown commitado manualmente no 1º round)
- Content Collection + Zod schema (inclui campos `source.*` + `canonical_url`)
- Layout base + typography + paleta semântica com CSS vars
- SEO foundational: meta, OG, canonical, sitemap, robots, JSON-LD
- RSS do blog (de markdown traduzido)
- Syntax highlighting (Shiki dual-theme)
- `lang="pt-BR"` + data PT-BR
- 404 brandado
- `/privacidade` stub (LGPD)
- Analytics Cloudflare Web Analytics

### v1.1 — "Sync automatizado"
Tira a mão do autor da tradução.
- GH Actions cron 24h
- `peter-evans/create-pull-request` draft workflow
- Circuit breaker (`MAX_TRANSLATIONS_PER_RUN`)
- GlossaryEnforcer lint
- Delta fetch por hash + exponential backoff
- Runbook de falhas em `docs/sync-pipeline.md`

### v1.2 — "Engajar"
Features de retenção/captura.
- Newsletter (Buttondown + double opt-in + `/privacidade` completa)
- Giscus comments
- Pagefind search
- WhatsApp share + demais share buttons
- Dark mode toggle com `prefers-color-scheme` + persistência

### v1.3 — "Polir"
Brand amplifier + a11y refinement.
- Dynamic OG image per post (satori / @vercel/og)
- Tag landing pages com SEO editorial
- About `/sobre` completa
- A11y CI gate (axe/Lighthouse ≥95)

### v2+ — Diferenciadores
TOC sticky, related posts, post series, Mermaid build-time, `/palestras`, `/projetos`, `/uses`, `/agora`, callouts/admonitions, lead magnet.

---

## 4. Pitfalls críticos a enderenar no roadmap (19 total)

**Do research original (1-14):**
1. Pretty empty blog → v1.0 ships primeiro post obrigatoriamente
2. Paleta vs WCAG → CSS vars semânticas + axe em CI
3. LGPD newsletter → double opt-in + `/privacidade` + export CSV
4. URLs quebradas → estrutura canônica congelada em v1.0
5. SEO anti-patterns → canonical + JSON-LD + Rich Results Test
6. Performance → self-host fonts + AVIF/WebP + CLS-lock
7. Comments privacy → Giscus (v1.2+), nunca Disqus
8. Analytics LGPD → CF Web Analytics (sem cookies)
9. lang/i18n → `lang="pt-BR"`, sem i18n routing
10. Slugs com acento → filename ASCII; rehype-slug cuida dos headings
11. Markdown gotchas → lint em CI + preview em PR
12. Dark mode + brand → OG + favicon testados nos 2 temas
13. Newsletter lock-in → export CSV como gate de escolha
14. A11y além de cor → skip link + focus + alt obrigatório

**Do amendment dev.to (15-19):**
15. Translation drift → glossary no prompt + GlossaryEnforcer + review manual
16. Rate limit dev.to → delta fetch + backoff + skip-on-error
17. Custo Haiku → circuit breaker 5/run + budget alert $5/mo
18. Conflito edit vs new → MVP overwrite; v2 diff-aware com `manual_override`
19. Canonical misconfig → template no dev.to + sync lint + `<link rel="canonical">` no blog

---

## 5. Features inatas vs delegadas (resumo)

| Feature | Quem fornece | Complexidade para nós |
|---------|--------------|------------------------|
| Markdown parse | Astro (Content Collections) | Zero — config only |
| Syntax highlighting | Shiki (bundled) | Baixa — tema dual config |
| Search | Pagefind | Baixa — pós-build step |
| Comments | Giscus (GitHub Discussions) | Baixa — script tag |
| Newsletter capture | Buttondown (free tier) | Baixa — form embed |
| Newsletter compliance | **Nós** (LGPD é responsabilidade do controlador) | Média — `/privacidade` + double opt-in UX |
| Analytics | Cloudflare Web Analytics | Zero — snippet |
| RSS | `@astrojs/rss` | Baixa — 1 arquivo |
| Sitemap | `@astrojs/sitemap` | Zero — integration |
| Hosting/CDN/SSL | Cloudflare Pages | Zero — git push |
| **Content ingestion** | **Nós** (Forem API + Haiku + PR bot) | **Alta — componente novo** |
| **Translation pipeline** | **Nós** (script Node + Anthropic SDK + glossary enforcer) | **Alta — componente novo** |
| Canonical coordination | **Nós** (template no dev.to + lint no sync + header no blog) | Média — processo autoral + código |

Componentes **marcados** são os que dominarão effort no roadmap — resto é configuração idiomática.

---

## 6. Dependencies críticas (ordem implícita no roadmap)

```
Zod schema frontmatter (com source.*, canonical_url)
  ↓
Dev.to API client + DiffDetector
  ↓
Translator (Haiku + glossary) + GlossaryEnforcer
  ↓
PRBuilder (GH Action workflow)
  ↓
[primeiro post chegando no repo]
  ↓
Astro layout + SEO + RSS + sitemap
  ↓
Deploy em Cloudflare Pages com domínio custom
  ↓
[v1.0 shipped — primeiro post no ar]
```

**Blockers não-técnicos (autor precisa fazer):**
- Conta Cloudflare Pages + conectar `sertaoseracloud.com` com SSL
- Conta Anthropic + gerar `ANTHROPIC_API_KEY`
- Habilitar GitHub Discussions em `sertaoseracloud/sertaoseracloud`
- Conta Buttondown + configurar domínio de envio
- Primeiro post no dev.to com `canonical_url` preenchido (triggered sync)

---

## 7. Escopo invariante da paleta de marca

Paleta fixa gera conflito com WCAG AA. Síntese das regras derivadas:

| Cor | Papel semântico | Uso permitido | Uso **proibido** |
|-----|-----------------|---------------|-------------------|
| `#284068` | `--color-text-primary` | Texto corrido em light mode (ratio 10.39:1 sobre branco) | — |
| `#14878c` | `--color-accent` | Ícones ≥24px; headings grandes (3:1 passa em AA Large apenas) | Texto corrido (falha AA 4.5:1) |
| `#65d7b1` | `--color-decorative` | Backgrounds, bordas, ilustrações | Qualquer texto (falha ambas AA) |

**Implicação:** adicionar tons neutros de cinza escuro (ex: `#1a1a1a`, `#2c2c2c`) e neutros claros para texto secundário/fundo, sem violar a marca.

---

## 8. Unknowns que ainda precisam ser resolvidos nas phases

Não bloqueiam o roadmap, mas aparecerão:

- **Hreflang strategy:** tradução ≠ mesmo URL em outro idioma. Research concluiu: NÃO usar hreflang entre blog e dev.to. Mas se um dia tivermos EN version no blog? → deferido v2+.
- **Sync v2 diff-aware:** como detectar "source editou typo" vs "source editou conteúdo"? MVP = overwrite + review manual. Precisará de heurística ou LLM para classificar.
- **Newsletter lead magnet:** "Guia rápido: custos AWS/GCP/Azure em PT-BR"? "Cheatsheet AWS CLI"? → decide durante v1.2.
- **Cover image pipeline:** dev.to hospeda em S3 próprio; baixar e re-servir vs hotlink? → baixar (dev.to pode mudar política).
- **Tag normalization:** dev.to permite `aws` e `AWS` como tags separadas. Normalizar no build? → sim, via lowercase + dedup.
- **OG image dinâmico:** satori vs `@vercel/og`? Ambos rodam em edge/build; decide durante v1.3.
- **Post slug strategy:** usar `slug` da API dev.to ou regenerar? → usar do dev.to (autor já controla lá) + sanitizar ASCII.

---

## 9. Risk radar (curto prazo)

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Haiku traduz mal termo técnico em post public | Média | Alto (credibilidade) | Glossary + enforcer + PR review manual obrigatório |
| Custo Haiku explode por bug | Baixa | Médio (5-70$/mês) | Circuit breaker + budget alert |
| dev.to API muda contrato | Baixa | Alto (quebra sync) | Pin Forem API v1; monitor deprecation notices |
| Cloudflare Pages ou CF Analytics descontinua free tier | Baixa | Alto (migrar) | Stack é portável: output estático, domínio próprio |
| Autor não mantém `canonical_url` no dev.to | Média | Alto (SEO duplicate) | Sync lint abre GH Issue warning; template de post no dev.to |
| Revisão manual de PR vira gargalo | Alta | Baixo (atrasa mas não quebra) | Aceitar latência de review como feature, não bug |
| Autor publica diretamente no blog em markdown (sem passar pelo dev.to) | Baixa | Médio (ambiguidade de source) | Schema permite `source` ser optional; processo define dev.to como default |

---

## 10. Conclusões para o roadmap

**Phases sugeridas (proposta para o `ROADMAP.md`):**

1. **Phase 0: Bootstrap & Fundações** — scaffold Astro, Cloudflare Pages + domínio, content collection schema, paleta semântica em CSS vars, layout base
2. **Phase 1: Dev.to Sync Pipeline (MVP)** — Forem API client, DiffDetector, Translator (Haiku), GlossaryEnforcer, PRBuilder, GH Actions cron, runbook
3. **Phase 2: SEO + RSS + Accessibility Foundation** — meta/OG/JSON-LD, sitemap, canonical bidirectional, a11y CI gate, lang, date formatting
4. **Phase 3: Syntax highlighting + typography + dark mode** — Shiki dual-theme, reading typography, dark mode toggle, focus states, skip link
5. **Phase 4: First post shipped** — gate explícito — primeiro post entra via sync, é revisado, mergeado, indexado no Google
6. **Phase 5: Comments + Search** — Giscus, Pagefind, tag pages
7. **Phase 6: Newsletter + LGPD** — Buttondown, double opt-in, `/privacidade` completa, página `/newsletter`
8. **Phase 7: Share + OG dinâmico + About** — WhatsApp/LinkedIn/X share, satori-based OG, `/sobre` completa
9. **Phase 8: Polish + differentiators** — TOC, related posts, callouts, `/uses`, `/agora`, post series, Mermaid

Phases 0-4 produzem o v1.0 (first post live). Phases 5-7 = v1.2. Phase 8 = v1.3+.

---
*Synthesis for ROADMAP creation — locked decisions, explicit trade-offs, unknowns surfaced.*
*Consolidated: 2026-04-22*
