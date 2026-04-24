# Phase 2: Dev.to Sync Pipeline — Research

**Researched:** 2026-04-24
**Domain:** Forem API v1, @anthropic-ai/sdk, peter-evans/create-pull-request@v7, Node.js 22 crypto, TypeScript script execution
**Confidence:** HIGH (all primary claims verified via official docs or npm registry)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Split posts section-by-section on H2/H3 headings. Each section = one Haiku call.
- **D-02:** On re-sync (changed `source.hash`), always create a new PR draft. Do not search/update existing PRs.
- **D-03:** When `manual_override: true`, skip that article entirely. Log skip notice (id + slug + reason).
- **D-04:** PR body must include: Source, Translation stats, Glossary enforcement (PASS/WARN), Canonical URL lint.
- **D-05:** PR is draft + assigns `sertaoseracloud` as reviewer.
- **D-06:** Missing/wrong canonical_url → open GitHub Issue (non-blocking) AND still create PR draft.
- **D-07:** Canonical URL passes if `canonical_url` starts with `https://sertaoseracloud.com/posts/`. Exact slug match NOT required.
- **D-08:** `MAX_TRANSLATIONS_PER_RUN=5` circuit breaker.
- **D-09:** Hard fail individual article (no PR) if glossary drift detected; open GitHub Issue. Other articles in same run continue.

### Claude's Discretion

- Exact retry logic for Haiku API errors (3x with exponential backoff is standard)
- Temp file handling during section-by-section assembly
- Exact GitHub Issue body format for canonical lint warnings and glossary failures
- Cover image filename convention (`{slug}.{ext}` is sensible default)
- Whether to use `p-limit` or native `Promise.all` for concurrent section translations
- Exact PR title format (e.g., `[sync] {article title} (dev.to #{id})`)

### Deferred Ideas (OUT OF SCOPE)

- Script output verbosity flag (`--verbose` / `--quiet`)
- GlossaryEnforcer threshold configuration (hard fail on any drift for now)
- Dry-run mode (`--dry-run`)
- `www.sertaoseracloud.com` canonical handling
</user_constraints>

---

## Summary

Phase 2 builds the sync pipeline that fetches articles from dev.to via the Forem API v1, translates them EN→PT-BR using Claude Haiku 4.5, enforces a technical glossary, and opens PR drafts for editorial review. This is the most complex phase in v1.0 and the core product differentiator.

The pipeline has five logical components: DevToClient (Forem API fetcher), DiffDetector (SHA-256 hash comparator), Translator (Haiku section-by-section), GlossaryEnforcer (term-preservation checker), and PRBuilder (file writer + GitHub PR opener). These are wired together in `scripts/sync-devto.ts` and invoked by both the local `pnpm sync:devto` command and the `.github/workflows/sync-devto.yml` cron workflow.

The two most technically nuanced areas are: (1) the two-step Forem API fetch (listing endpoint does NOT return `body_markdown`; a per-article fetch is required), and (2) the reviewer assignment requirement for `peter-evans/create-pull-request@v7` (needs `pull-requests: write` permission explicitly declared in the workflow, and there is evidence a PAT may be required for the `reviewers` input — this needs a test during implementation).

**Primary recommendation:** Use `tsx` as the TypeScript executor for `scripts/sync-devto.ts`. Add it as a devDependency and wire `sync:devto` to `tsx scripts/sync-devto.ts`. Node 22's native `--experimental-strip-types` is available but still experimental and does not respect `tsconfig.json` — tsx is the safer, faster production choice for scripts.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Forem API fetch (article listing + body) | Script (Node 22) | — | Pure server-side I/O; runs in GH Actions, not in browser or Astro build |
| SHA-256 diff detection | Script (Node 22) | — | Built-in crypto; compares hash in frontmatter vs API response |
| EN→PT-BR translation | Script (Node 22) via Anthropic API | — | Expensive I/O; done once at sync-time, never at build-time or runtime |
| Glossary enforcement | Script (Node 22) | — | Text analysis on translation output; pure Node string ops |
| Markdown file writing | Script (Node 22) | Astro (read-only at build) | PRBuilder writes `src/content/posts/{slug}.md`; Astro reads it at build |
| Cover image download | Script (Node 22) | — | Binary fetch + write to `src/content/posts/images/` |
| PR creation | GitHub Actions (peter-evans action) | — | Runs after script writes files; Action handles git commit + PR open |
| Canonical URL lint | Script (Node 22) | — | Check API field; open GH Issue via GitHub REST API if needed |
| Zod schema validation | Script (Node 22) + Astro (build gate) | — | Script validates frontmatter before committing; Astro re-validates at build |
| Cron scheduling | GitHub Actions | — | `0 3 * * *` cron; local `pnpm sync:devto` for dev runs |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | `^0.91.0` | Claude Haiku 4.5 Messages API | Official Anthropic SDK; built-in 2-retry w/ exponential backoff; typed error classes |
| `tsx` | `^4.21.0` | TypeScript execution for scripts | esbuild-based; ~20ms startup; supports all TS features; respects tsconfig; pnpm-installable |
| Node.js built-in `crypto` | (built-in, Node 22) | SHA-256 hashing | No dep needed: `import { createHash } from 'node:crypto'` |
| Node.js built-in `fetch` | (built-in, Node 18+) | Forem API HTTP calls + image download | Native undici-based fetch; no `node-fetch` needed |
| `peter-evans/create-pull-request` | `@v7` | Open PR drafts from workflow | Idiomático; supports draft, reviewer, body-path, custom branch, commit-message |

[VERIFIED: npm registry] `@anthropic-ai/sdk` latest: `0.91.0`
[VERIFIED: npm registry] `tsx` latest: `4.21.0`
[VERIFIED: official Anthropic docs] `claude-haiku-4-5` alias resolves to `claude-haiku-4-5-20251001`
[VERIFIED: official GitHub] `peter-evans/create-pull-request` is at v7 (README confirms; v8 exists but CONTEXT.md locks v7)

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | (already in Astro deps) | Validate PRBuilder output against schema | Import `src/content.config.ts` schema to validate frontmatter before writing |
| `p-limit` | `^6.0.0` | Concurrency limiter for section translations | Optional — use only if running sections concurrently; sequential is safer for rate limiting |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `tsx` | Node 22 `--experimental-strip-types` | Native is zero-dep but ignores tsconfig, doesn't support enums/decorators, still experimental — tsx wins for scripts |
| `tsx` | `ts-node` | ts-node: full type checking but ~450-500ms startup vs tsx ~20ms; overkill for a script |
| native `fetch` | `axios` / `node-fetch` | No benefit; native fetch is in Node 22; avoid extra dep |
| `peter-evans/create-pull-request@v7` | `gh pr create` CLI | CLI approach works but CONTEXT.md locks the Action; action is more declarative and better for diff detection |

**Installation:**
```bash
pnpm add -D @anthropic-ai/sdk tsx
```

---

## Architecture Patterns

### System Architecture Diagram

```
[cron 0 3 * * * / workflow_dispatch / pnpm sync:devto]
            │
            ▼
  ┌─────────────────────────────────────────────────────┐
  │  scripts/sync-devto.ts                              │
  │                                                     │
  │  DevToClient ──GET /api/articles?username=──────┐   │
  │               (listing: id, slug, hash fields)  │   │
  │               └──per-article GET /api/articles/{id}│   │
  │                  (body_markdown, canonical_url, │   │
  │                   cover_image, tag_list)        │   │
  │                                │               │   │
  │                                ▼               │   │
  │  DiffDetector ──SHA-256(body_markdown)──────────┘   │
  │               compare vs source.hash in *.md        │
  │               skip if same hash                     │
  │               apply MAX_TRANSLATIONS_PER_RUN=5      │
  │                                │                    │
  │                 [new/changed articles only]         │
  │                                │                    │
  │                                ▼                    │
  │  Translator ──split on H2/H3──► [sections]          │
  │              │  for each section:                   │
  │              │    Haiku call (system=glossary.json) │
  │              │    retry 3x / exponential backoff    │
  │              │    assemble translated sections      │
  │                                │                    │
  │                                ▼                    │
  │  GlossaryEnforcer ──count preserve_as_is terms──►   │
  │              count_PT >= count_EN for each term      │
  │              FAIL → open GH Issue, skip PR, continue│
  │              PASS → carry forward                   │
  │                                │                    │
  │                                ▼                    │
  │  Canonical Lint ──check canonical_url field──────►  │
  │              starts with SITE_URL/posts/ ?          │
  │              NO → open GH Issue (non-blocking)      │
  │                                │                    │
  │                                ▼                    │
  │  Cover Image ──fetch(cover_image_url)──────────────► │
  │              write to src/content/posts/images/     │
  │                                │                    │
  │                                ▼                    │
  │  PRBuilder ──write src/content/posts/{slug}.md──►   │
  │              frontmatter satisfies content.config   │
  └─────────────────────────────────────────────────────┘
            │
            ▼
  [peter-evans/create-pull-request@v7]
  branch: sync/{slug}-{timestamp}
  draft: true
  reviewers: sertaoseracloud
  body-path: .github/SYNC_PR_BODY.md
            │
            ▼
  [PR draft visible in GitHub]
  Author reviews → merges → deploy.yml fires → live post
```

### Recommended Project Structure

```
scripts/
└── sync-devto.ts        # entry point; imports all components
src/
└── content/
    └── posts/
        ├── {slug}.md    # written by PRBuilder
        └── images/
            └── {slug}.{ext}  # cover image
.github/
├── workflows/
│   └── sync-devto.yml   # cron + workflow_dispatch
└── SYNC_PR_BODY.md      # PR body template (body-path input)
docs/
└── sync-pipeline.md     # runbook
.planning/
└── glossary.json        # GlossaryEnforcer reads this
```

### Pattern 1: Two-Step Forem API Fetch

**What:** The `GET /api/articles?username=sertaoseracloud` listing endpoint does NOT return `body_markdown`. It must be fetched per-article via `GET /api/articles/{id}`.

**When to use:** Always — DevToClient always does two-step fetch. No exceptions.

```typescript
// Source: https://developers.forem.com/api/v1 (verified 2026-04-24)
// Step 1: List articles (no body_markdown here)
const listRes = await fetch(
  'https://dev.to/api/articles?username=sertaoseracloud&per_page=30',
  { headers: { 'Accept': 'application/vnd.forem.api-v1+json' } }
);
const articles = await listRes.json();
// articles[n]: { id, slug, title, tag_list, cover_image, canonical_url,
//               published_timestamp, description }
// NOTE: body_markdown is NOT present in listing response

// Step 2: Per-article fetch (has body_markdown)
const articleRes = await fetch(
  `https://dev.to/api/articles/${articleId}`,
  { headers: { 'Accept': 'application/vnd.forem.api-v1+json' } }
);
const full = await articleRes.json();
// full: { ...listFields, body_markdown: '...', body_html: '...' }
```

**Important:** Authentication is NOT required for public articles. No API key needed for dev.to username `sertaoseracloud`'s public posts.

### Pattern 2: SHA-256 DiffDetector

**What:** Hash `body_markdown` normalized to detect changes without re-translating unchanged content.

```typescript
// Source: https://nodejs.org/api/crypto.html (built-in, no install)
import { createHash } from 'node:crypto';

function hashMarkdown(body: string): string {
  // Normalize: trim + unify line endings to prevent whitespace-only re-translates
  const normalized = body.trim().replace(/\r\n/g, '\n');
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}
// Compare against source.hash in existing frontmatter
```

### Pattern 3: Translator with Section Chunking (D-01)

**What:** Split on `## Heading` and `### Heading` lines; one Haiku call per section; assemble.

```typescript
// Source: [VERIFIED: official Anthropic docs + SDK README]
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 3, // built-in exponential backoff (2s/4s/8s pattern)
});

function splitSections(markdown: string): string[] {
  // Split on H2/H3 headings, keeping heading with its section
  return markdown.split(/(?=^#{2,3} )/m).filter(s => s.trim());
}

async function translateSection(section: string, glossary: object): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5',       // alias for claude-haiku-4-5-20251001
    max_tokens: 8192,                 // per section; well under 64k limit
    system: buildSystemPrompt(glossary),
    messages: [{ role: 'user', content: section }],
  });
  return (message.content[0] as { text: string }).text;
}
```

**Token budgeting:** Haiku 4.5 has 200k input / 64k output context window. A single blog section (typically 300-1500 words) is well within limits. The system prompt with glossary.json is ~3-4K tokens.

### Pattern 4: GlossaryEnforcer Algorithm (D-09)

**What:** Count occurrences of each `preserve_as_is` term in EN source vs PT-BR output. Fail if any term count drops.

```typescript
// Source: [ASSUMED] — standard string counting approach
import glossary from '.planning/glossary.json';

function countOccurrences(text: string, term: string): number {
  // Case-sensitive match (glossary terms are exact: "AWS", "Lambda", etc.)
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (text.match(new RegExp(escaped, 'g')) ?? []).length;
}

function enforceGlossary(enSource: string, ptOutput: string): {
  passed: boolean;
  driftedTerms: string[];
} {
  const driftedTerms: string[] = [];
  for (const term of glossary.preserve_as_is) {
    const enCount = countOccurrences(enSource, term);
    const ptCount = countOccurrences(ptOutput, term);
    if (enCount > 0 && ptCount < enCount) {
      driftedTerms.push(`${term} (EN: ${enCount}, PT: ${ptCount})`);
    }
  }
  return { passed: driftedTerms.length === 0, driftedTerms };
}
```

**Edge case:** Pluralization — `Lambda` in EN may appear as `Lambdas` in PT (English plural). The algorithm counts exact string occurrences, so `Lambda` would not match `Lambdas`. This is intentional strictness per D-09 (hard fail on any drift).

### Pattern 5: PRBuilder Frontmatter (exact schema match)

**What:** PRBuilder must write frontmatter that satisfies `src/content.config.ts` Zod schema exactly.

```yaml
# Target shape (derived from src/content.config.ts — verified 2026-04-24):
---
title: "Post Title in PT-BR"           # z.string().max(80)
description: "Short description"       # z.string().max(200)
pubDate: 2026-04-24                    # z.coerce.date()
draft: false                           # z.boolean().default(false)
tags: ["cloud", "aws"]                 # z.array(z.string()) — from dev.to tag_list
coverAlt: "Cover image description"    # z.string().optional()
source:
  platform: dev.to                     # z.literal('dev.to')
  id: 12345                            # z.number()
  url: https://dev.to/sertaoseracloud/slug  # z.string().url()
  hash: "sha256hexstring"             # z.string()
  synced_at: 2026-04-24               # z.coerce.date()
  translated_by: claude-haiku-4-5     # z.string()
canonical_url: https://sertaoseracloud.com/posts/slug  # z.string().url().optional()
manual_override: false                 # z.boolean().default(false)
---
```

**Note:** `coverAlt` is `optional()` in schema — PRBuilder should write it only if a cover image exists. If the article has no cover image, omit the `coverAlt` field.

### Pattern 6: peter-evans/create-pull-request@v7 Configuration

**What:** YAML step that creates a draft PR with reviewer and body from file.

```yaml
# Source: https://github.com/peter-evans/create-pull-request (verified 2026-04-24)
- name: Create sync PR
  uses: peter-evans/create-pull-request@v7
  with:
    token: ${{ secrets.GITHUB_TOKEN }}   # see PAT note below
    branch: sync/${{ env.ARTICLE_SLUG }}-${{ github.run_id }}
    commit-message: "sync: translate '${{ env.ARTICLE_TITLE }}' from dev.to"
    title: "[sync] ${{ env.ARTICLE_TITLE }} (dev.to #${{ env.ARTICLE_ID }})"
    body-path: .github/SYNC_PR_BODY.md   # template written by script per-article
    draft: true                          # draft only on create
    reviewers: sertaoseracloud           # individual reviewer (see PAT note)
    labels: sync,translation
    add-paths: |
      src/content/posts/${{ env.ARTICLE_SLUG }}.md
      src/content/posts/images/
```

**PAT note:** The `reviewers` input requires the token to have write access to pull requests. In practice with `GITHUB_TOKEN`, the workflow MUST declare `pull-requests: write` in the permissions block. If reviewer assignment silently fails with `GITHUB_TOKEN`, a PAT with `repo` scope stored as `GH_PAT` secret is the fallback. This should be verified on first run.

### Pattern 7: sync-devto.yml Workflow Structure

**What:** Cron + dispatch workflow that mirrors deploy.yml pnpm setup.

```yaml
# Source: .github/workflows/deploy.yml (existing pattern — copy pnpm/Node steps verbatim)
name: Sync dev.to articles

on:
  schedule:
    - cron: '0 3 * * *'    # 03:00 UTC = 00:00 BRT
  workflow_dispatch:         # manual trigger for testing

permissions:
  contents: write            # write markdown files
  pull-requests: write       # open PR drafts
  issues: write              # open GitHub Issues for canonical lint / glossary drift

jobs:
  sync:
    runs-on: ubuntu-latest
    env:
      MAX_TRANSLATIONS_PER_RUN: 5
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4        # copy from deploy.yml
        with:
          version: 9.15.0

      - uses: actions/setup-node@v4       # copy from deploy.yml
        with:
          node-version: '22'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Run sync
        run: pnpm sync:devto
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          MAX_TRANSLATIONS_PER_RUN: ${{ env.MAX_TRANSLATIONS_PER_RUN }}

      # peter-evans step runs after sync writes files (see Pattern 6 above)
      # The sync script writes per-article PR body to .github/SYNC_PR_BODY.md
      # then invokes peter-evans action (or a wrapper) per article
```

**Design note:** Because the sync script processes multiple articles and each needs its own PR, the most practical approach is: the sync script writes the markdown files + the PR body template, then either (a) calls the peter-evans action once per article via a matrix job, or (b) the script itself uses the GitHub REST API (`GITHUB_TOKEN` + `@octokit/rest`) to create branches + commits + PRs directly. Option (b) avoids matrix complexity and keeps the logic in TypeScript. The planner should decide. Both approaches are valid.

### Pattern 8: Cover Image Download

```typescript
// Source: [ASSUMED] — standard Node.js fetch + Buffer pattern
async function downloadCoverImage(
  url: string,
  slug: string,
  destDir: string
): Promise<string | null> {
  if (!url) return null;
  const ext = url.split('.').pop()?.split('?')[0] ?? 'jpg';
  const res = await fetch(url);
  if (!res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  const filename = `${slug}.${ext}`;
  await fs.writeFile(path.join(destDir, filename), buffer);
  return filename;
}
// Dest: src/content/posts/images/{slug}.{ext}
```

### Anti-Patterns to Avoid

- **Do NOT fetch `body_markdown` from the listing endpoint** — it is absent; always do a per-article fetch.
- **Do NOT translate the entire post in a single Haiku call** — risks context overflow on long posts; D-01 locks section-by-section.
- **Do NOT use `auto-merge`** — ROADMAP explicitly forbids it; PR must stay draft.
- **Do NOT skip the GlossaryEnforcer gate before opening a PR** — D-09 mandates hard fail on drift.
- **Do NOT commit cover images as part of the PR if the image fetch fails** — fail gracefully; write `null` to `coverAlt` if no image.
- **Do NOT rely on `body_markdown` being present in listing** — always two-step.
- **Do NOT use smart quotes in generated markdown** — use straight quotes; Astro/Shiki processes the markdown.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP retry with backoff | Custom retry loop for API calls | `@anthropic-ai/sdk` built-in `maxRetries` | SDK automatically retries 2x on 429/5xx with exponential backoff |
| TypeScript execution in Node | Custom build step (tsc + run) | `tsx` | Zero config, esbuild-based, respects tsconfig |
| SHA-256 hashing | Any npm hash library | `node:crypto` built-in | Available in every Node 22 environment; no install |
| PR creation | `gh pr create` CLI | `peter-evans/create-pull-request@v7` | Handles branch management + commit + PR atomically; CONTEXT.md locked |
| GitHub Issue creation | None | GitHub REST API via `GITHUB_TOKEN` + native fetch | Already available in GH Actions; no extra dep |

---

## Runtime State Inventory

> This phase is greenfield (new files only). No rename/refactor involved.

- **Stored data:** `source.hash` values — these are written by PRBuilder into new markdown files; no pre-existing records to migrate.
- **Live service config:** None — no external service configs to update (dev.to reading is unauthenticated).
- **OS-registered state:** None — no Task Scheduler/cron registered outside GH Actions.
- **Secrets/env vars:** `ANTHROPIC_API_KEY` must be added to repo secrets before first run (authorial action). `GITHUB_TOKEN` provided by GH Actions runtime automatically.
- **Build artifacts:** None — TSX scripts are JIT-transpiled; no compiled output to stale.

---

## Common Pitfalls

### Pitfall A: `body_markdown` missing from listing response

**What goes wrong:** Script uses listing-API response directly. `body_markdown` is `undefined`. SHA-256 hashes to a constant. All articles appear "new" every run → circuit breaker fires.

**Why it happens:** Dev.to API v1 listing endpoint (`/api/articles?username=...`) does NOT include `body_markdown`. Only per-article endpoint (`/api/articles/{id}`) returns it. [VERIFIED: developers.forem.com]

**How to avoid:** Always two-step: list → per-article fetch. Never read `body_markdown` from the listing response.

**Warning signs:** `body_markdown` is `undefined` in first run logs; circuit breaker fires on first run.

### Pitfall B: Reviewer assignment failing silently with GITHUB_TOKEN

**What goes wrong:** PR is created but no reviewer is assigned. Author never gets a review-request notification. The whole editorial workflow depends on the notification.

**Why it happens:** `GITHUB_TOKEN` may lack sufficient write permissions for the `reviewers` input. The peter-evans action documentation notes write access to the repo is required for `reviewers`. [VERIFIED: github.com/peter-evans/create-pull-request concepts-guidelines]

**How to avoid:** Explicitly declare `pull-requests: write` in the workflow permissions block. If reviewer assignment still fails with `GITHUB_TOKEN`, create a `GH_PAT` secret (Fine-grained PAT with `contents: write` + `pull-requests: write`) and use it as the action token. Test reviewer assignment on first sync run before assuming it works.

**Warning signs:** PR created but reviewer list is empty; no email notification received.

### Pitfall C: Hash collision from whitespace differences

**What goes wrong:** Author corrects a trailing space on dev.to. Hash changes. Article is re-translated. $0.06 wasted per occurrence.

**Why it happens:** Raw `body_markdown` differs in whitespace between fetches (or between dev.to editor saves).

**How to avoid:** Normalize before hashing: `body.trim().replace(/\r\n/g, '\n')`. [ASSUMED — standard text normalization practice]

### Pitfall D: Glossary drift on plurals and hyphenated forms

**What goes wrong:** `Lambda` in EN becomes `Lambdas` in PT context. GlossaryEnforcer counts exact `Lambda` occurrences. Count drops → hard fail → no PR opened. Author must investigate.

**Why it happens:** GlossaryEnforcer uses exact string matching. Pluralized/hyphenated terms have a different character sequence.

**How to avoid:** This is an accepted trade-off per D-09 (hard fail on any drift). Document in runbook that exact pluralization edge cases will require glossary updates (add `Lambdas` as a separate `preserve_as_is` entry if it becomes a recurring false positive).

### Pitfall E: Multiple PRs opened for the same slug (D-02 implementation)

**What goes wrong:** Re-sync opens second PR for same article. If PRs accumulate without being closed, the repo fills with stale sync PRs.

**Why it happens:** D-02 says "always new PR draft on re-sync" without searching for existing open PRs. This is intentional behavior, not a bug.

**How to avoid:** Per D-02, this is the intended behavior. Document in runbook that the author must close old sync PRs manually. Include the dev.to `id` in the PR title (`dev.to #12345`) so stale PRs are identifiable and filterable.

### Pitfall F: Script invoked via `pnpm sync:devto` writes files but no PR is created

**What goes wrong:** Local runs write markdown files but `peter-evans/create-pull-request` is a GitHub Actions step — it cannot run locally.

**Why it happens:** The PR creation step is in the GH Actions workflow, not the script itself.

**How to avoid:** Design `scripts/sync-devto.ts` to write the markdown files and exit with a summary. The GitHub Actions workflow handles the PR step. Local runs are valid for testing translation output without opening PRs. Document this in runbook: local runs = file output only; PRs only open via GH Actions.

**Alternative:** If the planner decides PRBuilder should create PRs directly via the GitHub REST API (rather than via the peter-evans Action), local runs could also open PRs with `GITHUB_TOKEN` injected via `.env`. Either approach is valid.

---

## Code Examples

### SHA-256 hash (built-in, no external dep)

```typescript
// Source: https://nodejs.org/api/crypto.html [VERIFIED]
import { createHash } from 'node:crypto';

function hashMarkdown(body: string): string {
  const normalized = body.trim().replace(/\r\n/g, '\n');
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}
```

### Anthropic SDK messages.create with system prompt

```typescript
// Source: https://github.com/anthropics/anthropic-sdk-typescript [VERIFIED]
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  maxRetries: 3, // default is 2; override to 3 per Claude's discretion
});

const response = await client.messages.create({
  model: 'claude-haiku-4-5',     // alias for claude-haiku-4-5-20251001 [VERIFIED: Anthropic docs]
  max_tokens: 8192,
  system: `You are a technical translator EN→PT-BR. Keep these terms verbatim: ${glossaryTerms}`,
  messages: [{ role: 'user', content: markdownSection }],
});

const translated = (response.content[0] as Anthropic.TextBlock).text;
```

### Error handling with SDK error classes

```typescript
// Source: https://platform.claude.com/docs/en/api/errors + SDK README [VERIFIED]
import Anthropic from '@anthropic-ai/sdk';

try {
  const response = await client.messages.create({ ... });
} catch (err) {
  if (err instanceof Anthropic.RateLimitError) {
    // SDK retries automatically up to maxRetries; this fires after exhaustion
    console.error('Rate limit exhausted after retries. Skip article for this run.');
  } else if (err instanceof Anthropic.APIConnectionError) {
    console.error('Network error. Will retry on next cron run.');
  } else if (err instanceof Anthropic.BadRequestError) {
    // 400 — section too long or malformed prompt
    console.error('Bad request — do NOT retry:', err.message);
    throw err; // propagate; skip this article
  } else {
    throw err;
  }
}
```

### Forem API two-step fetch

```typescript
// Source: https://developers.forem.com/api/v1 [VERIFIED]
const BASE = 'https://dev.to/api';
const HEADERS = { 'Accept': 'application/vnd.forem.api-v1+json' };

// Step 1: list (no body_markdown)
const list = await fetch(
  `${BASE}/articles?username=sertaoseracloud&per_page=30`,
  { headers: HEADERS }
).then(r => r.json());

// Step 2: per-article (has body_markdown)
for (const article of list) {
  const full = await fetch(`${BASE}/articles/${article.id}`, { headers: HEADERS })
    .then(r => r.json());
  const { body_markdown, canonical_url, cover_image, tag_list } = full;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `ts-node` for scripts | `tsx` (esbuild-based) | 2022-2023 | ~25x faster startup; drop-in replacement |
| `node-fetch` npm package | Native `fetch` | Node 18 (2022) | No external dep for HTTP |
| `@anthropic-ai/sdk` v0.4x | v0.91.x | 2025-2026 | Full error class hierarchy; built-in retry; typed responses |
| `create-pull-request@v5/v6` | `v7` | 2024 | v7 adds `branch-token` separation, improved draft handling |
| `require('crypto')` CJS | `import { createHash } from 'node:crypto'` ESM | Node 14+ | No behavioral change; ESM import is the 2025 pattern |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | GlossaryEnforcer using exact string matching for `preserve_as_is` terms is the right algorithm (plurals will cause false positives) | GlossaryEnforcer Algorithm | Low — documented trade-off; fixable by adding plural forms to glossary |
| A2 | SHA-256 normalization (trim + LF) is sufficient to prevent whitespace-triggered re-translates | Pattern 2: DiffDetector | Low — worst case: spurious re-translate costing $0.06 |
| A3 | Cover image download uses `{slug}.{ext}` filename convention | Pattern 8: Cover Image | Low — naming is Claude's discretion per CONTEXT.md |
| A4 | The sync script can write `SYNC_PR_BODY.md` per-article and the peter-evans action reads it fresh each invocation | Pattern 6: PRBuilder | Medium — if running multiple articles in a loop, the Action would need to run inside the loop or the body file is overwritten. Planner must decide single-PR-per-workflow-run vs per-article Action invocation |
| A5 | `GITHUB_TOKEN` with `pull-requests: write` is sufficient for individual (not team) reviewer assignment | Pattern 7: workflow permissions | Medium — docs say write access needed; whether GITHUB_TOKEN suffices for individual users (vs teams) is unconfirmed. First-run test required |
| A6 | Forem API rate limits allow 30 articles per listing call + up to 5 per-article fetches without 429 | Forem API section | Low — 5 fetches per run (circuit breaker) is well under any reasonable rate limit; no exact limit documented |
| A7 | `body_markdown` in the per-article response (`GET /api/articles/{id}`) is always present for published public articles | Pattern 1: Forem API | Low — confirmed by official API docs; only risk is private/draft articles (which won't appear in public listing) |

---

## Open Questions

1. **How to handle multiple articles in a single GH Actions run with peter-evans?**
   - What we know: `peter-evans/create-pull-request@v7` creates one PR per invocation; a single run may process up to 5 articles (MAX_TRANSLATIONS_PER_RUN=5).
   - What's unclear: Does the planner want a matrix job (one job per article) or does the sync script invoke the GitHub API directly (bypassing the Action) for per-article PRs?
   - Recommendation: Use the GitHub REST API directly in the sync script (`octokit/rest` or native fetch + GITHUB_TOKEN) for PR creation. This gives full control in TypeScript and avoids matrix complexity. If D-05 behavior (draft + reviewer) is achievable via REST API, the peter-evans Action becomes a secondary mechanism or is removed. **Planner decision needed.**

2. **Does `GITHUB_TOKEN` satisfy reviewer assignment in practice?**
   - What we know: Official docs say write access to the repo is required; GITHUB_TOKEN with `pull-requests: write` is declared; individual user reviewers (not team reviewers) may work with GITHUB_TOKEN.
   - What's unclear: Whether GitHub silently ignores the reviewer on bot-created PRs (GitHub has a restriction: the PR author cannot be a reviewer).
   - Recommendation: Wave 0 task should include a smoke test for reviewer assignment. If it fails, add `GH_PAT` as a fallback secret.

3. **Forem API pagination: are there more than 30 articles?**
   - What we know: Listing endpoint defaults to `per_page=30`; can be increased. Author (`sertaoseracloud`) currently has few articles.
   - What's unclear: Whether pagination is needed for the first run.
   - Recommendation: Implement `per_page=30` initially (sufficient for MVP). Add pagination (`page` parameter) if the author exceeds 30 articles before this phase completes.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Script execution | ✓ | v24.14.1 | — |
| pnpm | Package manager | ✓ | 9.15.0 | — |
| `@anthropic-ai/sdk` | Translator | ✗ (not installed) | 0.91.0 available | — |
| `tsx` | Script execution | ✗ (not installed) | 4.21.0 available | Node `--experimental-strip-types` (experimental) |
| `ANTHROPIC_API_KEY` | Translator | ? (authorial action required) | — | Block execution if absent |
| `GITHUB_TOKEN` | PRBuilder + Issue creator | ✓ in GH Actions | provided by runtime | PAT fallback for reviewer |

**Missing dependencies with no fallback:**
- `ANTHROPIC_API_KEY` must be set as a GitHub Actions secret before first workflow run (authorial action — not a code change)

**Missing dependencies with fallback:**
- `tsx` and `@anthropic-ai/sdk`: install via `pnpm add -D @anthropic-ai/sdk tsx` (Wave 0 task)

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None currently installed — Wave 0 must add `vitest` or use Node `node:test` built-in |
| Config file | `vitest.config.ts` (to be created) OR `node --test` (no config needed) |
| Quick run command | `pnpm test:sync` (to be wired) |
| Full suite command | `pnpm test` |

**Recommendation:** Use Node.js built-in `node:test` (available since Node 18, stable in Node 22). No install needed. Compatible with the project's existing devDependency profile (minimal external test tooling). If the project wants richer assertions, `vitest` is the standard — but for a script-only phase, `node:test` + `node:assert` is sufficient.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | DevToClient listing returns article list | unit (mock fetch) | `node --test scripts/__tests__/devto-client.test.ts` | ❌ Wave 0 |
| REQ-02 | DevToClient per-article fetch returns body_markdown | unit (mock fetch) | `node --test scripts/__tests__/devto-client.test.ts` | ❌ Wave 0 |
| REQ-03 | DiffDetector SHA-256 matches/differs correctly | unit | `node --test scripts/__tests__/diff-detector.test.ts` | ❌ Wave 0 |
| REQ-04 | DiffDetector normalizes whitespace before hashing | unit | same file | ❌ Wave 0 |
| REQ-05 | Translator splits H2/H3 sections correctly | unit | `node --test scripts/__tests__/translator.test.ts` | ❌ Wave 0 |
| REQ-06 | Translator assembles sections after translation | unit (mock Anthropic client) | same file | ❌ Wave 0 |
| REQ-07 | GlossaryEnforcer detects drift (count_PT < count_EN) | unit | `node --test scripts/__tests__/glossary-enforcer.test.ts` | ❌ Wave 0 |
| REQ-08 | GlossaryEnforcer passes when counts match | unit | same file | ❌ Wave 0 |
| REQ-09 | PRBuilder writes valid frontmatter (Zod validates) | unit | `node --test scripts/__tests__/pr-builder.test.ts` | ❌ Wave 0 |
| REQ-10 | Circuit breaker stops after MAX_TRANSLATIONS_PER_RUN | unit | `node --test scripts/__tests__/sync-pipeline.test.ts` | ❌ Wave 0 |
| REQ-11 | Canonical lint detects missing/wrong URL | unit | same as REQ-09 or separate | ❌ Wave 0 |
| REQ-12 | manual_override:true article is skipped | unit | same | ❌ Wave 0 |
| REQ-E2E | One real dev.to article produces a draft PR (ROADMAP success criteria) | e2e (real API, manual) | `pnpm sync:devto` run by author | manual gate |

**Mock strategy:** All tests that touch `fetch` (Forem API) or `Anthropic` client must use dependency injection or module mocking. Design components to accept the client as a constructor argument or function parameter — makes testing possible without real API calls.

### Sampling Rate

- **Per task commit:** `pnpm test:sync` (unit tests only, ~2s)
- **Per wave merge:** Full unit suite + Zod validation check
- **Phase gate:** All unit tests green + E2E manual run by author with real dev.to article

### Wave 0 Gaps

- [ ] `scripts/__tests__/devto-client.test.ts` — covers REQ-01, REQ-02
- [ ] `scripts/__tests__/diff-detector.test.ts` — covers REQ-03, REQ-04
- [ ] `scripts/__tests__/translator.test.ts` — covers REQ-05, REQ-06
- [ ] `scripts/__tests__/glossary-enforcer.test.ts` — covers REQ-07, REQ-08
- [ ] `scripts/__tests__/pr-builder.test.ts` — covers REQ-09, REQ-11, REQ-12
- [ ] `scripts/__tests__/sync-pipeline.test.ts` — covers REQ-10
- [ ] Framework install: `pnpm add -D @anthropic-ai/sdk tsx` — runtime + executor needed before any test runs
- [ ] `package.json` `test:sync` script wired to `node --test scripts/__tests__/**/*.test.ts`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Script uses API keys, not user auth |
| V3 Session Management | No | Stateless script execution |
| V4 Access Control | No | Solo blog, single-author, no user auth layer |
| V5 Input Validation | Yes | Zod schema validates all PRBuilder frontmatter output |
| V6 Cryptography | Partial | SHA-256 via node:crypto (integrity, not security); no sensitive crypto |
| V7 Error Handling | Yes | API errors must not expose `ANTHROPIC_API_KEY` in logs |
| V9 Communications | Yes | HTTPS only for all API calls (Forem + Anthropic) |
| V14 Configuration | Yes | `ANTHROPIC_API_KEY` must be in GitHub Actions secrets, never in code or logs |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prompt injection via dev.to article body | Tampering / Elevation | Haiku call uses `role: user` only; system prompt is controlled glossary context; no code execution possible; output is translated markdown only |
| `ANTHROPIC_API_KEY` leaked in logs | Information Disclosure | Never log the key; check that SDK errors don't include it in messages; use GitHub Actions masked secrets |
| Runaway API cost (Pitfall 17) | Denial of Service (budget) | Circuit breaker (D-08); Anthropic budget alert at $5/mo |
| Malformed dev.to markdown causing Astro build failure | Denial of Service | Zod schema validation before committing; PRBuilder only writes valid frontmatter |
| Cover image download from untrusted URL | SSRF (low risk) | Images come from `dev.to` CDN (known domain); no arbitrary URL redirect; validate `cover_image` field is a URL before fetching |

---

## Sources

### Primary (HIGH confidence)

- [Forem API v1 — GET /api/articles/{id}](https://developers.forem.com/api/v1#tag/articles/operation/getArticleById) — `body_markdown` availability confirmed
- [Forem API v1 — GET /api/articles](https://developers.forem.com/api/v1#tag/articles/operation/getArticles) — listing fields; `body_markdown` absent from listing
- [Anthropic Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview) — `claude-haiku-4-5` alias confirmed; 200k context, 64k max output, $1/$5 per MTok
- [Anthropic API Errors](https://platform.claude.com/docs/en/api/errors) — all HTTP status codes and error types verified
- [@anthropic-ai/sdk npm registry](https://www.npmjs.com/package/@anthropic-ai/sdk) — version 0.91.0 current; latest tag confirmed
- [peter-evans/create-pull-request README](https://github.com/peter-evans/create-pull-request) — all inputs verified: `draft`, `reviewers`, `branch`, `body-path`, `commit-message`, `token`
- [Node.js crypto module](https://nodejs.org/api/crypto.html) — `createHash('sha256')` built-in, no install
- [tsx npm registry](https://www.npmjs.com/package/tsx) — version 4.21.0; esbuild-based executor
- `src/content.config.ts` — Zod schema (read directly; source of truth for PRBuilder output)
- `src/content/posts/hello-sertao.md` — frontmatter shape (read directly)
- `.github/workflows/deploy.yml` — pnpm/Node setup steps to copy (read directly)
- `.planning/glossary.json` — `preserve_as_is` terms for GlossaryEnforcer (read directly)
- `src/lib/consts.ts` — `SITE_URL = 'https://sertaoseracloud.com'`; `SOCIAL.devto` (read directly)

### Secondary (MEDIUM confidence)

- [peter-evans/create-pull-request concepts-guidelines](https://github.com/peter-evans/create-pull-request/blob/main/docs/concepts-guidelines.md) — PAT vs GITHUB_TOKEN for reviewers; write access requirement
- [tessl.io SDK error docs](https://tessl.io/registry/tessl/npm-anthropic-ai--sdk/0.61.0/files/docs/error-handling.md) — error class hierarchy cross-reference
- [betterstack tsx vs native TypeScript](https://betterstack.com/community/guides/scaling-nodejs/tsx-vs-native-nodejs-typescript/) — tsx recommendation for production scripts
- [Forem community blog](https://dev.to/tiaeastwood/how-to-use-the-forem-api-to-display-your-devto-blog-posts-on-your-website-easy-3dl3) — `per_page` parameter; pagination pattern

### Tertiary (LOW confidence)

- Forem API rate limits — no official documentation found specifying requests/hour. [ASSUMED] well under limits with 5-article circuit breaker.

---

## Metadata

**Confidence breakdown:**

- Standard Stack: HIGH — all package versions verified via npm registry or official docs
- Architecture: HIGH — Forem API two-step fetch verified; Haiku model ID and limits verified; peter-evans inputs verified
- Pitfalls: HIGH — Pitfall A (body_markdown absence) verified against official API docs; others are HIGH-probability based on the architecture
- GlossaryEnforcer algorithm: MEDIUM — exact string matching approach is ASSUMED; no official precedent to verify against
- reviewer-via-GITHUB_TOKEN: MEDIUM — docs indicate write access needed; exact behavior for individual (not team) reviewers unconfirmed

**Research date:** 2026-04-24
**Valid until:** 2026-07-24 (90 days; Forem API v1 is stable; Anthropic SDK version updates frequently but the patterns are stable)
