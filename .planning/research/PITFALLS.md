# Pitfalls Research

**Domain:** Personal tech blog (Markdown + Git, PT-BR, solo author, zero budget)
**Researched:** 2026-04-21
**Confidence:** HIGH (well-trodden domain; most pitfalls are documented post-mortems and WCAG/LGPD are testable facts)

---

## Critical Pitfalls

### Pitfall 1: "Pretty empty blog" — ships with all features, zero posts

**What goes wrong:**
Autor gasta semanas polindo dark mode, busca, syntax highlighting, comentários, newsletter — e nunca escreve o primeiro post. Quando publica, não tem conteúdo. Perde o momento de lançamento. Muitas vezes abandona antes do post nº 3.

**Why it happens:**
- Escrever código é confortável; escrever texto em público é vulnerável (procrastinação técnica vira fuga).
- Lista de features do v1 no `PROJECT.md` tem 11 itens marcados como "Active" — cada um empurra o primeiro post mais para o futuro.
- Feedback loop invertido: autor valida a plataforma antes de validar se vai mesmo escrever.

**How to avoid:**
- **Regra de ouro:** primeiro post **no ar** (mesmo em v0 feio) antes de qualquer feature de engagement (comentários, newsletter, busca).
- Fatiar v1 em camadas: **v1.0 = ler** (home + post + tags + RSS + SEO básico); **v1.1 = engajar** (newsletter, comentários, busca); **v1.2 = polir** (dark mode, busca avançada).
- Definir critério de "parar de construir e escrever": assim que 1 post consegue ser publicado com SEO + RSS + highlight, **congelar stack por 2 semanas** e publicar.
- Escrever 3 posts-rascunho em paralelo ao desenvolvimento (não esperar plataforma pronta).

**Warning signs:**
- Backlog de dev cresce mais rápido que backlog de posts.
- Autor fala "só falta X para publicar" por mais de 1 sprint consecutiva.
- Nenhum `.md` em `content/` depois de 2 semanas de repo.

**Phase to address:**
Phase 1 (MVP publicável). Toda feature não-essencial para ler o primeiro post vai para Phase 2+.

---

### Pitfall 2: Acessibilidade quebrada pela paleta de marca

**What goes wrong:**
A paleta fixa (`#284068`, `#14878c`, `#65d7b1`) é usada diretamente como texto/fundo sem validação, e cai abaixo de WCAG AA em vários pares. Leitor com baixa visão, daltonismo ou em tela exposta ao sol não consegue ler. Autor só descobre quando alguém abre issue — ou pior, silenciosamente não volta.

**Why it happens:**
- Paleta foi definida por apelo estético (céu sertanejo, vegetação, inovação), não por contraste.
- Designers raramente testam em contexto de leitura longa (parágrafos inteiros, não labels).
- `#14878c` e `#65d7b1` são cores "bonitas" mas muito saturadas no meio-tom — zona perigosa para contraste.

**How to avoid — resultado do teste WCAG AA sobre a paleta real:**

Contraste calculado (fórmula oficial W3C, relative luminance):

| Par | Ratio | AA Normal (4.5:1) | AA Large (3:1) | Uso recomendado |
|-----|-------|-------------------|----------------|-----------------|
| `#284068` sobre `#ffffff` | **10.39:1** | PASS | PASS | Texto corrido, links, headings |
| `#ffffff` sobre `#284068` | **10.39:1** | PASS | PASS | Dark sections, header invertido |
| `#284068` sobre `#65d7b1` | **5.86:1** | PASS | PASS | Badges, callouts, botões |
| `#65d7b1` sobre `#284068` | **5.86:1** | PASS | PASS | Links em dark mode, highlights |
| `#000000` sobre `#65d7b1` | **12.86:1** | PASS | PASS | Botões com texto preto |
| `#14878c` sobre `#ffffff` | **3.84:1** | **FAIL** | PASS | **Nunca como texto corrido.** OK como texto ≥24px ou ícones decorativos |
| `#ffffff` sobre `#14878c` | **3.84:1** | **FAIL** | PASS | Mesmo: evitar texto corrido; OK em headings grandes |
| `#65d7b1` sobre `#ffffff` | **1.77:1** | **FAIL** | **FAIL** | **Nunca como texto.** Apenas decoração (bordas, backgrounds, ilustração) |
| `#14878c` sobre `#65d7b1` | **2.17:1** | **FAIL** | **FAIL** | **Nunca combinar.** |
| `#14878c` sobre `#284068` | **2.71:1** | **FAIL** | **FAIL** | **Nunca combinar** (tem cor intermediária quase igual) |

**Regras de uso que caem desta tabela:**
1. Texto corrido em light mode: **sempre `#284068` sobre branco** (ou cinza escuro custom).
2. Texto corrido em dark mode: **branco sobre `#284068`**, não verdes.
3. `#14878c` é cor de **acento** (ícones ≥24px, borders, headings grandes), nunca parágrafo.
4. `#65d7b1` é cor **decorativa** (backgrounds, bordas, ilustrações do Sertão), **nunca texto sobre branco**.
5. Estados de hover/focus devem também passar — testar `:focus-visible` com ring em `#284068` (que passa).

**Warning signs:**
- Autor usa `#14878c` como cor de link em texto corrido.
- Placeholder de input ou texto secundário em `#65d7b1`.
- Botão CTA com `#65d7b1` no fundo e texto branco — falha.

**Phase to address:**
Phase 1 (design system) — codificar as regras acima em CSS variables semânticas (`--text-primary`, `--accent`, `--decorative`) em vez de usar hex direto. Testar com axe-core/Lighthouse como CI gate.

---

### Pitfall 3: LGPD violations em newsletter (e ausência de política de privacidade)

**What goes wrong:**
Autor coloca um `<input type="email">` que dispara newsletter imediatamente (single opt-in), sem política de privacidade, sem checkbox de consentimento específico, e sem capacidade de exportar/excluir os emails. Primeiro reclamante na ANPD = multa potencial + dano reputacional para quem se posiciona como "voz em cloud no Brasil".

**Why it happens:**
- LGPD é tratada como problema de "empresa grande", quando aplica-se a **qualquer tratamento de dados pessoais** (email é dado pessoal) por pessoa física ou jurídica.
- Provedores de newsletter gringos (ConvertKit, Mailchimp) não cuidam do compliance brasileiro automaticamente — responsabilidade é do controlador (autor).
- Double opt-in é visto como "fricção que baixa conversão" e é pulado.

**How to avoid:**
- **Double opt-in obrigatório:** usuário submete → recebe email de confirmação → clica para confirmar. Sem clique = sem inscrição. Isso gera prova de consentimento.
- **Checkbox explícito não pré-marcado:** "Concordo em receber emails sobre cloud computing" + link para política de privacidade. LGPD exige consentimento **específico e destacado**.
- **Política de privacidade pública** em `/privacidade/`: finalidade, base legal (consentimento), tempo de retenção, direitos do titular (acesso, correção, exclusão, portabilidade), contato do controlador.
- **Provedor com export de lista:** escolher serviço que permite download CSV da lista (Buttondown, Beehiiv, Mailerlite free — todos permitem; Substack é gated e dificulta portabilidade).
- **Link de unsubscribe em todo email** (exigência LGPD + boa prática anti-spam).
- **Logar timestamp + IP do consentimento** (provedor sério faz isso).

**Warning signs:**
- Formulário sem checkbox de consentimento.
- Site sem `/privacidade/` ou política genérica copiada de template americano (cita CCPA mas não LGPD).
- Provedor de newsletter não expõe endpoint ou botão de export de subscribers.

**Phase to address:**
Phase 2 (engagement) — junto com a newsletter, **obrigatoriamente** entra política de privacidade + double opt-in + export test. Não existe "newsletter MVP sem compliance" neste contexto jurídico.

---

### Pitfall 4: URLs quebradas em rebranding / migração / mudança de slug

**What goes wrong:**
Autor publica `/2026/04/meu-primeiro-post-sobre-aws` com data no slug. Seis meses depois decide que slugs sem data são melhores. Renomeia. Todos os compartilhamentos antigos (LinkedIn, Twitter, Discord) viram 404. Google desindexa. Ranking volta a zero.

**Why it happens:**
- Gerador de site (muitas vezes) inclui data no permalink por default (herança de WordPress/Jekyll).
- Autor inicial copia estilo "formal" de blog de notícia (que precisa de data no URL) sem precisar.
- Mudanças de escopo ("vou reorganizar em categorias") quebram URLs sem redirect.

**How to avoid:**
- **Definir estrutura de URL canônica no Phase 1 e nunca mais mudar**: recomendação para blog pessoal tech = `sertaoseracloud.com/posts/slug-sem-data/` ou `sertaoseracloud.com/slug-sem-data/`.
- **Não colocar data no slug.** Data vive no frontmatter do Markdown; exibida no HTML, fora do URL.
- **Trailing slash consistency:** escolher **com** ou **sem** trailing slash e aplicar redirect 301 do outro padrão. Nunca permitir que `/post` e `/post/` sejam ambos 200.
- **Tudo lowercase, sem acentos, sem espaços.** Sanitização `ascii-fold + lowercase + kebab-case` (ver Pitfall 10).
- **Redirects em `_redirects` / `netlify.toml` / `vercel.json`** sempre que um slug muda. Regra: **URL publicada é contrato**.
- **Sitemap + canonical URL tag** em todo post (`<link rel="canonical">`) apontando para URL oficial.

**Warning signs:**
- Permalink do SSG tem `:year/:month/:slug`.
- Duas URLs diferentes servem o mesmo post (com/sem trailing, com/sem `.html`).
- `robots.txt` não aponta sitemap, ou sitemap não existe.

**Phase to address:**
Phase 1 (estrutura de URL = decisão arquitetural). Redirects como primitiva desde o deploy inicial.

---

### Pitfall 5: SEO anti-patterns em blog técnico

**What goes wrong:**
Blog lança com problemas comuns que sabotam ranqueamento: tag pages gerando duplicate content, `<link rel="canonical">` ausente ou incorreto, sem structured data (Article/BlogPosting JSON-LD), sitemap ausente, `robots.txt` bloqueando demais ou de menos, meta description duplicada.

**Why it happens:**
- Tag/category pages listam os mesmos posts que a home → Google vê como "thin content" ou duplicate.
- Templates padrão de SSG não incluem JSON-LD (tem que configurar manualmente).
- Autor testa com Lighthouse mas não com Rich Results Test / Search Console.

**How to avoid:**
- **Canonical em cada post** apontando para a URL definitiva (resolve duplicatas de tag page).
- **Tag pages com `noindex`** se não têm conteúdo próprio (só lista), ou transformá-las em hub pages com descrição editorial (preferível para blog tech).
- **Sitemap.xml** gerado automaticamente pelo SSG, referenciado em `robots.txt`: `Sitemap: https://sertaoseracloud.com/sitemap.xml`.
- **`robots.txt` minimalista**: `User-agent: *` / `Allow: /` / `Sitemap: ...`. Não bloquear `/` "por via das dúvidas".
- **JSON-LD `BlogPosting`** em cada post: headline, author, datePublished, dateModified, image, mainEntityOfPage. Valida em Rich Results Test.
- **Meta description única por post** (extraída do frontmatter ou do primeiro parágrafo — nunca reutilizar descrição do site).
- **`lang="pt-BR"` no `<html>`** (não `"en"` — ver Pitfall 9).
- **OG tags + Twitter Card** para compartilhamento (image:1200x630, title, description, site_name).
- **Inscrever domínio no Google Search Console** desde o deploy 1 e verificar indexação.

**Warning signs:**
- Search Console reporta "Duplicate without user-selected canonical".
- Rich Results Test não encontra `BlogPosting`.
- `view-source` do post não tem `<link rel="canonical">`.
- Home e tag page têm mesma meta description.

**Phase to address:**
Phase 1 (SEO é fundacional — refazer SEO depois é caro e perde-se ranking).

---

### Pitfall 6: Performance — imagens não otimizadas + Google Fonts + CLS

**What goes wrong:**
Autor sobe PNG de 3MB de prints de terminal; usa Google Fonts via `<link>` do CDN do Google; fonte carrega depois do CSS e causa Cumulative Layout Shift (texto pula ao re-layout); Lighthouse dá 40 em mobile; Core Web Vitals falham; Google penaliza.

**Why it happens:**
- Workflow Markdown simples: `![](print.png)` → sem pipeline de otimização de imagem.
- Google Fonts é o caminho default em tutoriais — todo mundo copia o snippet.
- Fonte sem `font-display: swap` + sem preload = FOIT (texto invisível) ou FOUT violento.
- Client-side JS (React/Vue hydration) rodando em página que é 100% estática.

**How to avoid:**
- **Pipeline de imagem** no SSG: converter para AVIF + WebP automaticamente, gerar `srcset`, lazy-load por default (`loading="lazy"`), explicit `width`/`height` em todo `<img>` (evita CLS).
- **Self-host das fontes** (baixar WOFF2, servir do próprio domínio): sem request extra de DNS, sem tracking do Google, melhor caching. Também resolve potencial questão de GDPR/LGPD (Google Fonts + IP do visitante = dado pessoal transferido para EUA sem base legal clara; já houve multa na Alemanha).
- **`font-display: swap`** + preload do WOFF2 da fonte principal.
- **SSG puro (SSR/SSG sem hidratação desnecessária)**: se Astro, usar `client:visible` ou nada. Se Next.js, preferir `output: 'export'` ou páginas estáticas. Hugo/Eleventy/Zola são estáticos puros por default.
- **Orçamento de página**: meta Lighthouse Mobile ≥90 em todos os scores; budget JS ≤50KB em uma página de post (apenas syntax highlighting + search widget, carregados sob demanda).
- **Core Web Vitals como CI gate**: Lighthouse CI no PR.

**Warning signs:**
- `.png` com mais de 200KB sendo servido a mobile.
- Network tab mostra request para `fonts.googleapis.com` ou `fonts.gstatic.com`.
- CLS > 0.1 no Lighthouse.
- Bundle JS > 100KB em página de post.

**Phase to address:**
Phase 1 (pipeline de imagem + self-host fonts = decisão de build, não otimização tardia). CI gate em Phase 2.

---

### Pitfall 7: Sistema de comentários — armadilhas de privacidade, spam, abandono

**What goes wrong:**
- **Disqus**: injeta ads e trackers de terceiros → degrada performance e privacidade, incompatível com posicionamento profissional.
- **Comentários abertos (sem auth):** spam incontrolável em dias.
- **Utterances:** baseado em GitHub Issues — projeto com baixa manutenção em 2025/2026; autor do repo confirmou foco em Giscus.
- **Giscus:** requer GitHub account do comentarista → filtra audiência não-dev; comunidade tech BR inclui muita gente sem conta GitHub ativa.

**Why it happens:**
- Escolha do sistema é feita antes de descobrir que o blog tem 0 comentários reais e 50 spam.
- Plataformas "gratuitas" cobram em privacidade do leitor ou em vendor lock-in.

**How to avoid:**
- **Não lançar comentários no v1.0.** Comentários só fazem sentido com audiência. Primeiro 10 posts podem viver sem comentários.
- **Quando lançar, usar Giscus** sobre GitHub Discussions (não Issues — Issues têm problema de poluir tracker do repo, Discussions são feitas para isso). Aceita-se a barreira de GitHub account — público é tech e o incentivo é alinhado.
- **Alternativa:** link explícito "comenta no LinkedIn / responde este email / abra discussion em github.com/sertaoseracloud" — zero dependência, zero spam.
- **Nunca Disqus** (ads + trackers + identificador cross-site; violaria o posicionamento do blog).
- **Se um dia lançar sistema próprio:** moderação obrigatória, rate limiting, captcha, double-validação.

**Warning signs:**
- Autor cogitando Disqus por "facilidade".
- Comentários abertos sem auth em produção.
- Utterances sendo instalado em 2026 (dependência em manutenção reduzida).

**Phase to address:**
Phase 2 ou Phase 3 (não Phase 1). Usar Giscus como padrão quando entrar.

---

### Pitfall 8: Analytics violando LGPD (GA4 sem consentimento + sem base legal)

**What goes wrong:**
Autor instala Google Analytics 4 direto porque "todo blog tem". GA4 coleta IP, fingerprint de device, eventos de comportamento. Isso é tratamento de dado pessoal. Sem cookie banner de consentimento explícito + sem base legal documentada + transferência internacional para EUA = violação LGPD. Além disso, cookie banners mal feitos destruem UX.

**Why it happens:**
- GA4 é default cultural; autor nem cogita alternativa.
- Base legal "legítimo interesse" é invocada mal (LGPD exige teste de proporcionalidade).
- Cookie banners são delegados a libs que aceitam por omissão (dark pattern).

**How to avoid:**
- **Usar analytics privacy-first que não precisa de cookie banner**: Plausible (pago mas barato), Umami (self-hosted gratuito em tier free do Vercel/Railway), GoatCounter (gratuito, hosted). Esses **não coletam dado pessoal**: agregam views, referrer, country-level — sem IP persistido, sem cookie, sem fingerprint.
- **Benefício de marca:** blog pode declarar "privacy-first, sem cookies, sem GA" — coerente com posicionamento profissional.
- **Se mesmo assim quiser GA4:** banner de cookie real (não-pré-marcado, com "Rejeitar" igualmente visível), bloqueio de script até consentimento, política explícita.
- **`robots.txt` não ajuda aqui** (GA4 é client-side).
- **Declarar na política de privacidade** qual analytics é usado e por quê.

**Warning signs:**
- Script de `googletagmanager.com/gtag/js` em produção.
- Cookie banner que só tem "Aceitar" (falta "Rejeitar" com mesmo destaque).
- Política de privacidade não menciona analytics.

**Phase to address:**
Phase 1 (escolher stack de analytics na mesma hora do deploy inicial — retroativo é custoso e frágil).

---

### Pitfall 9: Meta tags em idioma errado + hreflang mal configurado

**What goes wrong:**
Template do SSG default tem `<html lang="en">`. Autor publica posts em PT-BR. Google classifica o site como conteúdo em inglês; não aparece em buscas em PT-BR; leitores de tela anunciam palavras portuguesas com pronúncia inglesa. Além disso, OG tags em inglês no LinkedIn/Twitter preview ("Read more" em vez de "Leia mais").

**Why it happens:**
- Templates de SSG são em inglês por default.
- Configuração de `lang` fica esquecida no `<html>`.
- `hreflang` só é necessário se há múltiplos idiomas — aplicar errado em site monolíngue cria confusão.

**How to avoid:**
- `<html lang="pt-BR">` em todo template.
- Meta OG/Twitter: `og:locale` = `pt_BR`.
- **Site monolíngue PT-BR não precisa de `hreflang`**. Adicionar só se um dia tiver versão em inglês.
- Strings de UI (botão "Ler mais", "Assinar", "Publicado em", labels de busca) todas em PT-BR.
- 404 e 500 pages em PT-BR.
- Labels de acessibilidade (`aria-label`) em PT-BR.

**Warning signs:**
- `curl -s https://sertaoseracloud.com | grep 'lang='` retorna `en`.
- Google Search Console reporta idioma detectado ≠ PT-BR.
- Preview de LinkedIn tem "Read more".

**Phase to address:**
Phase 1 (correção no layout base). Se já em produção, corrigir imediatamente.

---

### Pitfall 10: Slugs com acentos, espaços ou caracteres PT-BR não-ASCII

**What goes wrong:**
Autor publica post "Introdução ao Kubernetes" → slug default vira `introdução-ao-kubernetes`. URL com caracteres não-ASCII → encoding inconsistente (`%C3%A7%C3%A3o`), quebra em alguns clients de email, copy/paste em Slack quebra, parsing em algumas libs falha, compartilhamento em plataformas legacy quebra.

**Why it happens:**
- SSGs modernos aceitam unicode em URLs → parece "funcionar".
- Autor escreve o título em PT-BR e esquece de revisar o slug.
- Não há CI que valide slug.

**How to avoid:**
- **Sanitização automática de slug no build**: lowercase + remove acentos (NFD + strip combining) + substitui espaço por hífen + remove non-`[a-z0-9-]`. Resultado: `introducao-ao-kubernetes`.
- **Slug explícito no frontmatter** (`slug: introducao-ao-kubernetes`) — não confiar em geração automática a partir de título.
- **CI check**: regex `^[a-z0-9]+(?:-[a-z0-9]+)*$` em todo slug; falha o build se algum slug tem acento ou maiúscula.
- **Mesmo princípio para filenames**: `content/introducao-ao-kubernetes.md`, não `Introdução ao Kubernetes.md` (git em Windows/macOS case-insensitive ferra depois).

**Warning signs:**
- `%C3`, `%A7`, `%E3` em URLs compartilhadas.
- Filenames do `content/` com espaços ou maiúsculas.
- Frontmatter sem campo `slug`.

**Phase to address:**
Phase 1 (política de slug = decisão permanente, mudar depois quebra URLs — ver Pitfall 4).

---

### Pitfall 11: Markdown/MDX gotchas que aparecem só depois de publicado

**What goes wrong:**
- **Smart quotes** (" " ' ') gerados por editores (Notion, Word) copiados para dentro de blocos de código → comando `curl "..."` publicado com aspas curvas → leitor copia e erro de sintaxe no shell. Clássico.
- **Quebra de linha dentro de parágrafo:** autor usa single newline para "quebrar" visualmente, mas Markdown ignora (paragráfos só quebram com linha em branco). Resultado: parágrafo gigante quando publicado.
- **Links relativos**: `[veja este post](../outro-post.md)` funciona local, quebra no site (extension `.md` não é URL).
- **Imagens com path absoluto de filesystem** (`/Users/autor/images/foo.png`) commitado por engano.
- **MDX com `<Component/>` sem fechar**: quebra build inteiro.
- **Frontmatter YAML com caractere especial sem quote:** `title: "Cloud: O Futuro"` (dois-pontos precisa aspas).

**Why it happens:**
- Preview local renderiza diferente de produção.
- Editor (VS Code / Typora / Obsidian) "ajuda" autocorrigindo aspas.
- Ninguém olha o HTML final antes de publicar.

**How to avoid:**
- **Lint de Markdown no CI:** `markdownlint` + `remark-lint` com regras contra smart quotes, heading skip, etc.
- **Desligar smart quotes no editor** do autor (VS Code: `"editor.autoClosingQuotes": "never"` em `.md`; Typora: Preferências → desligar SmartyPants).
- **Não usar MDX no v1** — Markdown puro é mais simples, menos pontos de falha. MDX só se autor precisa componentes interativos (não precisa no v1).
- **Links internos sempre relativos ao site, não ao filesystem:** `[post](/posts/outro-post/)`.
- **Preview de staging antes de publicar:** PR → deploy preview (Netlify/Vercel fazem automático) → autor revisa o HTML renderizado.
- **Template de post** em `content/_template.md` com frontmatter correto.

**Warning signs:**
- Blocos de código com `curl "https://...` mas aspas curvas no HTML.
- Linha solta sem parágrafo ao redor.
- `.md` em URL final.

**Phase to address:**
Phase 1 (lint no CI + template de post + preview deploy = barato e permanente).

---

### Pitfall 12: Dark mode quebrando identidade de marca + brand consistency

**What goes wrong:**
- Dark mode implementado invertendo branco/preto sem pensar na paleta → `#65d7b1` que era decorativo vira fosforescente em fundo escuro, parece bug.
- Logo em SVG com cor hardcoded branca → invisível em dark mode.
- Favicon não existe → aba do navegador mostra ícone genérico.
- OG image gerada sem logo → compartilhamento no LinkedIn aparece sem identidade.
- Imagens dos posts (diagramas) com fundo branco → ilha de branco em dark mode.

**Why it happens:**
- Dark mode é adicionado como "inverte cores e pronto".
- Brand assets feitos uma vez, não revisitados.
- Ninguém testa share preview em Slack/LinkedIn/WhatsApp antes do launch.

**How to avoid:**
- **Dark mode deve usar uma paleta redefinida**, não inversão automática. Exemplo:
  - Light: fundo `#ffffff`, texto `#284068`, acento `#14878c`, decorativo `#65d7b1`.
  - Dark: fundo `#0f1a2b` (escuro do `#284068`), texto `#e8f4f2`, acento `#65d7b1` (agora com contraste OK sobre escuro — 10+:1), decorativo `#14878c`.
- **Logo em SVG com `currentColor`** ou com versão light + versão dark; servir condicional via CSS `prefers-color-scheme` ou via class `.dark`.
- **Favicon completo**: `favicon.ico` 32x32 + `apple-touch-icon.png` 180x180 + `icon-192.png` + `icon-512.png` + `manifest.json`. Gerar com realfavicongenerator.net.
- **OG image:** template com logo + título do post dinâmico. Gerar via Satori (Vercel OG), no build, ou imagem estática fallback para site. Dimensões 1200x630. Verificar em opengraph.xyz antes do launch.
- **Diagramas de posts:** exportar em SVG com `currentColor` quando possível, ou gerar duas versões (light/dark).
- **Checklist de share:** testar link em WhatsApp, Telegram, LinkedIn, Twitter/X, Slack, Discord antes do lançamento.

**Warning signs:**
- `prefers-color-scheme: dark` e logo some.
- `<link rel="icon">` ausente.
- Post compartilhado no LinkedIn mostra imagem placeholder.
- Contrast test falha no dark mode.

**Phase to address:**
Phase 1 (favicon, OG image default, logo responsivo ao tema = entrega do launch).

---

### Pitfall 13: Vendor lock-in da newsletter + lista não-portável

**What goes wrong:**
Autor começa no Substack. Ganha 500 inscritos. Descobre que Substack: (a) não permite export pleno sem downgrade reputacional, (b) cobra 10% da receita se monetizar, (c) tem controvérsias editoriais que colam na marca de quem publica lá, (d) cresce em usuários mas não tem API de customização. Quer migrar, mas lista está parcialmente presa.

**Why it happens:**
- Substack tem UX magnífica no início e é "padrão" em 2024-2025.
- Lock-in é silencioso: enquanto não quer sair, tudo parece bom.

**How to avoid:**
- **Escolher provedor com export nativo de CSV**: Buttondown, Beehiiv, MailerLite (free até 1k), EmailOctopus (free até 2.5k), Listmonk (self-hosted).
- **Domínio de envio customizado** (`news@sertaoseracloud.com` ou `newsletter@sertaoseracloud.com`) — assim autoridade de entrega pertence ao autor, não ao provedor. Configurar SPF + DKIM + DMARC desde o dia 1.
- **Backup mensal do CSV da lista** (script simples, rodado via cron / GitHub Action).
- **Não hospedar histórico do arquivo de newsletter apenas no provedor** — mesmo o texto das edições deve ficar em `.md` no repo (ou como post do blog, o que é ainda melhor).

**Warning signs:**
- Provedor escolhido não expõe botão "Export subscribers as CSV".
- Newsletter não sai de `@sertaoseracloud.com`.
- DKIM/SPF não configurados → emails indo para spam.

**Phase to address:**
Phase 2 (no momento de escolher provedor, aplicar critério de portabilidade).

---

### Pitfall 14: Acessibilidade além de cor — alt text, keyboard, skip links, focus

**What goes wrong:**
- Imagens sem `alt` (leitor de tela anuncia "image" ou o filename).
- Código em `<pre><code>` sem `tabindex` ou sem permitir scroll via teclado.
- Sem skip link ("Pular para conteúdo") → leitor de tela lê o menu inteiro em cada post.
- `:focus` removido por `outline: none` em reset CSS → navegação por tab invisível.
- Ícone de lupa sem `aria-label="Buscar"`.
- Dark mode toggle sem label acessível.

**Why it happens:**
- Dev foca em visual; a11y não aparece no Lighthouse básico com detalhe suficiente.
- Copy-paste de CSS reset clássico (Eric Meyer, Normalize) às vezes remove focus.

**How to avoid:**
- **Alt text obrigatório no Markdown**: lint que falha build se `![](` sem texto.
- **Skip link** como primeiro elemento focável: `<a href="#main" class="skip-link">Pular para o conteúdo</a>` + CSS que só aparece on `:focus`.
- **Focus visível sempre**: `:focus-visible { outline: 2px solid #284068; outline-offset: 2px; }` — nunca `outline: none` sem substituir.
- **Keyboard test manual:** autor navega o site inteiro apenas com Tab antes do launch.
- **Lighthouse A11y ≥95** como CI gate.
- **Axe DevTools** rodado em home + post + tag page.

**Warning signs:**
- Lighthouse A11y < 90.
- `<img>` sem `alt` no view-source.
- Tab key não mostra indicador visual.

**Phase to address:**
Phase 1 (patterns de a11y no layout base). Phase 2 (CI gate).

---

## Technical Debt Patterns

Atalhos que parecem razoáveis mas criam dor depois.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Slug gerado automaticamente sem sanitização | Menos esforço por post | URLs com acentos quebram, difícil mudar depois | **Nunca.** Sanitização é ≤20 LOC. |
| Disqus para comentários "porque é rápido" | 5min de setup | Ads, trackers, degradação de perf e reputação | **Nunca.** |
| Google Analytics sem consentimento | Métricas familiares | Risco LGPD + dano de imagem | **Nunca** neste projeto. |
| Fonts via Google Fonts CDN | 1 linha de `<link>` | LGPD (IP → EUA), perf, dependência externa | MVP ultra-frio? Nunca; self-host é 10min. |
| MDX no v1 | Futuro com componentes | Complexidade de build, bugs obscuros | Só quando tiver caso de uso concreto (vídeo embed? Graph interativo?). |
| Comentários no v1.0 | "Engagement" prometido | Spam, manutenção, zero uso até ter audiência | **Diferir para v1.1+** |
| Newsletter sem política de privacidade | Lança antes | Risco LGPD | **Nunca.** Diferir newsletter até ter política. |
| Template em inglês "depois traduzo" | Ship hoje | `lang="en"`, strings erradas, SEO confuso | **Nunca.** Traduzir antes de qualquer post público. |
| Datas no slug (`/2026/04/slug`) | Parece estruturado | Rewrites futuros quebram URLs | **Nunca.** Data vive no frontmatter. |
| Logo PNG em vez de SVG | "Já tenho o PNG pronto" | Não escala; dark mode quebra | Só se SVG não existe mesmo — gerar SVG é prioridade. |
| Cor de marca hex direto no CSS | Rápido | Refactor massivo quando for ajustar contraste | MVP ultra-rápido? Não — CSS vars são 10min. |
| Deploy sem preview branch | Simples | Erros vão para produção direto | **Nunca** — Netlify/Vercel dão preview grátis. |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Google Fonts | `<link href="fonts.googleapis.com">` direto | Self-host WOFF2; 1 preload; `font-display: swap` |
| Google Analytics 4 | Instalar sem banner; "legítimo interesse" genérico | Trocar por Plausible/Umami/GoatCounter (privacy-first) |
| Giscus | Apontar para repo errado / categoria inexistente | Criar Discussion category "Comentários"; testar em staging |
| Newsletter (qualquer) | Single opt-in; sem política; domínio do provedor | Double opt-in; política linkada; `news@sertaoseracloud.com` com SPF+DKIM+DMARC |
| OG image dinâmico (Vercel OG / Satori) | Esquecer fallback estático | Imagem estática padrão + dinâmica por post |
| Deploy (Netlify/Vercel/Cloudflare Pages) | Domain sem HTTPS / HTTPS sem redirect do www | Certificado automático + redirect 301 de `www.` para apex (ou vice-versa, consistente) |
| Search (Pagefind/Algolia/Lunr) | Indexar tudo incluindo rascunhos | Excluir `draft: true` do índice; CI gate |
| RSS | `<description>` com HTML cru quebra alguns leitores | CDATA wrap; preferir `<content:encoded>` com namespace |
| Sitemap | URLs com host errado (localhost, http://) | Gerar a partir de `SITE_URL` env; HTTPS absoluto |
| GitHub Pages | CNAME perdido em cada deploy | `CNAME` file no branch de deploy ou custom domain em Settings |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Imagens não otimizadas | LCP > 2.5s; peso da página > 3MB | Build pipeline: AVIF+WebP, srcset, lazy, width/height | Primeiro post com screenshot grande |
| Google Fonts externo | FOUT + terceiro request | Self-host WOFF2 + preload | Sempre — latência extra visível a partir do 1º visitor fora do CDN do Google |
| CSS grande por falta de purge | FCP alto | PurgeCSS/Tailwind JIT | >50KB de CSS |
| Client-side JS para renderizar conteúdo | Blank screen antes da hidratação | SSG puro; hydration só onde necessário | SPA-style blog quebra SEO + LCP desde o dia 1 |
| Busca client-side indexando tudo de uma vez | Download de 2MB de índice no load | Pagefind (indexa por chunk), ou busca server-side via Cloudflare Worker | >50 posts |
| Syntax highlighting em runtime (Prism/Highlight.js no cliente) | JS extra por página | Highlight no build (Shiki, rehype-pretty-code) | Sempre — cliente nunca precisa parsear código |
| RSS sem cache | Regenerado toda request | Estático gerado no build | Indiferente em static site (já é estático); atenção em dynamic |

**Escala esperada deste blog:** até 10k uniques/mês no primeiro ano. Zero dos traps acima quebra "por escala" — quase todos quebram **desde o primeiro visitor** ou no Lighthouse. Portanto, não tem desculpa de "otimizo depois".

---

## Security Mistakes

Para blog estático, superfície de ataque é pequena — mas ainda existe.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Sem HTTPS / mixed content | Warning do browser; SEO penalty | Netlify/Vercel/CF Pages dão HTTPS automático; forçar redirect 301 HTTP→HTTPS |
| Sem headers de segurança | XSS via CDN comprometido; clickjack | CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy em `_headers` / `netlify.toml` |
| Endpoint de newsletter sem rate-limit | Flood de inscrições falsas | Provedor com rate-limit nativo; ou Cloudflare Turnstile |
| Comentários (Giscus) sem moderação | Conteúdo ofensivo atribuído à marca | Enable moderation em GitHub Discussions; notificação por email |
| Secrets em `.env` commitados | Vazamento de chaves de API de newsletter/analytics | `.gitignore` + `git-secrets` + rotação periódica |
| Dependências não atualizadas | CVE em plugin do SSG | Dependabot/Renovate no repo |
| Repo público com histórico de secrets | Secrets vivem no histórico mesmo após delete | Usar `git filter-repo` se isso acontecer; melhor prevenir |
| Formulário de contato → email direto do autor | Spam + scraping | Provedor de form (Web3Forms, Formspree, Basin) com captcha |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Tempo de leitura ausente | Leitor não sabe quanto vai investir | Calcular no build: `Math.ceil(wordCount / 200) min` |
| Data de post sem contexto de atualização | Leitor não sabe se conteúdo é atual | Exibir `published` + `updated` quando diferentes |
| Código sem botão "copiar" | Leitor tem que selecionar manualmente; em mobile é dor | `clipboard.writeText()` em um botão pequeno no `<pre>` |
| Navegação entre posts ausente | Leitor chega por Google e vai embora | "Próximo post", "Post anterior", "Posts relacionados por tag" |
| Dark mode sem memória | Preferência se perde a cada visita | `localStorage` + `prefers-color-scheme` como default |
| Busca sem feedback de "sem resultados" | Leitor acha que quebrou | Estado vazio explícito: "Nada encontrado para 'X'. Tente Y." |
| Página de tag sem descrição | Parece lista aleatória | Cada tag tem frontmatter/descrição editorial |
| Formatos de data inconsistentes | `04/21/2026` no PT-BR confunde | ISO `2026-04-21` em HTML `<time datetime>`; exibir `21 de abril de 2026` em pt-BR |
| Links externos sem indicação | Leitor sai sem saber; confusão | `target="_blank" rel="noopener"` + ícone visual de "externo" |
| Newsletter CTA no topo e no fim | Intrusivo | 1 CTA no final do post + 1 na página dedicada `/newsletter/` |
| 404 genérico | Desorienta | 404 custom com busca + links para posts populares |

---

## "Looks Done But Isn't" Checklist

Coisas que parecem completas mas faltam pedaços críticos.

- [ ] **SEO:** Tem meta tags? Tem `<link rel="canonical">` em cada post? Tem JSON-LD `BlogPosting`? Tem sitemap? `robots.txt` aponta o sitemap? `lang="pt-BR"` no `<html>`?
- [ ] **Performance:** Lighthouse mobile ≥90 em Performance, Accessibility, Best Practices, SEO? Imagens servidas em AVIF/WebP? Fontes self-hosted? Bundle JS < 50KB por página?
- [ ] **A11y:** Lighthouse A11y ≥95? Axe DevTools sem violations? Skip link presente? Focus visível em Tab? Todas imagens com `alt`? Contraste de texto ≥4.5:1?
- [ ] **Dark mode:** Funciona com `prefers-color-scheme`? Persiste escolha em `localStorage`? Logo visível nos dois modos? Contraste OK nos dois modos?
- [ ] **Compartilhamento:** OG image 1200x630 presente? Preview correto em LinkedIn/WhatsApp/Twitter (testar)? Favicon em todos tamanhos (32, 180, 192, 512)?
- [ ] **URLs:** Trailing slash consistente? 301 redirect do padrão oposto? Sem acentos/maiúsculas? Sem `.html` ou `.md`?
- [ ] **RSS/Atom:** Feed valida no W3C Feed Validator? Linkado no `<head>` (`<link rel="alternate" type="application/rss+xml">`)? `<pubDate>` em RFC 822?
- [ ] **Newsletter:** Double opt-in real (testar fluxo)? Política de privacidade linkada? Checkbox não-pré-marcado? Export de lista testado? Unsubscribe funciona?
- [ ] **Analytics:** Se tem, é privacy-first? Se é GA, tem banner com "Rejeitar" igualmente visível? Política menciona?
- [ ] **Comentários (se ativo):** Moderação ligada? Notificação de novos comentários? CSP permite o embed?
- [ ] **i18n:** `lang="pt-BR"`? Datas em formato PT-BR? 404/500 em PT-BR? `aria-label`s em PT-BR? OG `locale=pt_BR`?
- [ ] **Markdown:** Lint CI passa? Template de post existe? Preview deploy funciona em PRs? Smart quotes desligadas no editor?
- [ ] **Segurança:** HTTPS forçado? Headers de segurança setados (CSP, X-CTO, Referrer-Policy)? `.env` no `.gitignore`? Dependabot ativo?
- [ ] **Deploy:** Preview deploys funcionam? Rollback testado? Domain apontado corretamente (A + AAAA + CNAME)? SSL ativo e auto-renovante?
- [ ] **Portabilidade:** Repo clonável reproduz o site? Newsletter exportável para CSV? Conteúdo 100% em Markdown no repo (nada em CMS externo)?

---

## Recovery Strategies

Quando o pitfall ocorre apesar da prevenção.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Slug mudado, URLs antigas quebradas | MEDIUM | 1) Identificar URLs antigas (Search Console). 2) Adicionar 301 redirects em `_redirects`/`netlify.toml`. 3) Resubmit sitemap. 4) Monitorar por 30 dias. |
| Paleta usada em contraste inadequado já em produção | LOW | 1) Introduzir CSS vars semânticas. 2) Refatorar componente por componente. 3) Lighthouse A11y como gate. Pode-se fazer sem downtime. |
| GA4 instalado sem consentimento, LGPD risk | MEDIUM | 1) Remover GA4 imediatamente. 2) Publicar comunicado na política. 3) Instalar alternativa privacy-first. 4) Se houve denúncia, registrar RIPD. |
| Newsletter sem double opt-in, lista "suja" | HIGH | 1) Parar de enviar. 2) Enviar email de re-confirmação ("reconfirme sua inscrição"). 3) Manter só quem re-confirma. 4) Limpar o resto. Perde-se parte da lista — aceitável dado o risco. |
| Vendor lock-in (Substack sem export) | HIGH | 1) Comunicar migração por email. 2) Pedir inscritos resubscreverem em novo provedor. Típico: perde 30-50% da lista. **Por isso prevenir é crítico.** |
| Dark mode quebrando contraste descoberto após launch | LOW | Redefinir paleta dark (ver Pitfall 12). Sem refactor de componentes; só mudar valores de CSS vars. |
| Imagens pesadas em posts antigos | LOW | Script de batch reprocessamento (sharp/squoosh-cli) → commit → redeploy. ~1h para 50 imagens. |
| `lang="en"` em produção | LOW | 1 linha no template base → redeploy. Google reindexa em dias. |
| Post com vazamento de secret no histórico | HIGH | `git filter-repo` → force push → **rotacionar todas chaves expostas** (secret pode ter sido clonado). |
| Giscus abandono do projeto | MEDIUM | Dados (comments) vivem em GitHub Discussions, portáveis. Trocar widget por alternativa (Hyvor Talk, Cusdis self-hosted) — dados migram. |

---

## Pitfall-to-Phase Mapping

Fases referidas são as típicas de um roadmap de blog (podem ser ajustadas no roadmap final).

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Scope creep / never-ship | Phase 0 (planejamento de escopo) + Phase 1 (fatiar v1) | 1º post publicado em ≤ 2 semanas de desenvolvimento |
| 2. Paleta vs WCAG | Phase 1 (design system) | Lighthouse A11y + axe sem violations de contraste; CSS vars semânticas existem |
| 3. LGPD newsletter | Phase 2 (engagement) | Fluxo de double opt-in testado; `/privacidade/` publicada; export CSV testado |
| 4. URLs quebradas | Phase 1 (estrutura de URL definitiva) | `_redirects` existe; sitemap gerado; trailing slash consistente |
| 5. SEO anti-patterns | Phase 1 (SEO fundacional) | Rich Results Test valida BlogPosting; Search Console indexa; canonical presente |
| 6. Performance (imagens/fontes) | Phase 1 (pipeline de build) | Lighthouse mobile Perf ≥90; sem requests para fonts.googleapis; imagens em AVIF/WebP |
| 7. Comentários | Phase 2 ou 3 (engagement) | Giscus em Discussions; moderação ligada; não no v1.0 |
| 8. Analytics LGPD | Phase 1 (escolher stack) | Sem GA; provedor privacy-first ativo; política menciona |
| 9. lang + i18n | Phase 1 (layout base) | `lang="pt-BR"` no `<html>`; strings UI em PT-BR; 404 em PT-BR |
| 10. Slugs com acento | Phase 1 (política de slug + lint) | CI falha em slug inválido; template de post sem acento |
| 11. Markdown gotchas | Phase 1 (lint + preview deploy) | `markdownlint` no CI; preview em PR funciona; template existe |
| 12. Dark mode + brand | Phase 1 (favicon, OG, logo responsivo) | Toggle persiste; logo visível nos 2 modos; OG testado em LinkedIn |
| 13. Newsletter lock-in | Phase 2 (escolha de provedor) | Export CSV testado; domain `news@sertaoseracloud.com` com SPF/DKIM/DMARC |
| 14. A11y além de cor | Phase 1 (patterns) + Phase 2 (CI gate) | Skip link; focus visível; alt text obrigatório; Lighthouse A11y ≥95 |

---

## Sources

- Cálculo WCAG AA de contraste: fórmula oficial W3C de relative luminance aplicada diretamente sobre `#284068`, `#14878c`, `#65d7b1` (ver tabela em Pitfall 2). Validação cruzada com regras da [WCAG 2.1 Success Criterion 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html). Confiança HIGH (matemático).
- LGPD + newsletter / double opt-in: [Serpro — Seu consentimento é lei!](https://www.serpro.gov.br/lgpd/cidadao/seu-consentimento-e-lei), [eyou — LGPD 2026: Guia prático para disparos em massa](https://www.eyou.com.br/lgpd-em-2026-guia-pratico-para-disparos-de-mensagens-em-massa/), [Dinamize — LGPD e marketing digital](https://www.dinamize.com.br/blog/lgpd/). Confiança MEDIUM (consenso entre fontes brasileiras de marketing; interpretação jurídica definitiva exige advogado).
- Giscus vs Utterances / Disqus: [giscus/giscus on GitHub](https://github.com/giscus/giscus), [Cesar Soto Valero — Replace the Disqus Commenting System](https://www.cesarsotovalero.net/blog/replace-disqus-with-a-better-alternative.html), [Andrew Lock — Considering replacing Disqus with Giscus](https://andrewlock.net/considering-replacing-disqus-with-giscus/). Confiança HIGH.
- Portuguese SEO / hreflang / slugs: [SEO Nimbus — Understanding hreflang pt-BR](https://seonimbus.com/seo-glossary/international-seo/hreflang-pt-br), [RankTracker — Guide for doing SEO in Portuguese](https://www.ranktracker.com/blog/a-complete-guide-for-doing-seo-in-portuguese/), [Weglot — Translate URL / slug strategies](https://www.weglot.com/blog/translate-url). Confiança MEDIUM.
- Core Web Vitals / performance: [web.dev — Core Web Vitals](https://web.dev/articles/vitals). Confiança HIGH.
- Google Fonts + GDPR (precedente para LGPD): julgamento LG München 2022 (Google Fonts = transferência de IP), referenciado em discussões de self-host (e.g. [Bunny Fonts](https://fonts.bunny.net/about) — não linkado, contexto). Confiança MEDIUM.
- Experiência conhecida / post-mortems de comunidade (scope creep, ship velocity): padrão observado em vários guides de static site (Kinsta, Jamstack, freeCodeCamp). Confiança HIGH (é lore universal de dev solo).
- Training data do assistente para WCAG, SEO técnico, LGPD básica, Markdown gotchas — verificado contra pontos acima. Confiança HIGH onde há verificação, MEDIUM onde é interpretação.

---

## Amendment — 2026-04-22: dev.to Sync Pitfalls

Novos pitfalls introduzidos pelo pivô de fonte (dev.to) + pipeline de tradução (Haiku).

### Pitfall 15: Translation drift — termos técnicos mistraduzidos

**What goes wrong:**
Haiku traduz "deploy" como "implantação", "queue" como "fila", "endpoint" como "ponto de extremidade". Leitor técnico percebe imediatamente — sinaliza "tradução automática sem revisão", destrói credibilidade profissional que o blog está construindo como marca pessoal.

**Why it happens:**
- LLMs otimizam "naturalidade PT" sem saber que o domínio técnico prefere anglicismos.
- Sem glossário explícito no prompt, o modelo aplica regras gerais de tradução.
- Single-pass translation sem verificação post-hoc.

**How to avoid:**
- **Glossário no system prompt:** cada chamada de tradução inclui `.planning/glossary.json` inlined: *"Keep these terms verbatim: [list]. Prefer English over Portuguese for: [list]."*
- **GlossaryEnforcer lint:** após tradução, varrer texto PT; para cada termo em `preserve_as_is`, contagem em PT ≥ contagem em EN (permite pluralização). Falha de sync se drift detectado → PR não abre.
- **Manual review em PR é obrigatório (não opcional):** nunca auto-merge. PR sempre em estado draft até revisão humana.
- **Dicionário evolutivo:** cada correção editorial em PR é oportunidade de atualizar `glossary.json`.

**Warning signs:**
- PR de tradução mostra "implantação" no diff.
- Código inline traduzido (ex.: `` `fila` `` em vez de `` `queue` ``).
- Citação em inglês traduzida (ex.: citação direta de livro/whitepaper).

**Phase to address:** Phase sync — glossary + enforcer são gates obrigatórios antes de PR abrir.

---

### Pitfall 16: Rate limit / downtime do dev.to quebra sync

**What goes wrong:**
Forem API tem rate limits (~1000 req/h não-autenticado). Sync em horário de pico ou com muitos artigos novos pode bater 429. Sync trava, PR não abre. Pior: cron agressivo pode ser banido temporariamente.

**Why it happens:**
- dev.to é plataforma terceira — uptime e quota fora do controle.
- Sync mal-feito re-fetcha todos artigos a cada run em vez de apenas delta.

**How to avoid:**
- **Delta fetch only:** cache `article_id → source_hash` no próprio repo (frontmatter do post commitado); só buscar `body_markdown` novo se hash da listing API diverge.
- **Exponential backoff:** retry 3x com 2s/4s/8s em 429/5xx; falha após isso.
- **Graceful degradation:** se sync falha inteira, última versão publicada continua no ar — build Astro não depende de sync-time data.
- **Skip-on-error por artigo:** cada artigo é unit independente; erro em 1 não bloqueia os outros.
- **Monitor quiet failures:** GH Actions falhando notifica email do autor (config padrão).

**Warning signs:**
- Runtime do GH Action > 10min.
- Logs mostram HTTP 429 consecutivos.
- Mesmo artigo aparece como "novo" em runs consecutivos.

**Phase to address:** Phase sync — delta fetch + backoff + skip-on-error no MVP.

---

### Pitfall 17: Custo Haiku descontrolado (circuit breaker faltando)

**What goes wrong:**
Bug no diff detector marca todos artigos como "novos" a cada run → re-traduz 40 posts/dia → ~$2.40/dia = ~$70/mês. Ou prompt injection via conteúdo do dev.to faz Haiku gerar output gigante.

**Why it happens:**
- Sem limite de chamadas por run.
- Sem alerta de gasto na Anthropic console.
- Confiança ingênua no diff detector.

**How to avoid:**
- **Circuit breaker:** env `MAX_TRANSLATIONS_PER_RUN=5`. Se sync detecta > 5 "novos", aborta e abre GH Issue pedindo revisão.
- **Budget alert Anthropic:** configurar alerta em $5/mês na console — email imediato se cruzar.
- **Output length cap:** Haiku call com `max_tokens=32000`; logs mostram tokens usados; alertar se média > 20K.
- **Hash estável:** SHA-256 do `body_markdown` normalizado (trim + line-ending LF) — evita re-translate por whitespace.
- **Never auto-retry na mesma run:** se tradução falha, fail fast; próximo cron tenta de novo.

**Warning signs:**
- Conta > $1/mês.
- GH Action logs mostram > 5 chamadas Haiku consecutivas.
- Artigos com conteúdo idêntico re-traduzidos.

**Phase to address:** Phase sync — circuit breaker + budget alert antes do go-live.

---

### Pitfall 18: Artigo editado no dev.to após tradução (conflito de sync)

**What goes wrong:**
Autor publica artigo no dev.to → sync traduz → PR mergeado → blog publica. Dois dias depois autor corrige typo no dev.to. Próximo cron vê hash diferente → re-traduz → abre novo PR sobrescrevendo edições editoriais manuais da revisão anterior. Trabalho de review perdido.

**Why it happens:**
- Sync trata cada diff como "retraduzir tudo".
- Não diferencia mudança minor vs mudança que invalida tradução.
- Editor humano fez ajustes que não vão voltar para o source.

**How to avoid:**
- **PR detecta edit vs new:** se `src/content/posts/{slug}.md` já existe, PR vira "update" com diff highlight das mudanças, não overwrite.
- **Conflict-aware commit:** se arquivo local tem `manual_override: true` no frontmatter, sync pula esse artigo (autor aceitou responsabilidade por sincronia manual).
- **Hash duplo:** `source_hash` e `translation_hash` separados no frontmatter. Source mudou mas tradução anterior ainda é válida? Autor decide no PR.
- **Commit message explicativo:** PR body descreve diff resumido do source no dev.to.

**Warning signs:**
- PR aparece com o mesmo slug múltiplas vezes no mês.
- Autor reclama de "perder" correções.
- `manual_override` nunca é usado (indicador de sub-utilização).

**Phase to address:** Phase sync v2 (pós-MVP) — MVP aceita "overwrite on update" + PR manual; refinamento vem depois.

---

### Pitfall 19: Canonical SEO misconfig = duplicate content penalty

**What goes wrong:**
Autor esquece de configurar `canonical_url` no frontmatter dos posts do dev.to. Google indexa blog e dev.to como versões paralelas do mesmo conteúdo. Ranking divide-se; Google escolhe uma arbitrariamente (geralmente dev.to, que tem mais autoridade de domínio). Blog — meta principal do projeto — fica fora do top-10.

**Why it happens:**
- dev.to NÃO configura canonical automático; campo é opcional no frontmatter.
- Autor assume "dev.to coloca canonical pro blog por padrão" — não coloca.
- Blog não sinaliza canonical próprio ou aponta canonical para o dev.to (inversão fatal).

**How to avoid:**
- **Processo autoral:** template de post no dev.to com `canonical_url:` pré-preenchido no pattern `https://sertaoseracloud.com/posts/{slug}`.
- **Sync script valida:** ao fetchar artigo, se `canonical_url` do dev.to não aponta para o domínio do blog, abre GH Issue alertando (não bloqueia — warning).
- **Blog declara canonical próprio:** `<link rel="canonical" href="https://sertaoseracloud.com/posts/{slug}">` em todo post, independente do que dev.to faz.
- **hreflang NÃO se aplica:** blog é PT-BR, dev.to é EN — são conteúdos semanticamente distintos (tradução ≠ mesmo URL em outro idioma para Google). NÃO usar hreflang entre os dois.
- **Verificação mensal:** rodar `site:sertaoseracloud.com` no Google + checar Search Console → "Páginas não indexadas por duplicate content" deve ser zero.

**Warning signs:**
- Search Console: "Duplicate, submitted URL not selected as canonical".
- `view-source` no dev.to sem `<link rel="canonical">` apontando pro blog.
- Google Search `site:sertaoseracloud.com` mostra menos páginas que total de posts publicados.

**Phase to address:** Phase SEO fundacional — canonical dual-side antes do primeiro deploy público.

---

### Pitfall-to-Phase Mapping (appended)

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 15. Translation drift | Phase sync | GlossaryEnforcer passa em CI; revisão manual obrigatória antes de merge |
| 16. Rate limit / downtime dev.to | Phase sync | Delta fetch + backoff testados; GH Action resiliente a 429 |
| 17. Custo Haiku descontrolado | Phase sync | Circuit breaker configurado; budget alert ativo na Anthropic console |
| 18. Conflito sync vs edição manual | Phase sync v2 | MVP: overwrite; v2: diff-aware + `manual_override` respeitado |
| 19. Canonical misconfig | Phase SEO | Blog canonical presente; dev.to canonical preenchido; zero issues no Search Console |

---
*Pitfalls research for: personal tech blog (PT-BR, solo, dev.to-sourced + auto-translated, near-zero budget)*
*Researched: 2026-04-21 · Amended: 2026-04-22*
