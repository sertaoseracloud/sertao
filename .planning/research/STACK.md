# Stack Research

**Domain:** Solo-author, Markdown-driven personal tech blog (PT-BR) on $0 budget
**Researched:** 2026-04-21
**Confidence:** HIGH (Astro + Github Pages + Shiki + Pagefind + Giscus is the 2026 consensus stack; versions verified against npm/official release notes)

---

## Executive Recommendation (TL;DR)

**Winning combo:** `Astro 6.x` + `Tailwind CSS v4` + `Shiki 3.x` (built-in) + `Pagefind 1.x` + `Giscus` + `Buttondown` + `Github Web Analytics` + `Github Pages`.

Rationale in one breath: Astro ships zero JS by default (critical for a reading-first blog), owns the 2026 content-site mindshare, has first-class MD/MDX + RSS + sitemap integrations, and its Github Pages deploy path gives **unlimited bandwidth + unlimited requests + 500 builds/month + free custom-domain SSL** — the only $0 combo where the author will not hit a wall as traffic grows. Shiki is already bundled (no extra dep), Pagefind is build-time indexed static search (no server, no SaaS quota), Giscus is the 2026 default for GitHub-backed comments, Buttondown is the Markdown-native newsletter with a real free tier + RSS-to-email, and Github Web Analytics is privacy-friendly, cookieless, and completely free on the same platform.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Astro** | `^6.0.0` (stable March 2026) | Static Site Generator + content framework | Zero JS by default (~15 KB HTML page vs ~200 KB for Next.js blog); Content Collections API with Zod-typed frontmatter; built-in Shiki, MD, MDX; islands for selective interactivity (dark-mode toggle, search box). 2026 consensus SSG for content sites. |
| **Node.js** | `>=22.12` LTS | Build runtime | Astro 6 hard requirement. Required by Vite 7 + Zod 4. |
| **TypeScript** | `^5.6` | Types for components + content schema | Astro Content Collections use Zod schemas generating TS types for frontmatter — prevents broken posts at build time. |
| **Tailwind CSS** | `^4.0` (Vite plugin) | Styling + brand palette | v4 `@theme` directive fits the fixed brand palette (#284068 / #14878c / #65d7b1) as semantic tokens; supports manual `.dark` variant for toggle; no more `tailwind.config.js` required. |
| **MDX** (`@astrojs/mdx`) | `^4.x` | Rich content when Markdown isn't enough | Keep 95% of posts in plain `.md`; reach for `.mdx` only when a post needs an interactive demo or custom component. |
| **Github Pages** | N/A (hosted) | Static hosting + CI/CD + CDN + SSL | Unlimited bandwidth + unlimited requests + 500 builds/month free tier; auto-deploy on `git push`; free SSL for `sertaoseracloud.com`; commercial use allowed (Vercel Hobby forbids it). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Shiki** | `^3.x` (bundled with Astro 6) | Syntax highlighting | Already inside Astro — do not install separately. Configure `markdown.shikiConfig.themes = { light, dark }` for dual-theme highlighting that respects the dark-mode toggle. |
| **@astrojs/rss** | `^4.0.18` | RSS / Atom feed generation | Create `src/pages/rss.xml.js`; feeds a content-collection query into an RSS endpoint. Mandatory for the requirement "Feed RSS / Atom". |
| **@astrojs/sitemap** | `^3.7.2` | sitemap.xml + sitemap-index.xml | One-line integration in `astro.config.mjs`; automatic on build. Mandatory for SEO. |
| **@shikijs/transformers** | `^3.x` | Code-block annotations (`// [!code ++]`, diff, focus, highlight) | Optional but valuable for tutorial posts — VitePress-style annotations are the 2026 de-facto standard. |
| **rehype-slug** | `^6.x` | Auto-generate heading IDs | Enables anchor links on H2/H3 — table-of-contents friendly. Handles Portuguese diacritics via NFD Unicode normalization. |
| **rehype-autolink-headings** | `^7.x` | Anchor link icons on headings | UX polish; pairs with rehype-slug. |
| **github-slugger** | `^2.x` | Heading/post slugification for PT-BR | Handles `ã`, `ç`, `é`, `ó` etc via Unicode NFD decomposition; used internally by rehype-slug but available directly if you need slugs for tag pages. |
| **Pagefind** | `^1.4` | Full-text static search | Post-build step (`pagefind --site dist`) that chunks an index; browser only fetches relevant chunks per query. Detects `<html lang="pt-BR">` automatically; adapts stemming where supported. 83K weekly downloads as Astro integration vs 571 for Fuse.js — clear winner. |
| **Giscus** | latest (script tag) | Comment system | Uses GitHub Discussions API (better than Utterances' Issues: threaded replies, reactions, easier moderation); zero backend; inherits the `sertaoseracloud` identity the repo already has. Install via `<script>` tag in a post layout. |
| **Buttondown** | N/A (SaaS free tier) | Newsletter capture + send | Markdown-native compose; REST API + webhooks + **RSS-to-email** (auto-send newsletter when a new post's RSS item appears) — perfect for solo author. Free tier: 100 subscribers — enough to validate the habit; upgrade only after traction. |
| **Github Web Analytics** | N/A (hosted) | Privacy-friendly traffic analytics | Free, cookieless, no consent banner needed under LGPD; built-in Core Web Vitals; zero-config on Github Pages. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **pnpm** | Package manager | ~3x faster installs than npm on cold cache; strict peer-dep resolution catches Astro integration mismatches. |
| **Prettier** + `prettier-plugin-astro` | Formatter for `.astro` + `.md` | Keep post frontmatter tidy. |
| **ESLint** + `eslint-plugin-astro` | Linter | Light config; catches broken content-collection imports. |
| **Astro VS Code extension** | Editor support | Syntax highlighting + IntelliSense for `.astro` files. |
| **GitHub Actions** | CI (optional) | Github Pages auto-deploys on push — CI only needed if you want Lighthouse/link-check gates before merge. |

## Installation

```bash
# 1. Scaffold with the official blog template (pre-wires Content Collections + RSS)
pnpm create astro@latest blog_sertao -- --template blog --typescript strict --install

cd blog_sertao

# 2. Core integrations
pnpm astro add tailwind mdx sitemap
pnpm add @astrojs/rss

# 3. Markdown quality-of-life
pnpm add rehype-slug rehype-autolink-headings @shikijs/transformers github-slugger

# 4. Static search (runs AFTER `astro build`)
pnpm add -D pagefind

# 5. Dev tooling
pnpm add -D prettier prettier-plugin-astro eslint eslint-plugin-astro
```

**`package.json` build script wiring Pagefind after Astro build:**

```json
{
  "scripts": {
    "build": "astro build && pagefind --site dist"
  }
}
```

**No install needed** for: Giscus (drop a `<script>` in the post layout), Buttondown (embed form HTML or hit REST API), Github Web Analytics (paste snippet in base layout).

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Astro** | **Hugo** | Choose Hugo only if you want a single Go binary, zero Node toolchain, and sub-second builds for thousands of posts. Trade-off: template language (Go) is idiosyncratic; weaker component ergonomics; smaller ecosystem for modern UI niceties. For ≤500 posts, Astro builds are fast enough. |
| **Astro** | **Eleventy (11ty)** | Choose 11ty if you want "just HTML + JS utilities" with no framework. Excellent for minimalists, but no Content Collections/Zod, no built-in Shiki config, no islands — you'll assemble RSS + sitemap + search yourself. Fine but slower to first post. |
| **Astro** | **Next.js App Router** | Only if the blog will grow into a React-heavy app (dashboards, auth, ISR'd product pages). Overkill for a reading blog: ~200 KB baseline JS, `force-static` gymnastics, Vercel coupling. |
| **Astro** | **Zola** | Choose Zola for "single Rust binary, no Node" + strong defaults. Smaller ecosystem than Hugo; not worth the lock-in vs Astro for a greenfield JS-friendly author. |
| **Astro** | **Jekyll** | Do not choose Jekyll in 2026 unless you are locked into GitHub Pages' legacy build. Ruby toolchain, slower, shrinking ecosystem. |
| **Github Pages** | **Netlify** | Choose Netlify only if you need its Forms/Functions ecosystem out of the box. 2026 free tier was downgraded to 100 build minutes + credit-based bandwidth — tight for an actively-developed blog. |
| **Github Pages** | **Vercel** | Best-in-class DX for Next.js, but: 100 GB/mo bandwidth cap (vs unlimited on CF), and Hobby plan **prohibits commercial use** — risky if the blog later monetizes (job inquiries, sponsorships). |
| **Github Pages** | **GitHub Pages** | Choose only if you also want the repo and hosting in the same UI and don't mind a Jekyll bias. No build-minute cap, but no edge functions, weaker cache invalidation, and domain/SSL setup is less smooth. |
| **Shiki** | **Prism.js** | Only if you need runtime-toggleable languages (user-provided code). Prism has weaker TypeScript grammar and requires client-side JS + CSS theme files. |
| **Shiki** | **Starry Night** | GitHub's highlighter — excellent quality but fewer ready-made themes and less ecosystem tooling for dual-theme dark mode. Shiki is the safer bet. |
| **Pagefind** | **Fuse.js** | Only for very small sites (<30 posts) where the whole index (~a few KB) can ship inline. Fuse ships the entire index to every visitor — doesn't scale. |
| **Pagefind** | **Algolia DocSearch (free)** | Free tier exists but requires applying + being approved for docs/OSS projects — not guaranteed for a personal blog. Also introduces an external dependency. |
| **Giscus** | **Utterances** | Use only if you specifically prefer Issues over Discussions (you don't — Discussions are purpose-built for threaded comments). Giscus is the modern successor. |
| **Giscus** | **Cusdis** | Use only if you want zero GitHub dependency + privacy-first framing. Free tier exists but upgrade is $5/mo — violates the $0 budget as the blog grows. Also less battle-tested. |
| **Buttondown** | **MailerLite free** | Choose if you expect to cross 100 subscribers fast AND want a visual email builder. MailerLite free = 1,000 subs. Trade-off: less Markdown-native, more marketing-UI overhead. |
| **Buttondown** | **Kit (ex-ConvertKit) free** | Choose if you need landing pages + tagging/segmentation now. 10K-subscriber free tier. Trade-off: heavier UI, less developer-friendly than Buttondown. |
| **Github Web Analytics** | **Plausible (hosted)** | $9/mo — not free. Community Edition self-host is free but requires a $5/mo VPS — violates $0 budget. |
| **Github Web Analytics** | **Umami (self-hosted)** | Fully free under MIT, but needs a VPS ($5/mo minimum) + DB — breaks $0 budget. Revisit when you can afford infra. |
| **Github Web Analytics** | **GA4** | Free but privacy-hostile (requires cookie consent under LGPD), noisy UI, being actively replaced in privacy-aware circles. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **WordPress / Ghost / any CMS** | Out of scope per PROJECT.md (explicit decision: Markdown + Git, no admin panel). Ghost also costs money on managed tier. | Astro + Content Collections |
| **Headless CMS (Contentful/Sanity/Strapi)** | Explicit Out-of-Scope: "conteúdo mora no repositório" | `.md` files in `src/content/blog/` |
| **Next.js Pages Router** | Legacy — App Router is the current standard and even then overkill for a blog. | Astro |
| **Gatsby** | Effectively abandoned post-Netlify acquisition; GraphQL data layer is over-engineered for `.md` files. | Astro |
| **Vercel Hobby for a "personal brand" blog** | Hobby ToS **prohibits commercial use**. A personal-brand blog that attracts job/consulting inquiries is legally ambiguous. | Github Pages (commercial use allowed on free tier) |
| **Disqus** | Privacy-invasive, ad-injecting, slow. LGPD exposure. | Giscus |
| **Prism.js client-side with themes/css** | Client-side JS + runtime parsing adds weight; weaker TS grammar. | Shiki (build-time, zero client JS) |
| **Fuse.js for >100 posts** | Loads the entire index into memory on every page that uses search — kills mobile bandwidth. | Pagefind |
| **Google Analytics 4** | LGPD consent overhead; heavy script; privacy-hostile framing clashes with brand ("resiliente, profissional"). | Github Web Analytics |
| **Mailchimp free** | Free tier dropped to 500 contacts + heavy branding; poor dev ergonomics. | Buttondown or MailerLite |
| **Substack** | Not a fit: it *owns* your content and subscribers; no custom domain on free tier without gymnastics; content doesn't live in your repo. | Buttondown with RSS-to-email |
| **github-slugger default with Cyrillic/non-Latin preservation** in URLs | Preserves some non-ASCII; for PT-BR you want diacritics *stripped* from URLs (`comecando-com-aws` not `começando-com-aws`) for link portability. | Use `github-slugger` + explicit `String.prototype.normalize('NFD').replace(/[̀-ͯ]/g, '')` in your slug helper, OR let Astro's filename-based slug handle it (write filenames already in ASCII). |

---

## Stack Patterns by Variant

**If author wants first post shipped within 72 hours:**

- Use the official `pnpm create astro@latest -- --template blog` starter.
- Skip Tailwind on day 1 — ship with the starter's scoped CSS.
- Skip search + comments on day 1; add after 3–5 posts exist.
- Day-1 minimum: Astro blog template → deploy to Github Pages → point `sertaoseracloud.com`.

**If author wants to prioritize brand identity (Sertão palette) before first post:**

- Install Tailwind v4 + define `@theme { --color-brand-deep: #284068; --color-brand-teal: #14878c; --color-brand-mint: #65d7b1; }` in `global.css`.
- Use these as `bg-brand-deep`, `text-brand-teal`, etc.
- Dark mode: add `.dark` class to `<html>` via a small inline script in `BaseHead.astro` to avoid FOUC.

**If author expects >1,000 monthly readers within 6 months:**

- Stay on Github Pages — unlimited bandwidth is the whole point.
- Consider upgrading Buttondown ($9/mo) or migrating to MailerLite free (1K subs) before hitting 100 subs.
- Revisit self-hosted Umami only when a VPS is justified.

**If a post needs interactive code/demos:**

- Use `.mdx` just for that post.
- Hydrate only the demo component with `client:visible`.
- Do NOT convert all posts to MDX — plain `.md` is faster, cleaner, and tool-agnostic.

**If PT-BR content requires language signaling:**

- Set `<html lang="pt-BR">` in the base layout — Pagefind auto-uses it; screen readers use it; SEO engines use it.
- Set `<meta property="og:locale" content="pt_BR">` for correct social previews.
- Do NOT configure Astro's i18n routing — this is a single-language blog; i18n routing adds URL prefixes (`/pt-br/`) you don't want.

---

## PT-BR Content Implications (Explicit)

| Concern | Impact | Mitigation |
|---------|--------|------------|
| **Slug generation for titles with `ã`, `ç`, `é`** | Default Astro filename slug uses the filename as-is. If filenames have accents, URLs will have percent-encoded bytes (`%C3%A3`) — ugly and fragile. | **Convention:** author writes filenames already in ASCII: `meu-post-sobre-orquestracao.md`, not `meu-post-sobre-orquestração.md`. Frontmatter `title:` keeps accents for display. |
| **Heading anchors with diacritics** | `rehype-slug` + `github-slugger` use NFD normalization — `## Começando com AWS` becomes `#comecando-com-aws`. This is correct behavior. | No action needed — defaults are good. |
| **Pagefind search quality** | Pagefind detects `lang="pt-BR"` and filters results to same-language pages. Stemming for Portuguese is partial (prefix matching works: "cloud" → "clouds"). | Accept partial stemming; document in the search UI that exact-match works best. Good enough for v1. |
| **Shiki + Portuguese code comments** | Shiki only highlights code syntax, not natural language — comments in Portuguese render fine. | No action needed. |
| **LGPD (Lei Geral de Proteção de Dados)** | GA4 requires consent banner; Github Web Analytics does not (no cookies, no PII). | Use Github Web Analytics → skip consent banner entirely. |
| **Date formatting (`21 de abril de 2026`)** | Astro's date rendering uses JS `Intl`. | In post layout: `new Date(frontmatter.pubDate).toLocaleDateString('pt-BR', { dateStyle: 'long' })`. |
| **RSS feed `language` tag** | Feed readers use `<language>` to filter. | In `src/pages/rss.xml.js`, pass `customData: \`<language>pt-BR</language>\`` to the `rss()` helper. |
| **OpenGraph + Twitter cards** | Social previews default to English locale. | Set `og:locale=pt_BR` + `og:site_name="O Sertão será Cloud"` in `BaseHead.astro`. |

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `astro@^6.0.0` | `node@>=22.12`, `vite@^7`, `zod@^4` | Hard requirements. Running on Node 20 will fail `astro build`. |
| `astro@^6.0.0` | `@astrojs/mdx@^4`, `@astrojs/sitemap@^3.7`, `@astrojs/rss@^4.0` | Use `pnpm astro add <integration>` — it pins the correct version for your Astro major. |
| `tailwindcss@^4` | Astro via `@tailwindcss/vite` plugin, NOT `@astrojs/tailwind` | The old `@astrojs/tailwind` integration is v3-only. Use the Vite plugin (`pnpm astro add tailwind` picks this up automatically on Astro 6). |
| `shiki@^3` | Bundled with Astro 6 — do not install `shiki` directly | If you also install `@shikijs/transformers`, match the major version (`^3`). |
| `pagefind@^1.4` | Any static output directory (`dist/`) | Runs post-build; no framework coupling. |
| `giscus` | Any modern browser | Requires GitHub Discussions enabled on `sertaoseracloud/sertaoseracloud` and giscus app installed on that repo. |
| `@astrojs/rss@4.x` | Astro 5 or 6 | 4.x supports the Content Layer API (Astro 5+). |

---

## Sources

### HIGH confidence (official docs / release notes / Context7)

- [Astro — What's new March 2026 (Astro 6 release)](https://astro.build/blog/whats-new-march-2026/)
- [Astro 6 Beta announcement](https://astro.build/blog/astro-6-beta/)
- [Astro Docs — Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Astro Docs — Syntax Highlighting (Shiki dual theme)](https://docs.astro.build/en/guides/syntax-highlighting/)
- [Astro Docs — Github deploy](https://docs.astro.build/en/guides/deploy/Github/)
- [Astro Docs — @astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [Astro Docs — RSS recipe](https://docs.astro.build/en/recipes/rss/)
- [npm: @astrojs/rss 4.0.18](https://www.npmjs.com/package/@astrojs/rss)
- [npm: @astrojs/sitemap 3.7.2](https://www.npmjs.com/package/@astrojs/sitemap)
- [Pagefind — Multilingual docs (PT-BR language detection)](https://pagefind.app/docs/multilingual/)
- [Giscus repo — GitHub Discussions-based comments](https://github.com/giscus/giscus)
- [Tailwind CSS v4 — Dark mode docs](https://tailwindcss.com/docs/dark-mode)
- [Github Pages — Astro framework guide](https://developers.Github.com/pages/framework-guides/deploy-an-astro-site/)
- Context7: `/websites/astro_build_en` — Astro framework reference (3191 code snippets, reputation HIGH)

### MEDIUM confidence (multiple reputable sources agree)

- [Hosting & PaaS Free Tier Comparison 2026 (agentdeals.dev)](https://agentdeals.dev/hosting-free-tier-comparison-2026) — free-tier limits corroborated against platform docs
- [Shiki vs Prism vs highlight.js 2026 (PkgPulse)](https://www.pkgpulse.com/blog/shiki-vs-prismjs-vs-highlightjs-syntax-highlighting-2026) — download metrics + DX notes
- [Hugo vs Astro in 2026 (Criztec)](https://criztec.com/hugo-vs-astro/) — performance positioning
- [Why I switched from Orama to Pagefind (Sarthak Mishra)](https://sarthakmishra.com/blog/pagefind-astro) — Astro + Pagefind wiring
- [Astro in 2026: Github acquisition (dev.to)](https://dev.to/polliog/astro-in-2026-why-its-beating-nextjs-for-content-sites-and-what-Githubs-acquisition-means-6kl) — Astro/Github strategic alignment
- [Plausible vs Umami vs Github Web Analytics 2026](https://openpanel.dev/articles/self-hosted-web-analytics) — analytics comparison
- [Buttondown review + pricing (MailToolFinder)](https://mailtoolfinder.com/reviews/buttondown/) — newsletter tier details
- [Kit (ConvertKit) 2026 pricing](https://www.emailvendorselection.com/kit-pricing/) — 10K free-tier subscribers corroborated

### LOW confidence / informational

- [github-slugger README + changelog](https://github.com/Flet/github-slugger) — verified handling of Unicode NFD; exact behavior with PT-BR is inferred from source + Romance-language precedent

---

## Confidence Summary

| Area | Confidence | Rationale |
|------|------------|-----------|
| SSG choice (Astro 6) | **HIGH** | Official release notes confirm stable; multiple 2026 comparisons concur it's the content-site default; versions verified via Context7 + npm |
| Hosting (Github Pages) | **HIGH** | Free-tier limits confirmed against platform pricing page + independent comparisons; commercial-use rule on Vercel Hobby explicitly flagged |
| Syntax highlighting (Shiki) | **HIGH** | Shipped inside Astro 6; official docs show dual-theme config |
| Search (Pagefind) | **HIGH** | 83K weekly downloads as Astro integration; multilingual docs confirm PT-BR detection |
| Comments (Giscus) | **HIGH** | De-facto standard for GitHub-hosted static blogs in 2026 |
| Newsletter (Buttondown) | **MEDIUM** | Free tier at 100 subs is small; fallback to MailerLite / Kit is safe and well-documented |
| Analytics (Github Web Analytics) | **HIGH** | Free + LGPD-friendly + zero-config on same platform |
| PT-BR slug/diacritic handling | **MEDIUM** | Mechanism (NFD normalization) is well-known; recommendation to write filenames in ASCII is conservative and avoids edge cases |

---

## Amendment — 2026-04-22: Content Pivot to dev.to + Auto-Translation

Decision cascade pós-research: **dev.to tornou-se a fonte de verdade** para conteúdo (substitui Markdown-in-repo manual). Posts originam em [dev.to/@sertaoseracloud](https://dev.to/sertaoseracloud) em inglês; pipeline automatizado fetcha via Forem API, traduz EN→PT-BR com **Claude Haiku 4.5**, e abre PR para revisão editorial antes de publicar.

### Adições ao stack

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **@anthropic-ai/sdk** | `^0.40.x` | Cliente Claude Haiku 4.5 para tradução | Melhor qualidade técnica PT-BR com custo mínimo; preserva glossário via system prompt |
| **GitHub Actions** | hosted | Camada de compute para sync cron | Tier gratuito; roda a cada 24h; abre PRs para revisão |
| **Forem API (dev.to)** | v1 | Fonte de artigos | `GET /api/articles?username=sertaoseracloud` retorna `body_markdown` + `tag_list` + `canonical_url` — tudo necessário. Sem SDK — `fetch` nativo no script do Action |
| **peter-evans/create-pull-request** | `v7` | Criação automática de PR editorial | Idiomático em workflows Actions; branch + label + assignee configuráveis |

### Secret management

- `ANTHROPIC_API_KEY` — GH Actions repository secret; escopo restrito ao workflow de sync
- `GITHUB_TOKEN` — fornecido pelo runtime; usado pelo bot para abrir PRs
- Sem chave dev.to necessária para leitura de artigos públicos

### Projeção de custo

Claude Haiku 4.5: ~$1/M tokens input, ~$5/M tokens output.

- Post técnico longo: ~10K input + ~10K output = **~$0.06/post**
- Volume projetado: 2-4 posts/mês = **~$0.12-$0.24/mês → ~$3-$5/ano**

Única linha pay-as-you-go. Todo o resto permanece em $0 (Github Pages, Pagefind, Giscus, Buttondown).

### Install adicional

```bash
# Em adição ao install principal do STACK.md:
pnpm add -D @anthropic-ai/sdk
# Nenhuma dep runtime — tradução roda em GH Action, não no build Astro
```

### O que muda no build Astro?

**Nada.** Astro continua compilando de `src/content/posts/*.md`. A diferença é que esses arquivos markdown passam a ser escritos pelo bot de sync, não por edição humana manual. Shiki continua rodando no build sobre blocos de código do markdown traduzido — HTML pré-renderizado do dev.to **não** é usado; fetchamos `body_markdown` via API e re-highlight com temas da marca.

### Atualização de "What NOT to Use"

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **DeepL Free** (considerado inicialmente) | Melhor qualidade geral mas preservação de glossário técnico é limitada — não aceita system prompt; força post-hoc find/replace | **Claude Haiku via SDK** — glossário inline no system prompt preserva "AWS", "Azure", "deploy" etc. |
| **Parsear HTML do RSS do dev.to** | HTML pré-renderizado inclui estilização proprietária + classes dev.to-específicas que vazam no build | **Forem API** retorna `body_markdown` bruto — deixa Shiki re-highlightar com temas da marca |
| **Traduzir no runtime (browser)** | Impossível manter Core Web Vitals; custo de API por pageview | **Traduzir no sync time** (build-before-build) — markdown traduzido commitado é estático |

---
*Stack research for: Solo-author PT-BR tech blog on cloud — dev.to source + auto-translation via Claude Haiku + $0 hosting (Github Pages)*
*Researched: 2026-04-21 · Amended: 2026-04-22*
