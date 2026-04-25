# Phase 2: Dev.to Sync Pipeline — Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 13 (new/modified)
**Analogs found:** 5 / 13 (8 are net-new with no codebase analog; RESEARCH.md patterns apply)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/sync-devto.ts` | utility (entry point / orchestrator) | batch + event-driven | `package.json` placeholder `sync:devto` | no-analog — use RESEARCH.md Pattern 1–8 |
| `scripts/__tests__/devto-client.test.ts` | test | request-response | — | no-analog |
| `scripts/__tests__/diff-detector.test.ts` | test | transform | — | no-analog |
| `scripts/__tests__/translator.test.ts` | test | request-response | — | no-analog |
| `scripts/__tests__/glossary-enforcer.test.ts` | test | transform | — | no-analog |
| `scripts/__tests__/pr-builder.test.ts` | test | file-I/O | — | no-analog |
| `scripts/__tests__/sync-pipeline.test.ts` | test | batch | — | no-analog |
| `.github/workflows/sync-devto.yml` | config (CI workflow) | event-driven | `.github/workflows/deploy.yml` | role-match (exact pnpm/Node setup) |
| `.github/SYNC_PR_BODY.md` | config (template) | — | — | no-analog |
| `docs/sync-pipeline.md` | documentation | — | — | no-analog |
| `package.json` | config | — | `package.json` (existing) | exact — modify in-place |
| `src/content/posts/{slug}.md` | model (runtime output) | file-I/O | `src/content/posts/hello-sertao.md` | exact frontmatter shape |
| `src/content/posts/images/{slug}.{ext}` | model (runtime output) | file-I/O | — | no-analog (binary write) |

---

## Pattern Assignments

### `scripts/sync-devto.ts` (utility, batch)

**Analog:** No existing scripts directory. This is the first script in the project. Use RESEARCH.md patterns throughout.

**Imports pattern** — ESM module style matching `tsconfig.json` strict mode:
```typescript
// All imports use ESM (package.json: "type": "module")
// node: protocol prefix for built-ins (matches 2025 convention)
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
```

**Entry point pattern** — no top-level await issues with tsx:
```typescript
// tsx runs top-level await natively; no IIFE wrapper needed
// Pattern: main() guard for testability
async function main(): Promise<void> {
  // orchestrate pipeline
}

main().catch((err) => {
  console.error('[sync-devto] fatal:', err);
  process.exit(1);
});
```

**Environment guard pattern** — block execution if secrets missing:
```typescript
// Fail fast before any API calls; never log the key value
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('[sync-devto] ANTHROPIC_API_KEY is not set. Aborting.');
  process.exit(1);
}
const MAX_TRANSLATIONS_PER_RUN = Number(process.env.MAX_TRANSLATIONS_PER_RUN ?? '5');
```

**Source of truth for SITE_URL and dev.to username:**
From `src/lib/consts.ts` lines 1 and 12:
```typescript
// Import constants rather than hardcoding — keeps sync in sync with the site config
// NOTE: scripts/ runs outside Astro build; import via relative path from project root
// import { SITE_URL, SOCIAL } from '../src/lib/consts.js';
// SITE_URL = 'https://sertaoseracloud.com'
// SOCIAL.devto = 'https://dev.to/sertaoseracloud'
// Derive username: SOCIAL.devto.split('/').pop() → 'sertaoseracloud'
```

---

### `.github/workflows/sync-devto.yml` (config, event-driven)

**Analog:** `.github/workflows/deploy.yml`

**pnpm/Node setup block** — copy verbatim from deploy.yml lines 24–39:
```yaml
- name: Checkout
  uses: actions/checkout@v4

- name: Set up pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 9.15.0

- name: Set up Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'pnpm'

- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

**Permissions pattern** — deploy.yml (lines 8–11) uses minimal permissions; sync-devto.yml needs more:
```yaml
# deploy.yml uses: contents: read, pages: write, id-token: write
# sync-devto.yml MUST expand to:
permissions:
  contents: write        # write markdown files to branch
  pull-requests: write   # open PR drafts (peter-evans action)
  issues: write          # open GitHub Issues for canonical lint / glossary drift
```

**Trigger pattern** — deploy.yml uses push+dispatch; sync-devto.yml uses schedule+dispatch:
```yaml
on:
  schedule:
    - cron: '0 3 * * *'   # 03:00 UTC daily = 00:00 BRT
  workflow_dispatch:        # manual trigger; same pattern as deploy.yml line 6
```

**Secrets injection pattern** — GITHUB_TOKEN is automatic; ANTHROPIC_API_KEY must be explicit:
```yaml
- name: Run sync
  run: pnpm sync:devto
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    MAX_TRANSLATIONS_PER_RUN: 5
```

**peter-evans step** — runs AFTER sync script writes files:
```yaml
- name: Create sync PR
  uses: peter-evans/create-pull-request@v7
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    branch: sync/${{ env.ARTICLE_SLUG }}-${{ github.run_id }}
    commit-message: "sync: translate '${{ env.ARTICLE_TITLE }}' from dev.to"
    title: "[sync] ${{ env.ARTICLE_TITLE }} (dev.to #${{ env.ARTICLE_ID }})"
    body-path: .github/SYNC_PR_BODY.md
    draft: true
    reviewers: sertaoseracloud
    labels: sync,translation
    add-paths: |
      src/content/posts/${{ env.ARTICLE_SLUG }}.md
      src/content/posts/images/
```

---

### `package.json` (config — modify)

**Analog:** `package.json` lines 1–33 (existing file — full contents already read)

**Scripts block delta** — lines 11–20 show current scripts; add two entries:
```json
// Current (line 17): "sync:devto": "node -e \"console.log('Phase 2: implement sync')\""
// Replace with:
"sync:devto": "tsx scripts/sync-devto.ts",
// Add after sync:devto:
"test:sync": "node --test scripts/__tests__/**/*.test.ts"
```

**devDependencies delta** — lines 27–32 show current devDependencies; add two entries:
```json
// Current devDependencies: @astrojs/check, typescript, prettier, prettier-plugin-astro
// Add:
"@anthropic-ai/sdk": "^0.91.0",
"tsx": "^4.21.0"
```

**Install command:** `pnpm add -D @anthropic-ai/sdk tsx`

---

### `src/content/posts/{slug}.md` (model, file-I/O — runtime output written by PRBuilder)

**Analog:** `src/content/posts/hello-sertao.md` lines 1–25 (exact shape PRBuilder must replicate)

**Complete frontmatter shape** (lines 1–16 of hello-sertao.md):
```yaml
---
title: "Hello, Sertão!"
description: "Bem-vindo ao O Sertão será Cloud — um blog sobre cloud computing em português."
pubDate: 2026-04-24
draft: true
tags: ["cloud", "arq"]
source:
  platform: dev.to
  id: 0
  url: https://dev.to/sertaoseracloud/hello-sertao-mock
  hash: "deadbeef00000000"
  synced_at: 2026-04-24
  translated_by: claude-haiku-4-5
canonical_url: https://sertaoseracloud.com/posts/hello-sertao
manual_override: false
---
```

**Zod schema validation source** — `src/content.config.ts` lines 5–26 (authoritative spec):
```typescript
schema: z.object({
  title: z.string().max(80),
  description: z.string().max(200),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  coverAlt: z.string().optional(),          // omit if no cover image
  source: z.object({
    platform: z.literal('dev.to'),
    id: z.number(),
    url: z.string().url(),
    hash: z.string(),
    synced_at: z.coerce.date(),
    translated_by: z.string(),
  }).optional(),
  canonical_url: z.string().url().optional(),
  manual_override: z.boolean().default(false),
})
```

**PRBuilder write pattern** — generate YAML frontmatter string then write:
```typescript
// Use node:fs/promises — no external dep
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

async function writePost(slug: string, frontmatter: PostFrontmatter, body: string): Promise<void> {
  const dest = path.join('src', 'content', 'posts', `${slug}.md`);
  const yaml = buildFrontmatterYaml(frontmatter); // serialize to YAML string
  const content = `---\n${yaml}---\n\n${body}`;
  await writeFile(dest, content, 'utf8');
}

// Image directory
await mkdir(path.join('src', 'content', 'posts', 'images'), { recursive: true });
```

---

### `scripts/__tests__/devto-client.test.ts` (test, request-response)

**Analog:** No existing tests in codebase. Use Node.js built-in `node:test` (RESEARCH.md recommendation).

**Test file pattern** — `node:test` + mock fetch via dependency injection:
```typescript
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

// Dependency injection pattern: pass fetchFn as parameter for testability
// (from RESEARCH.md mock strategy — components accept client as constructor arg)
describe('DevToClient', () => {
  it('two-step fetch: per-article fetch returns body_markdown', async () => {
    const mockFetch = mock.fn(async (url: string) => {
      if (url.includes('/articles?username')) {
        return { ok: true, json: async () => [{ id: 1, slug: 'test-post' }] };
      }
      return { ok: true, json: async () => ({ id: 1, body_markdown: '# Hello' }) };
    });
    // DevToClient(fetchFn) → two-step fetch
    // assert body_markdown present
  });
});
```

---

### `scripts/__tests__/diff-detector.test.ts` (test, transform)

**Analog:** None. Node.js `node:test` pattern (same as devto-client.test.ts above).

**Core test pattern:**
```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

describe('DiffDetector', () => {
  it('SHA-256 is stable for identical normalized content', () => {
    const hash1 = hashMarkdown('# Hello\n');
    const hash2 = hashMarkdown('# Hello\r\n'); // CRLF — must normalize
    assert.equal(hash1, hash2);
  });

  it('detects changed content', () => {
    assert.notEqual(hashMarkdown('# Hello'), hashMarkdown('# World'));
  });
});
```

---

### `scripts/__tests__/translator.test.ts` (test, request-response)

**Analog:** None. Dependency-injected Anthropic client pattern.

**Mock client pattern:**
```typescript
// Pass Anthropic client as constructor param — never instantiate inside Translator
// This makes the class testable without real API calls
const mockClient = {
  messages: {
    create: mock.fn(async () => ({
      content: [{ type: 'text', text: '# Olá' }],
    })),
  },
};
```

---

### `scripts/__tests__/glossary-enforcer.test.ts` (test, transform)

**Analog:** None. Pure function test — no mocking needed.

**Test pattern:**
```typescript
describe('GlossaryEnforcer', () => {
  it('PASS when PT count >= EN count for all terms', () => {
    const result = enforceGlossary('AWS Lambda', 'AWS Lambda');
    assert.equal(result.passed, true);
    assert.deepEqual(result.driftedTerms, []);
  });

  it('FAIL when term is translated away', () => {
    const result = enforceGlossary('Use Lambda for this', 'Use Função para isto');
    assert.equal(result.passed, false);
    assert.ok(result.driftedTerms.some(t => t.startsWith('Lambda')));
  });
});
```

---

### `scripts/__tests__/pr-builder.test.ts` (test, file-I/O)

**Analog:** None. Validates against `src/content.config.ts` Zod schema.

**Zod validation pattern** — import schema from content.config:
```typescript
// Import Zod schema directly to validate PRBuilder output
// This is the core test: PRBuilder output must satisfy the real schema
import { collections } from '../../src/content.config.js';

it('PRBuilder writes frontmatter that satisfies Zod schema', () => {
  const frontmatter = buildFrontmatter(mockArticle);
  // collections.posts.schema is the Zod schema from src/content.config.ts
  const result = collections.posts.schema.safeParse(frontmatter);
  assert.ok(result.success, JSON.stringify(result.error?.issues));
});
```

---

### `scripts/__tests__/sync-pipeline.test.ts` (test, batch)

**Analog:** None. Tests circuit breaker (D-08) and manual_override skip (D-03).

**Circuit breaker test pattern:**
```typescript
it('stops after MAX_TRANSLATIONS_PER_RUN articles', async () => {
  const articles = Array.from({ length: 10 }, (_, i) => ({ id: i, slug: `post-${i}` }));
  const translated: number[] = [];
  await runPipeline(articles, { maxRun: 5, onTranslate: (id) => translated.push(id) });
  assert.equal(translated.length, 5);
});

it('skips article with manual_override: true', async () => {
  // article with manual_override: true in existing frontmatter
  // assert: not in translated list; skip logged
});
```

---

## Shared Patterns

### TypeScript Import Style (ESM)
**Source:** `package.json` line 3 (`"type": "module"`), `tsconfig.json` line 1 (`extends: astro/tsconfigs/strict`)
**Apply to:** All files in `scripts/`

```typescript
// Always use ESM imports (package.json "type": "module")
// Use node: prefix for built-ins
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
// When importing from src/ within scripts, use .js extension (ESM resolution)
import { SITE_URL, SOCIAL } from '../src/lib/consts.js';
```

### Anthropic SDK Error Handling
**Source:** RESEARCH.md lines 560–579 (verified against official SDK docs)
**Apply to:** `scripts/sync-devto.ts` (Translator component)

```typescript
import Anthropic from '@anthropic-ai/sdk';

try {
  const response = await client.messages.create({ ... });
} catch (err) {
  if (err instanceof Anthropic.RateLimitError) {
    // SDK already retried maxRetries times; log and skip this article
    console.error('[translator] Rate limit exhausted. Skipping article for this run.');
    return null;
  } else if (err instanceof Anthropic.APIConnectionError) {
    console.error('[translator] Network error. Will retry on next cron run.');
    return null;
  } else if (err instanceof Anthropic.BadRequestError) {
    // 400 — do NOT retry; propagate to skip this article
    throw err;
  } else {
    throw err;
  }
}
```

### SHA-256 Normalization
**Source:** RESEARCH.md lines 526–534 (verified: node:crypto docs)
**Apply to:** `scripts/sync-devto.ts` (DiffDetector component)

```typescript
import { createHash } from 'node:crypto';

function hashMarkdown(body: string): string {
  const normalized = body.trim().replace(/\r\n/g, '\n');
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}
```

### Canonical URL Lint (D-07)
**Source:** `src/lib/consts.ts` line 1 (`SITE_URL`), CONTEXT.md D-07
**Apply to:** `scripts/sync-devto.ts` (canonical lint step)

```typescript
// SITE_URL = 'https://sertaoseracloud.com' (from src/lib/consts.ts)
const CANONICAL_PREFIX = `${SITE_URL}/posts/`;

function checkCanonicalUrl(canonical_url: string | null | undefined): boolean {
  return !!canonical_url && canonical_url.startsWith(CANONICAL_PREFIX);
}
// D-07: prefix check only; exact slug match NOT required
```

### GitHub Issue Creation via REST API
**Source:** RESEARCH.md "Don't Hand-Roll" table (native fetch + GITHUB_TOKEN)
**Apply to:** `scripts/sync-devto.ts` (canonical lint and glossary drift failure paths)

```typescript
async function openGitHubIssue(
  title: string,
  body: string,
  token: string,
  repo: string  // e.g. 'sertaoseracloud/blog_sertao'
): Promise<void> {
  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body }),
  });
  if (!res.ok) {
    console.error('[github] Failed to open issue:', await res.text());
  }
}
```

### node:test File Structure
**Source:** RESEARCH.md lines 678–680 (node:test recommendation)
**Apply to:** All `scripts/__tests__/*.test.ts` files

```typescript
import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// One describe block per component
// Use mock.fn() for dependency injection (fetchFn, anthropicClient)
// No global state — each test is self-contained
```

### PR Body Sections (D-04)
**Source:** CONTEXT.md D-04, D-05 — locked decisions
**Apply to:** `scripts/sync-devto.ts` (PRBuilder body generator) and `.github/SYNC_PR_BODY.md`

The PR body written to `.github/SYNC_PR_BODY.md` MUST contain all four sections:
```markdown
## Source
**Title:** {article title}
**Dev.to URL:** {url}
**Synced at:** {timestamp}

## Translation Stats
**Sections translated:** {n}
**Model:** claude-haiku-4-5
**Token estimate:** {input_tokens} in / {output_tokens} out

## Glossary Enforcement
{PASS ✓ | WARN ⚠} — {n} terms checked
{list of drifted terms if WARN}

## Canonical URL Lint
{✓ canonical_url is set correctly | ⚠ canonical_url missing or incorrect — see Issue #{n}}
```

---

## No Analog Found

Files with no close match in the codebase (planner uses RESEARCH.md patterns directly):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/sync-devto.ts` | utility (orchestrator) | batch | No scripts/ directory exists; first script in project |
| `scripts/__tests__/devto-client.test.ts` | test | request-response | No test files exist in project |
| `scripts/__tests__/diff-detector.test.ts` | test | transform | No test files exist in project |
| `scripts/__tests__/translator.test.ts` | test | request-response | No test files exist in project |
| `scripts/__tests__/glossary-enforcer.test.ts` | test | transform | No test files exist in project |
| `scripts/__tests__/pr-builder.test.ts` | test | file-I/O | No test files exist in project |
| `scripts/__tests__/sync-pipeline.test.ts` | test | batch | No test files exist in project |
| `.github/SYNC_PR_BODY.md` | config (template) | — | No PR body templates exist |
| `docs/sync-pipeline.md` | documentation | — | No docs/ directory; runbook is net-new |
| `src/content/posts/images/{slug}.{ext}` | model (binary output) | file-I/O | Binary file write; images/ dir does not yet exist |

---

## Metadata

**Analog search scope:** `C:\Repo\blog_sertao` — all directories
**Files scanned:** `.github/workflows/deploy.yml`, `src/content.config.ts`, `src/content/posts/hello-sertao.md`, `src/lib/consts.ts`, `package.json`, `tsconfig.json`, `src/env.d.ts`, `.planning/glossary.json`
**Scripts directory:** does not exist (greenfield)
**Test files:** none exist (greenfield)
**Pattern extraction date:** 2026-04-24
