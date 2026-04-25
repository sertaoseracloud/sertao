# Feature Research

**Domain:** Personal tech blog (solo-author, brand-building, cloud computing niche, PT-BR)
**Researched:** 2026-04-21
**Confidence:** HIGH on table stakes and code/reading UX (well-documented industry standards); MEDIUM on PT-BR specific expectations (derived from LGPD + locale conventions + observed BR dev blogs); MEDIUM on newsletter strategy (best practices consolidated from multiple 2025 sources).

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these makes the blog feel amateur and/or actively loses readers and SEO juice. Non-negotiable for v1.

#### Reading experience & content presentation

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Responsive / mobile-first layout | >50% of BR traffic is mobile; Google mobile-first indexing. Broken on phone = dead on arrival | LOW | Single-column, 16px+ body, fluid images. Test on 360px width (common Android budget phones) |
| Reading typography (65-75 chars/line, 16-18px body, 1.5-1.7 line-height) | Long-form technical reading is the product. Bad type = bounces | LOW | System stack or variable font (Inter, IBM Plex, recife). Flush-left. `max-width` ~ 65ch on prose |
| Dark mode with OS-preference detection | Developer audience expects it; reading code at night is brutal without it | LOW | CSS variables + `prefers-color-scheme` + localStorage override. Match brand palette in both modes |
| Reading time estimate | Standard on every serious dev blog since ~2018 (Medium popularized it) | LOW | Word count / 200 wpm. Show near title |
| Post metadata (publish date, updated date, tags, reading time, author) | Readers scan this before committing. `dateModified` is an SEO signal | LOW | Always surface *both* published and updated when an update happens |
| Tags / categories with landing pages | Navigation + SEO (indexable topic hubs) | LOW | Each tag = own page with post list. Start with ~6-10 tags; don't explode taxonomy |
| Archive / post index (by date or paginated) | Discovery beyond homepage | LOW | Homepage shows recent N; `/posts` or `/blog` shows all |
| Search within blog | Users expect cmd/ctrl-K or a search input. SSG stacks ship this easily | LOW-MEDIUM | Client-side (Pagefind, Fuse.js, Lunr) is free and fast for <500 posts. No server needed |
| Syntax highlighting with language label | Non-negotiable for tutorials. Unhighlighted code = unreadable | LOW | Shiki (build-time, zero runtime JS) is the modern choice. Prism is legacy-acceptable |
| Copy-code button | Universal expectation on dev blogs since ~2021 | LOW | Floating button in code block; use `navigator.clipboard` |
| Mobile-friendly code blocks (horizontal scroll, readable font) | Reading tutorials on phone is common | LOW | `overflow-x: auto`, min 14px mono, avoid word-wrap in code |

#### SEO / discoverability

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Per-post meta (title, description, canonical URL) | Baseline SEO. Missing = Google invents and gets it wrong | LOW | Generate from frontmatter; fall back to first paragraph for description |
| OpenGraph + Twitter/X Cards | Required for link previews on LinkedIn, X, WhatsApp, Telegram (huge in BR) | LOW | og:image is load-bearing — generate per-post (satori/og-image) or use a default brand card |
| Structured data (JSON-LD `BlogPosting` / `Article`) | 2025 Google + Microsoft Copilot confirmed schema still boosts ranking and LLM visibility | LOW | Use `BlogPosting` (inherits from `Article`). Required props: headline, author, datePublished, dateModified, image |
| Sitemap.xml auto-generated | Google Search Console basics | LOW | Every SSG ships this |
| RSS + Atom feed | Dev audience still uses RSS readers heavily; also feeds aggregators (dev.to, tabnews re-posting) | LOW | Atom preferred by purists; many SSGs output both. Full content or summary+link — recommend summary+link for long posts |
| robots.txt + canonical tags | Prevent duplicate-content penalties and accidental deindex | LOW | Template-level |
| 404 page that matches brand | Broken link survival | LOW | Static route |
| Core Web Vitals green (LCP <2.5s, INP <200ms, CLS <0.1) | 2025 ranking signal; dev audience is vocal about slow sites | LOW-MEDIUM | Static generation + image CDN + no heavy JS gets you there by default. Budget: ship <50KB JS on article pages |
| Accessibility baseline (semantic HTML, alt text, keyboard nav, color contrast AA) | Legal+ethical; also SEO signal | LOW-MEDIUM | Headings in order, `<article>`/`<main>`/`<nav>` landmarks, focus outlines, 4.5:1 contrast. Run axe/Lighthouse |

#### Sharing & syndication

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Share links (X, LinkedIn, WhatsApp, copy-link) | LinkedIn + WhatsApp are where BR tech community shares | LOW | Plain anchor tags with `https://x.com/intent/tweet?...` etc. No JS SDKs needed. **Include WhatsApp** (`https://wa.me/?text=...`) — BR-specific must |
| Canonical URL | Prevents duplicate-content issues if post is syndicated to dev.to/Medium/tabnews | LOW | Frontmatter field |

#### Trust / author identity

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| About page with author photo + bio + credentials | Brand-building is the core value. "Who is this person?" must be answerable in one click | LOW | Include headshot, short bio, what you work on, credentials relevant to cloud (AWS/GCP/Azure certs, roles) |
| Contact / social links | Readers wanting to reach author. LinkedIn + GitHub + X minimum for BR tech audience | LOW | Footer + about page. Email optional (spam risk) — consider a contact form or Mailto with obfuscation |
| Footer with RSS link, social, copyright, credits | Standard blog chrome | LOW | RSS icon load-bearing for tech audience |

### Differentiators (Competitive Advantage)

Features that elevate a brand-building dev blog from "another blog" to "THE person to read on cloud in BR". Align with Core Value: building authorial reputation.

#### Brand / identity

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Custom-designed homepage hero with Sertão+Cloud narrative | First impression. The "why this blog" in 2 seconds. Ties identity to content | MEDIUM | Brand palette `#284068 / #14878c / #65d7b1` + typography. Not just a post list — a statement |
| Dynamic OG image generation per post | Every share on LinkedIn/X/WhatsApp becomes a branded billboard. Multiplies brand reach | MEDIUM | `@vercel/og` / `satori` or Github Workers at edge. Template with post title + brand mark. Heavy lift on design, minor on code |
| Consistent visual system (icons, spacing, components) | Professionalism signal; amateur blogs have inconsistent chrome | MEDIUM | Design tokens from brand palette. Use a few reusable components (Callout, Aside, Figure) rather than ad-hoc styling |
| Custom 404 / empty-state pages with personality | Delights readers, makes brand memorable | LOW | Small differentiator, cheap to do well |
| Logo / wordmark applied consistently | Identity anchoring. Favicon, OG image, header, footer all align | LOW | Assumes logo exists; if not, start with typographic wordmark |

#### Content structure

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Post series / tracks (e.g., "AWS para iniciantes: parte 3 de 7") | Long-form authority building. Series rank better and retain readers post-to-post | MEDIUM | Frontmatter `series: slug` + `order: N`. Render "series nav" block on each post. Series index page |
| Related posts (by tag overlap or manual curation) | Reduces bounce, increases pages/session, signals depth of coverage | LOW-MEDIUM | Tag-similarity algorithm at build time (Jaccard or simple overlap). 3-5 suggestions. Manual override via frontmatter |
| Previous / next post navigation | Serial reading; keeps readers in the blog | LOW | Chronological or within series |
| Table of contents (TOC) auto-generated from headings, sticky on desktop | Critical for long technical content (>1500 words). Expected on tutorial/reference-style posts | LOW-MEDIUM | Extract `h2`/`h3`, render sticky sidebar on `md+`, collapsible on mobile. Active-section highlight on scroll is a nice polish |
| Callout / admonition components (Info, Warning, Tip, Danger, Note) | Technical writing benefits massively. Visual hierarchy for key info | LOW | MDX components or markdown extension (e.g., `:::warning`). Five colors from brand palette |
| Footnotes | Useful for technical asides without breaking flow | LOW | Markdown native (`[^1]`). Render as linked side-notes on desktop if you want polish |

#### Code & diagrams

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Code block filename label | Clear context ("this goes in `terraform/main.tf`"). Used by every serious dev blog | LOW | Meta string convention (`` ```ts title="main.ts" ``). Rehype plugin or MDX component |
| Line highlighting in code | Draws attention to changed/key lines in tutorials | LOW | `` ```ts {3,5-7} ``. Shiki supports via transformers |
| Diff-style code blocks | Powerful for "before/after" — common in tutorial content | LOW | Shiki + `shiki-transformer-notation-diff` or `diff` language |
| Mermaid diagram support | Embedded architecture/sequence/flow diagrams without leaving Markdown. Cloud content lives on diagrams | MEDIUM | Render server-side at build (preferred — no client JS) via `mermaid-cli`/`rehype-mermaid`. Fallback: lazy-load client lib. Avoid shipping ~1MB Mermaid JS per page |
| Excalidraw embed support | Hand-drawn diagrams have personality; match the Sertão aesthetic | MEDIUM | Export to SVG at authoring time; embed as `<img>` or inline SVG. Don't ship the Excalidraw runtime |
| Image captions + figure component | Technical images need context | LOW | `<figure><img><figcaption>` MDX wrapper |

#### Engagement & growth

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Newsletter capture with meaningful lead magnet | Owned audience channel. 2025 data: lead magnets boost signup conversion 150%+ (2-4x baseline). Builds brand beyond blog | MEDIUM | Free tier: Buttondown (free <100 subs), Beehiiv (free <2.5K subs), or ConvertKit free tier. **Lead magnet options**: "Guia rápido: custos AWS/GCP/Azure comparados em PT-BR" PDF, or "Cheatsheet: comandos `aws cli` essenciais". Avoid generic "sign up for updates" |
| Newsletter embedded inline at end of post + a dedicated `/newsletter` page | Non-intrusive, contextual. End-of-post is the #1 conversion spot | LOW | Inline form; mirror on static page. **NO modal on load** (see anti-features) |
| Comments via giscus (GitHub Discussions) | Privacy-friendly, ad-free, ties into the dev audience's existing GitHub identity. Zero cost | LOW | Enable Discussions on `sertaoseracloud/sertaoseracloud` repo, create a category, drop giscus script. Supports threads + reactions |
| Reactions (like/helpful/heart) | Low-friction engagement signal even from non-commenters | LOW | Giscus includes this via GitHub reactions, or roll custom with a Github Worker + KV |
| Analytics (privacy-friendly, LGPD-compatible) | Need to know what resonates without betraying readers or needing a cookie banner | LOW | **Recommend Github Web Analytics** (free, LGPD-safe, no cookies, no banner required) or Plausible (paid but richer). Avoid GA4 — triggers LGPD consent banner requirement |
| Post view count (optional) | Social proof for popular posts; also guides what to write next | MEDIUM | Github Workers + D1/KV, or from analytics API. Skip for v1 |

#### Author-as-brand surfaces

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dedicated `/sobre` (About) page — deep version | More than a bio; a narrative. Story of the Sertão+Cloud thesis. Sets the author apart | LOW | Long-form. Include photo, journey, what you write about, where to find you, "por que 'Sertão será Cloud'" |
| Speaking / talks page (`/palestras`) | Credibility. Lists conference talks, podcasts, live streams | LOW | Static list, update manually. Link to slides / recordings. Can start empty and grow |
| Projects / portfolio page (`/projetos`) | Shows what author builds, not just writes about. Reinforces cloud expertise | LOW | Static cards for GitHub projects, side projects, client case studies (if shareable) |
| "Now" page (`/agora`) — Derek Sivers style | Transparent snapshot of current focus. Humanizes author. Popular with dev-blog audience | LOW | Plain markdown page updated monthly/quarterly |
| `/uses` page (setup / stack) | Dev audience loves these. SEO magnet (lots of inbound links from uses.tech) | LOW | Hardware + software + cloud accounts. Register at [uses.tech](https://uses.tech) |

#### PT-BR / Brazilian context specifics

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| `lang="pt-BR"` on `<html>` | Correct locale for browsers, screen readers, Google | LOW | Template-level |
| Brazilian date formatting throughout | "21 de abril de 2026" or "21/04/2026" — never "April 21, 2026". Signals this blog is BY a Brazilian, FOR Brazilians | LOW | `Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })`. Set in one date helper |
| `America/Sao_Paulo` timezone for timestamps | "Publicado às 14:30" should be BR time, not UTC. Small detail, strong signal | LOW | `Intl.DateTimeFormat` with `timeZone` option |
| Prices in BRL + USD side-by-side when mentioning cloud costs | Cloud pricing is listed in USD on AWS/GCP/Azure. BR reader converts mentally — do it for them. Huge value-add for "custos de nuvem" content | LOW | Manual or scripted. Quote current rate ("cotação em abr/2026: ~R$5,10/USD"). Don't fake real-time |
| Privacy / LGPD statement on newsletter opt-in | LGPD requires clear consent, accessible data-use info, revocation mechanism. Not optional | LOW | Checkbox at signup + link to `/privacidade` page. Email service provider should handle unsubscribe. Keep consent audit trail |
| `/privacidade` (Privacy Policy) page | LGPD mandates accessible information on data collection/use. Simple blog still needs one (collects emails, analytics) | LOW | Template exists widely; adapt honestly. Cover: what's collected (email, analytics), why, how to revoke, author contact |
| Cookie/tracking disclosure (minimal if no tracking cookies) | LGPD — but with Github/Plausible (no cookies), you avoid the banner. Just a privacy page link suffices | LOW | **Choose no-cookie analytics to skip banner entirely.** Avoid GA4 specifically to avoid banner UX cost |
| Brazilian Portuguese orthography per Acordo Ortográfico (post-2009) | Educated BR readers notice "pará" vs "para" errors | N/A | Authoring discipline. Use a spell-check plugin in the editor |
| Share-to-WhatsApp button | WhatsApp is the dominant BR sharing channel — more than X + LinkedIn combined for casual tech sharing | LOW | `https://wa.me/?text=...` anchor. **Gringos skip this; BR blogs must include it** |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Document the alternative so we don't re-debate.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Heavy JS framework (Next.js w/ full RSC, Remix) for static content | "Modern stack" FOMO; author is a dev | Static blog doesn't need it; ships unnecessary JS; hurts Core Web Vitals; overkill for Markdown + Git | **Astro or Hugo**. Both generate pure HTML by default, hydrate only islands when needed. Astro is better for dev ergonomics + React-familiar; Hugo for raw speed. Use `@astrojs/mdx` for rich content |
| Modal popup newsletter signup on page load / after N seconds | "They 10x my list" claims | Universally hated; bounces mobile readers; bad for Core Web Vitals (CLS); LGPD-messy if pre-selected consent | **Inline form at end of post** + dedicated `/newsletter` page. Maybe a subtle slide-in *after* 80% scroll of a post — never on load |
| Exit-intent popups | Same as above, "last chance to capture" | Mobile has no exit intent; desktop users find it aggressive; damages brand more than it gains subs | Inline forms; earn re-visits via quality, not interruption |
| Autoplay video / hero video | "Visual impact" | Mobile data cost, accessibility nightmare, perf killer, users mute anyway | Static hero with brand imagery; video only on demand with click-to-play |
| Disqus comments | "Easy drop-in comments" | Ads on free tier, tracks users without consent (LGPD problem), $3M Norway fine precedent, loads ~1.5MB JS, privacy nightmare | **Giscus** (GitHub Discussions) — free, no ads, no tracking, fits dev audience. Or utterances (issues-based, no threading) as fallback |
| Google Analytics / GA4 | "Everyone uses it" | LGPD requires cookie banner; heavy; privacy concerns; overkill for personal blog | **Github Web Analytics** (free, no cookies, no banner) or **Plausible** (paid, no cookies, no banner). Skips LGPD banner entirely |
| Related-by-ML recommendations / "Trending posts" | "Engagement!" | Requires server + DB + complexity; for a solo blog with N<50 posts, tag-overlap is just as good and free | Tag-overlap related posts, manually featured posts on homepage |
| Live chat widget (Intercom, Crisp) | "Talk to readers" | Solo author can't man a chat; widget adds JS + privacy burden; irrelevant to blog use case | Contact link / email. Twitter/LinkedIn DMs for real-time |
| Infinite scroll on archive | "More posts discovery" | Breaks SEO (paginated links ignored), back-button hell, accessibility issues | **Standard pagination** or "Load more" button. Better yet: `/blog` = full archive (fine up to ~200 posts) |
| Web fonts loaded from multiple sources | "Typography variety" | FOUT/FOIT, perf hit, blocks render | Self-host 1-2 variable fonts (`font-display: swap`), max 2 weights. IBM Plex Sans / Inter are good picks and free |
| Autoplaying code demos / embedded CodeSandbox iframes loaded eagerly | "Interactive!" | Iframes are heavy; CodeSandbox on every tutorial = 10MB+ of runtime JS | Static code blocks + external link to sandbox/playground. Embed only when interactive exploration is the point of the post |
| AI chatbot / "ask this blog" widget | 2025 hype | Cost, accuracy problems, privacy concerns, irrelevant to brand-building for a single author | Skip. Good search + good writing > chatbot |
| Instagram embeds / TikTok embeds in posts | "Social!" | Heavy, privacy-invasive, break when deleted upstream | Screenshot + attribution link |
| Multiple ad networks | Monetization | Irrelevant: budget-zero, brand is the product (not clicks); ads cheapen author brand | No ads. If monetizing later: sponsorships disclosed in-post, not network ads |
| Per-post comments *plus* forum *plus* Discord *plus* newsletter | "Community everywhere" | Fragments engagement, zero-maintenance fantasy, empty channels look bad | Pick 1-2: comments (giscus) + newsletter. Add more only when demand proves it |

## Feature Dependencies

```
[Newsletter signup form]
    └──requires──> [Email service provider account (Buttondown/Beehiiv/ConvertKit)]
         └──requires──> [LGPD consent checkbox + /privacidade page]

[Giscus comments]
    └──requires──> [GitHub Discussions enabled on sertaoseracloud/sertaoseracloud repo]
         └──requires──> [Public repo]

[Dynamic OG images per post]
    └──requires──> [Runtime or build-time image generation (satori/@vercel/og)]
         └──requires──> [Font files available at generation time]

[RSS/Atom feed]
    └──requires──> [Post frontmatter: title, description, date, permalink]

[Structured data (JSON-LD)]
    └──requires──> [Post frontmatter: author, datePublished, dateModified, image]

[Reading time]
    └──requires──> [Word count of rendered prose (not frontmatter)]

[Related posts (tag overlap)]
    └──requires──> [Tags/categories feature]

[Post series navigation]
    └──requires──> [Series frontmatter convention (`series:` + `order:`)]

[Table of contents]
    └──requires──> [Heading extraction at render (rehype plugin)]

[Search]
    └──requires──> [Search index generated at build (Pagefind auto-indexes HTML)]

[Share-to-WhatsApp button]
    └──requires──> [Canonical URL known at render]

[Dark mode]
    └──requires──> [Brand palette defined for both modes]
        └──enhances──> [Syntax highlighting (needs two themes — Shiki `themes: { light, dark }`)]

[LGPD compliance]
    └──enhances──> [Newsletter, analytics, comments — all three touch personal data]
    └──conflicts──> [Google Analytics (triggers cookie banner requirement)]
    └──conflicts──> [Disqus (third-party tracking)]

[Core Web Vitals green]
    └──conflicts──> [Heavy JS frameworks, client-side Mermaid, eager iframes, web font overload]
```

### Dependency Notes

- **Newsletter requires email provider + LGPD consent:** Legally, storing emails without documented consent is non-compliant under LGPD. Any provider choice (Buttondown free tier recommended for simplicity) needs an opt-in checkbox referencing a `/privacidade` page.
- **Giscus requires public GitHub Discussions:** Comments post as Discussions entries; readers need GitHub accounts to comment (acceptable for dev audience — arguably a feature, filters out spam).
- **Dynamic OG images are a build-time concern:** if the SSG is Astro/Hugo, satori-based generation at build is fine and free; if the SSG is static-only (no Node), pre-generate via a script in CI.
- **Dark mode + syntax highlighting are coupled:** Shiki supports dual themes natively (`github-light` + `github-dark`, or a brand-matched pair). Pick this early; retrofitting is tedious.
- **LGPD conflicts with GA4/Disqus:** Picking Github Analytics + giscus bypasses the cookie-banner UX cost entirely. This is a *design* decision, not just a compliance one.
- **Core Web Vitals conflicts with heavy JS:** Mermaid client-side adds ~1MB; solution is build-time rendering. If client-side is required, lazy-load on intersection (Mermaid 9.2+ supports this).

## MVP Definition

### Launch With (v1) — everything needed to publish the first post credibly

Non-negotiable for launch day. If any of these is missing, blog feels incomplete.

- [ ] Markdown + Git publishing flow (commit → build → deploy) — **core value**
- [ ] Responsive layout with brand palette applied — **first impression**
- [ ] Reading typography (65-75ch, 16-18px, 1.5-1.7 leading) — **product IS reading**
- [ ] Dark mode w/ OS detect + manual toggle — **dev audience table stakes**
- [ ] Syntax highlighting (Shiki, dual theme) + copy button + filename label + line highlight — **tutorials need this**
- [ ] Post metadata: title, description, publish date (PT-BR format), reading time, tags — **table stakes**
- [ ] Homepage with hero + recent posts — **brand first impression**
- [ ] Tag pages (one landing per tag) — **navigation + SEO**
- [ ] Post archive (`/blog` or `/posts`) — **discovery**
- [ ] About (`/sobre`) page with author photo, bio, thesis — **brand-building is the core value**
- [ ] Contact/social in footer (GitHub, LinkedIn, X/Twitter minimum) — **author identity**
- [ ] Per-post SEO: title, description, canonical, OG, Twitter Card, JSON-LD BlogPosting — **SEO is explicit requirement**
- [ ] Sitemap.xml + robots.txt — **SEO baseline**
- [ ] RSS + Atom feed — **explicit requirement + dev audience**
- [ ] Share buttons: X, LinkedIn, **WhatsApp**, copy-link — **BR-specific**
- [ ] 404 page with brand — **polish floor**
- [ ] Dynamic OG image per post (or one great default if time-constrained) — **every share = branded billboard**
- [ ] `lang="pt-BR"` + PT-BR date/time formatting — **locale correctness**
- [ ] Privacy page (`/privacidade`) — **LGPD requirement**
- [ ] Privacy-friendly analytics (Github Web Analytics or Plausible) — **no cookie banner needed**
- [ ] Client-side search (Pagefind) — **explicit requirement, cheap**
- [ ] Comments via giscus — **explicit requirement, free, LGPD-safe**
- [ ] Newsletter signup form (inline at post end + `/newsletter` page) with LGPD consent — **explicit requirement**
- [ ] Core Web Vitals green on Lighthouse — **SEO + UX**
- [ ] Accessibility: semantic HTML, alt text, keyboard nav, AA contrast — **baseline ethics + SEO**

### Add After Validation (v1.x) — ship after ~5-10 posts exist

Features that pay off once there's content volume. Adding them pre-content is premature optimization.

- [ ] Table of contents (sticky) — **useful once posts regularly exceed 1500 words**
- [ ] Related posts (tag overlap) — **needs a content corpus to be useful**
- [ ] Previous / next post navigation — **same; trivial once archive exists**
- [ ] Post series / tracks — **add when first multi-part series is written**
- [ ] Mermaid diagrams (build-time rendering) — **add on first post that needs a diagram, not speculatively**
- [ ] Callout/admonition components — **add when authoring needs them**
- [ ] `/palestras` page — **add when first talk exists**
- [ ] `/projetos` page — **add when first highlightable project exists**
- [ ] `/uses` page — **cheap SEO; add within the first month**
- [ ] `/agora` page — **adds humanity; trivial**
- [ ] Footnotes polish (side-notes on desktop) — **nice-to-have**
- [ ] Excalidraw embeds — **add on first post needing them**
- [ ] Newsletter lead magnet (PDF/cheatsheet) — **add once you have something worth giving; generic "updates" is fine at first**
- [ ] Full-text search with ranking (Pagefind does this) — **if Pagefind not chosen initially**

### Future Consideration (v2+) — defer until there's a reason

- [ ] Per-post reactions beyond giscus — **needs infra, solve only if engagement demands**
- [ ] View counts — **vanity metric; only add if content strategy needs it**
- [ ] Curated "best of" / featured landing — **needs enough posts to curate (~20+)**
- [ ] Guest posts / multi-author — **explicitly out of scope per PROJECT.md**
- [ ] Content gating / paid tiers — **not aligned with brand-building thesis**
- [ ] Mobile app / PWA install prompt — **web is sufficient**
- [ ] i18n (English translations) — **brand is PT-BR; adding EN dilutes focus unless strategic need emerges**
- [ ] Interactive code playgrounds (CodeSandbox-style inline) — **heavy, defer until a post truly needs it**
- [ ] AI "ask this blog" chatbot — **hype-driven; skip until there's clear value**
- [ ] Forum / Discord integration — **fragments community; skip unless demand is proven**

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Markdown + Git publishing | HIGH | LOW (SSG gives it free) | P1 |
| Responsive layout | HIGH | LOW | P1 |
| Reading typography | HIGH | LOW | P1 |
| Dark mode | HIGH | LOW | P1 |
| Syntax highlighting + copy + filename + line highlight | HIGH | LOW-MEDIUM | P1 |
| Tags + tag pages | HIGH | LOW | P1 |
| Post archive | MEDIUM | LOW | P1 |
| About page | HIGH (for brand) | LOW | P1 |
| SEO meta + OG + Twitter Card | HIGH | LOW | P1 |
| JSON-LD structured data | MEDIUM (SEO) | LOW | P1 |
| Sitemap + robots + canonical | HIGH (SEO) | LOW | P1 |
| RSS/Atom | MEDIUM (niche but core audience) | LOW | P1 |
| Share buttons (inc. WhatsApp) | MEDIUM | LOW | P1 |
| 404 page | LOW | LOW | P1 |
| Dynamic OG image | HIGH (brand amplifier) | MEDIUM | P1 |
| PT-BR locale (dates, lang) | MEDIUM (trust signal) | LOW | P1 |
| /privacidade + LGPD newsletter consent | HIGH (legal) | LOW | P1 |
| Privacy-friendly analytics | MEDIUM | LOW | P1 |
| Client-side search | MEDIUM | LOW (Pagefind) | P1 |
| Giscus comments | MEDIUM | LOW | P1 |
| Newsletter signup (inline) | HIGH (brand channel) | MEDIUM | P1 |
| Core Web Vitals green | HIGH (SEO) | LOW if stack is right | P1 |
| Accessibility baseline | HIGH (ethics + SEO) | LOW-MEDIUM | P1 |
| Table of contents | MEDIUM | LOW-MEDIUM | P2 |
| Related posts | MEDIUM | LOW-MEDIUM | P2 |
| Previous / next | LOW | LOW | P2 |
| Post series | MEDIUM (once used) | MEDIUM | P2 |
| Mermaid (build-time) | HIGH (for cloud content) | MEDIUM | P2 |
| Callouts / admonitions | MEDIUM | LOW | P2 |
| /palestras, /projetos, /uses, /agora | MEDIUM (brand depth) | LOW | P2 |
| Newsletter lead magnet | HIGH (conversion) | MEDIUM (needs content) | P2 |
| Excalidraw embeds | LOW (situational) | MEDIUM | P2 |
| Reactions / view counts | LOW | MEDIUM | P3 |
| i18n, PWA, chatbot, playgrounds | LOW-MEDIUM | HIGH | P3 |

**Priority key:**

- P1: Must ship in v1 (first-post launch)
- P2: Ship within first 1-3 months, once content exists to justify
- P3: Defer; revisit only if a specific need emerges

## Exemplar Blogs Analyzed

Used as benchmarks for what "good" looks like in 2025-2026. These embody table-stakes + differentiator combinations we're targeting.

| Blog | Author | Strengths to Emulate | Stack (observed) |
|------|--------|----------------------|------------------|
| [joshwcomeau.com](https://www.joshwcomeau.com/) | Josh W. Comeau | Reading typography (standout), interactive callouts, post series, delightful brand personality, strong TOC, copy-code UX | Next.js + MDX |
| [leerob.io](https://leerob.io/) | Lee Robinson (Vercel) | Minimalist layout, view counts, strong OG images, excellent dark mode, clean typography, newsletter integration, `/uses` page | Next.js + MDX |
| [kentcdodds.com](https://kentcdodds.com/) | Kent C. Dodds | Strong content discovery (search, filtering, tag landing), workshops/talks pages as first-class citizens, heavy newsletter + course funnel | Remix + MDX |
| [rwieruch.com](https://www.robinwieruch.de/) | Robin Wieruch | Deep post series / tracks, tutorial-focused structure, strong SEO, newsletter-first growth | Gatsby |
| [overreacted.io](https://overreacted.io/) | Dan Abramov | Minimalism done well; reading-first; shows that less chrome can be a statement. Counter-example for any "we need X widget" argument | Next.js (formerly Gatsby) |
| [macielti.com.br](https://macielti.com.br/) / various BR tech blogs on [dev.to/br](https://dev.to/t/braziliandevs) | Various BR devs | PT-BR tone, WhatsApp share integration, date format convention, tabnews/dev.to cross-posting patterns | Varies |

**Takeaway from exemplars:** None of them use Disqus. All use build-time syntax highlighting. Most use giscus/utterances or no comments at all. All have clear authorial voice on `/about`. All are performance-obsessed. None have intrusive popups.

## Sources

### Features / industry standards

- [Our Top 12 picks for Static Site Generators (SSGs) in 2026 — Hygraph](https://hygraph.com/blog/top-12-ssgs)
- [Starting a Technical Blog in 2026: Platform Comparison — dasroot.net](https://dasroot.net/posts/2026/04/starting-technical-blog-2026-platform-comparison/)
- [The Must-Have SEO Checklist for Developers in 2025 — Strapi](https://strapi.io/blog/seo-checklist-for-developers)
- [Core Web Vitals for Developers in 2025](https://onlinesolutionszone.com/core-web-vitals-for-developers-2025/)
- [Google Search Central: Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)
- [Article Schema — Google Search Central](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Article vs Blog Schema: 2026 SEO guide](https://searchenginezine.com/technical/schema/article-vs-blog-schema/)
- [Schema.org Feeds](https://schema.org/docs/feeds.html)

### Typography & reading

- [Optimal Line Length for Readability — UXPin](https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/)
- [Readability: The Optimal Line Length — Baymard](https://baymard.com/blog/line-length-readability)
- [Typography — U.S. Web Design System](https://designsystem.digital.gov/components/typography/)

### Code blocks / MDX

- [Powerful Code Blocks with Code Hike and MDX](https://blog.anishde.dev/powerful-code-blocks-with-code-hike-and-mdx)
- [MDX syntax highlighting docs](https://github.com/mdx-js/mdx/blob/main/docs/guides/syntax-highlighting.mdx)
- [Customize MDX code blocks in Next.js 14 (rehype-pretty-code)](https://www.gptrush.io/blog/mdx-syntax-highlighting-copy-to-clipboard-using-nextjs)

### Comments / privacy

- [Best Disqus Alternatives 2025 — AlternativeTo](https://alternativeto.net/software/disqus/)
- [Top 11 Disqus Alternatives in 2025 — Hyvor](https://hyvor.com/blog/disqus-alternatives)
- [Setting Up Giscus: An Ad-Free Alternative to Disqus](https://chocapikk.com/posts/2025/setting-up-giscus-comments/)
- [Replacing Disqus With Giscus and Github Discussions — justinmklam](https://www.justinmklam.com/posts/2025/08/replacing-disqus-with-giscus/)

### Analytics / LGPD

- [Plausible vs Umami comparison — Vemetric](https://vemetric.com/blog/plausible-vs-umami)
- [Github Web Analytics vs Plausible](https://plausible.io/vs-Github-web-analytics)
- [Privacy-First Analytics Compared — Nuxt Scripts](https://scripts.nuxt.com/learn/privacy-first-analytics-compared)
- [LGPD Compliance: Practical Guide — Secure Privacy](https://secureprivacy.ai/blog/lgpd-compliance-requirements)
- [LGPD for Publishers — Kevel](https://www.kevel.com/blog/lgpd-guide)
- [LGPD Checklist — Usercentrics](https://usercentrics.com/resources/lgpd-checklist/)

### Diagrams & images

- [Lazy Loading Mermaid — Rick Strahl](https://weblog.west-wind.com/posts/2025/May/10/Lazy-Loading-the-Mermaid-Diagram-Library)
- [Mermaid Diagrams in a Static Site Using MDX and Contentlayer](https://respawn.io/posts/contentlayer-mermaid-diagrams)
- [Revisiting Mermaid.js for simple diagrams — Korny's Blog](https://blog.korny.info/2025/03/14/mermaid-js-revisited)
- [Using Excalidraw to manage diagrams — HN discussion](https://news.ycombinator.com/item?id=47571376)

### Newsletter / lead magnets

- [7 Lead Magnet Ideas To 10X Conversion Rates In 2025 — Funnelytics](https://www.funnelytics.io/blog/7-lead-magnet-ideas-to-10x-conversion-rates-in-2025)
- [How to Create Email Newsletter Popup — GetSiteControl](https://getsitecontrol.com/blog/email-newsletter-popup/)
- [Lead Magnet Statistics 2025](https://mycodelesswebsite.com/lead-magnet-statistics/)

### Exemplar blogs

- [joshwcomeau.com](https://www.joshwcomeau.com/)
- [leerob.io](https://leerob.io/)
- [kentcdodds.com](https://kentcdodds.com/)
- [overreacted.io](https://overreacted.io/)
- [robinwieruch.de](https://www.robinwieruch.de/)

---

## Amendment — 2026-04-22: dev.to Pivot — Revisão de MVP

### Itens MVP substituídos

- ~~Markdown + Git publishing flow (commit → build → deploy)~~
- → **dev.to (fonte) → auto-translate Haiku → PR → merge → build → deploy**

### Adicionados ao v1 (P1)

- [ ] dev.to Forem API sync script (`pnpm run sync:devto`)
- [ ] Claude Haiku EN→PT-BR translator com preservação de glossário
- [ ] GlossaryEnforcer CI lint (falha sync se `AWS`/`Azure`/etc. são mistraduzidos)
- [ ] GH Actions cron (24h) + trigger manual (`workflow_dispatch`)
- [ ] Fluxo editorial via PR (`peter-evans/create-pull-request@v7`, sempre draft)
- [ ] Canonical URL bidirecional (`canonical_url` no dev.to; `<link rel="canonical">` no blog)
- [ ] `.planning/glossary.json` com termos técnicos preservados
- [ ] Extensão de schema frontmatter (`source.*`, `canonical_url`, `manual_override`)
- [ ] Circuit breaker: `MAX_TRANSLATIONS_PER_RUN=5` + budget alert Anthropic em $5/mês
- [ ] README da pipeline (docs/sync-pipeline.md) com runbook de falhas comuns

### Features inalteradas

Todos os outros itens MVP (SEO, sitemap, RSS, WhatsApp share, giscus comments, Pagefind, Github Analytics, dark mode, Shiki dual-theme, etc.) permanecem. O pivô é **como posts chegam no repo**, não **o que o site faz com eles**.

### Implicações específicas

**RSS do blog:** continua gerado pelo Astro (`@astrojs/rss`) a partir do markdown traduzido. **Não é proxy do feed do dev.to.** Blog tem seu próprio feed canônico em `sertaoseracloud.com/rss.xml`.

**Tags:** vêm de `tag_list` da API do dev.to. Mapeamento possível via glossário se um dia precisar normalizar (ex.: `aws` vs `AWS`).

**Cover image:** campo `cover_image` do dev.to — baixar e servir local (não hotlink — dev.to pode mudar política de CDN).

**Reading time:** calculado no build Astro sobre o markdown traduzido, NÃO vem do dev.to (contagem de palavras PT difere de EN).

**Data de publicação:** usar `published_at` da API do dev.to (não `created_at` — dev.to distingue).

### Features adiadas para P2 (pós-MVP)

- Webhook-based sync (dev.to webhooks são private beta — revisitar)
- Re-tradução parcial (hoje: retradução completa em mismatch de hash)
- Blog bilíngue (EN+PT lado a lado) — fronteira explícita de escopo

---
*Feature research for: Personal tech blog (PT-BR, cloud, brand-building, solo-author, dev.to-sourced + auto-translated)*
*Researched: 2026-04-21 · Amended: 2026-04-22*
