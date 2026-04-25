---
name: sync-devto.native
description: "Simula o pipeline sync-devto usando apenas ferramentas nativas do CLI (WebFetch, Read, Write, Bash). Tradução usa o modelo que o CLI estiver usando no momento. PR é manual."
---

# Sync‑devto (via ferramentas nativas)

Reproduz o comportamento de `scripts/sync-devto.ts` usando **apenas** ferramentas nativas disponíveis no CLI:

- `WebFetch` – busca artigos no dev.to
- `Read` – lê arquivos existentes
- `Write` – cria/atualiza posts
- `Bash` – git add, commit, push, sha256sum
- **Modelo do CLI** – traduz o markdown (usa qualquer modelo que o CLI estiver usando no momento, sem depender de env vars ou API externa)

## Passo a passo

1. **Listar artigos**
   ```
   WebFetch: https://dev.to/api/articles?username=sertaoseracloud&per_page=100
   ```
   Extraia a lista de artigos (id, slug, title, description, tags, url, canonical_url, cover_image).

2. **Para cada artigo** (até `MAX_TRANSLATIONS_PER_RUN`, padrão 5):

   a. **Buscar artigo completo**
      ```
      WebFetch: https://dev.to/api/articles/{id}
      ```
      Obtenha o `body_markdown`.

   b. **Calcular hash SHA‑256**
      ```bash
      printf "%s" "$body_markdown" | sha256sum | awk '{print $1}'
      ```

   c. **Verificar se precisa processar**
      - `Read` em `src/content/posts/{slug}.md` (se existir)
      - Comparar o hash armazenado (campo `source.hash`) com o novo hash
      - Verificar se `manual_override: true`
      - Se `manual_override` ou hash igual → **SKIP**

   d. **Traduzir markdown**
      Envie o `body_markdown` para o modelo do CLI com o prompt:
      > "Traduza o markdown abaixo para PT‑BR, preservando cabeçalhos H2/H3 e respeitando o glossário em `.planning/glossary.json`. Retorne apenas o markdown traduzido."
      > ```
      > {body_markdown}
      > ```

   e. **Verificar glossário**
      Com o modelo, conte ocorrências dos termos `preserve_as_is` (`.planning/glossary.json`) no original vs tradução.
      Se houver deriva: `Write` em `tmp/glossary-drift-{slug}.md` com descrição da issue.

   f. **Checar canonical_url**
      Se ausente no artigo: `Write` em `tmp/canonical-{slug}.md` com aviso.

   g. **Montar front‑matter** (seguindo `src/content.config.ts`)
      ```yaml
      ---
      title: "..."
      description: "..."
      pubDate: "YYYY-MM-DD"
      draft: false
      tags: ["tag1", "tag2"]
      source:
        platform: dev.to
        id: N
        url: "https://dev.to/..."
        hash: "sha256..."
        synced_at: "YYYY-MM-DD"
        translated_by: "cli-model"
      canonical_url: "https://sertaoseracloud.com/posts/..."
      manual_override: false
      ---
      ```

   h. **Escrever post**
      `Write` → `src/content/posts/{slug}.md` (front‑matter + corpo traduzido)

   i. **Commit e push**
      ```bash
      git add src/content/posts/{slug}.md
      git commit -m "sync: add/update {slug}"
      git push origin HEAD
      ```

3. **PR manual**
   O usuário abre a PR manualmente após o push (via interface web, `gh pr create` ou comando equivalente no CLI).

## Configuração

| Parâmetro | Obrigatório? | Padrão | Descrição |
|------------|---------------|---------|-------------|
| `MAX_TRANSLATIONS_PER_RUN` | Não | `5` | Limita quantas traduções são feitas por execução |

Não são necessárias variáveis de ambiente para a tradução — o CLI usa seu próprio modelo atual.

## Verificação

```bash
pnpm astro check    # valida front‑matter com Zod schema
pnpm build         # gera o site estático
```

## Como usar

```
! sync-devto.native
```

Ou, para limitar o número de traduções:

```bash
export MAX_TRANSLATIONS_PER_RUN=3
! sync-devto.native
```

---
*Skill genérica compatível com OpenClaude, Claude Code e outras ferramentas que ofereçam as mesmas capacidades nativas.*
