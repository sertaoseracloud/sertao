---
phase: 02-sync-pipeline
fixed_at: 2026-04-25T00:00:00Z
review_path: .planning/phases/02-sync-pipeline/02-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-04-25
**Source review:** .planning/phases/02-sync-pipeline/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6
- Fixed: 6
- Skipped: 0

## Fixed Issues

### CR-01: `canonicalIssueUrl` captured but never forwarded to `buildPrBody`

**Files modified:** `scripts/types.ts`, `scripts/sync-devto.ts`, `scripts/pr-builder.ts`
**Commit:** `64758ef`
**Applied fix:** Added `canonicalIssueUrl?: string | null` field to `SyncArticle` interface, set it from `canonicalIssueUrl` in `processArticles` before constructing the struct, and updated `openGitHubPr` to pass `article.canonicalIssueUrl ?? undefined` as the second argument to `buildPrBody`. Combined with CR-02 fix in the same commit since both touch the same files and are tightly coupled.

---

### CR-02: Type mismatch — `openIssue` returns `Promise<void>` but result assigned to `string | undefined`

**Files modified:** `scripts/types.ts`, `scripts/sync-devto.ts`
**Commit:** `64758ef`
**Applied fix:** Changed `PipelineHandlers.openIssue` return type from `Promise<void>` to `Promise<string | undefined>`. Updated the `main()` handler to return `undefined` in the no-token path and `return prBuilder.openGitHubIssue(...)` in the live path (removing the `await` + implicit void). Committed atomically with CR-01 since both require touching the same interfaces.

---

### WR-01: `cover_image` not mapped to `coverImageUrl` — cover images silently dropped

**Files modified:** `scripts/sync-devto.ts`
**Commit:** `bd208d6`
**Applied fix:** Added `coverImageUrl: article.cover_image` to the return object of the `articlesWithDiff` map in `main()`, so `processArticles` receives the cover image URL from the Forem API field instead of always getting `undefined`.

---

### WR-02: `listArticles` silently returns `[]` on API error — masking auth failures

**Files modified:** `scripts/devto-client.ts`
**Commit:** `fe924eb`
**Applied fix:** Replaced the `console.error` + `return []` fallback with `throw new Error(...)` on non-2xx responses in `listArticles`. Errors now propagate to `main().catch()` and exit with code 1, making auth failures and server errors distinguishable from a legitimately empty account.

---

### WR-03: `canonical_url` written unquoted in YAML — vulnerable to `#` in URL

**Files modified:** `scripts/pr-builder.ts`
**Commit:** `07e4ea6`
**Applied fix:** Wrapped both `canonical_url` and `source.url` in `JSON.stringify(...)` in `serializeFrontmatter`. `JSON.stringify` produces a double-quoted YAML scalar that is safe for any URL content including fragment identifiers (`#`). The reviewer also flagged `source.url` at line 279, so both were fixed in the same commit.

---

### WR-04: `test:sync` script fails on Node 22.12 without `--experimental-strip-types`

**Files modified:** `package.json`
**Commit:** `656e1ef`
**Applied fix:** Changed `test:sync` from `node --test scripts/__tests__/**/*.test.ts` to `node --import tsx/esm --test scripts/__tests__/**/*.test.ts`. This uses the already-installed `tsx` devDependency as an ESM loader, consistent with the existing `sync:devto` script, and avoids any dependency on experimental Node flags.

---

_Fixed: 2026-04-25_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
