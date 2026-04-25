# Sync Pipeline Runbook

**Pipeline:** dev.to → Claude Haiku 4.5 → PT-BR → PR draft
**Entry point:** `pnpm sync:devto` / `.github/workflows/sync-devto.yml`
**Last updated:** 2026-04-25

---

## Architecture Overview

The sync pipeline fetches published articles from `dev.to/@sertaoseracloud` via the Forem API,
translates each new or changed article from EN to PT-BR using Claude Haiku 4.5, enforces the
technical glossary, and opens a draft GitHub PR for editorial review.

```
[Windows Task Scheduler / manual workflow_dispatch]
                │
     ┌──────────┴──────────────────────────┐
     │ Local PC                             │ GitHub Actions (manual fallback)
     ▼                                      ▼
scripts/run-sync.ps1              .github/workflows/sync-devto.yml
(weekly, Monday 09:00)            (workflow_dispatch only — no cron)
     │                                      │
     └──────────────┬───────────────────────┘
                    ▼
          pnpm sync:devto (scripts/sync-devto.ts)
            │
            ├── DevToClient     — Forem API two-step fetch
            ├── DiffDetector    — SHA-256 change detection
            ├── Translator      — Haiku 4.5 section-by-section
            ├── GlossaryEnforcer — preserve_as_is term validation
            └── PRBuilder       — write .md file + open draft PR via GitHub REST API
```

**Scheduling:**
- Primary: Windows Task Scheduler on developer's PC — fires `scripts/run-sync.ps1` weekly every Monday at 09:00 local time
- Catchup: `StartWhenAvailable = true` — runs on next PC start if Monday 09:00 was missed
- Setup: run `scripts/setup-scheduled-task.ps1` once to register the scheduled task
- Manual (local): `Start-ScheduledTask -TaskName 'SertaoSeraCloud-Sync'`
- Manual (GH Actions): GitHub Actions UI → Sync dev.to articles (manual) → Run workflow

---

## Running Manually

### Local run (writes files, no PR)

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pnpm sync:devto
# Output: markdown files written to src/content/posts/
# Note: GITHUB_TOKEN not set → no PR created; local preview only
```

### GitHub Actions manual run (full run with PR)

1. Go to https://github.com/sertaoseracloud/blog_sertao/actions/workflows/sync-devto.yml
2. Click **Run workflow** → select branch `main` → click **Run workflow**
3. Watch the run; PRs appear in https://github.com/sertaoseracloud/blog_sertao/pulls

### CLI dispatch (requires GITHUB_TOKEN with `workflow` scope)

```bash
curl -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/sertaoseracloud/blog_sertao/actions/workflows/sync-devto.yml/dispatches \
  -d '{"ref":"main"}'
# 204 No Content = dispatch accepted
```

---

## Environment Variables

| Variable | Local PC | GitHub Actions | Notes |
|----------|----------|----------------|-------|
| `ANTHROPIC_API_KEY` | Windows user env var | GH Actions secret | Create in Anthropic Console |
| `GITHUB_TOKEN` | Windows user env var (Fine-grained PAT) | Auto-injected by GH Actions | PAT needs Contents+PRs+Issues write; see setup steps below |
| `MAX_TRANSLATIONS_PER_RUN` | Optional (default: 5) | Optional via workflow_dispatch input | Circuit breaker D-08 |

---

## Common Failures

### 429 Rate Limit (Anthropic API)

**Symptom:** Run fails with `RateLimitError` in logs after retries exhausted.
**Cause:** Too many Haiku API calls in a short period. The SDK retries 3× with exponential backoff automatically; this error only fires after all retries fail.
**Fix:** The failed article will be retried on the next cron run (next Monday). No manual action needed unless this happens consistently.
**Prevention:** `MAX_TRANSLATIONS_PER_RUN=5` limits calls per run; Anthropic $5/month budget alert is the secondary gate.

### Timeout / Network Error

**Symptom:** `APIConnectionError` in logs; run exits 1.
**Cause:** Transient network failure between GH Actions runner and Anthropic/dev.to API.
**Fix:** Re-run the workflow manually (GitHub Actions UI → Re-run failed jobs) or wait for the next scheduled run.

### Glossary Drift — No PR Created

**Symptom:** Log line `[sync] GLOSSARY DRIFT for id=XXXX. Issue opened. Skipping PR.`; a GitHub Issue is opened automatically.
**Cause:** One or more `preserve_as_is` terms from `.planning/glossary.json` appear fewer times in the PT translation than in the EN source (per D-09 — hard fail on any drift).
**Fix:**
1. Read the GitHub Issue — it lists the drifted terms with EN/PT counts.
2. Option A (preferred): Add the plural/variant form to `preserve_as_is` in `.planning/glossary.json` (e.g., add `"Lambdas"` if `"Lambda"` triggers false positive).
3. Option B: Accept the drift for this article — close the Issue and add the article slug to a skip list (not currently implemented; v2).
4. Re-run the sync after updating the glossary.

**See also:** [Updating the Glossary](#updating-the-glossary) section below.

### Canonical URL Missing — Issue Opened, PR Still Created

**Symptom:** Log line `[sync] canonical_url missing/incorrect for id=XXXX. Issue opened (non-blocking).`; PR is still created (D-06: non-blocking).
**Cause:** The dev.to article does not have `canonical_url` pointing to `https://sertaoseracloud.com/posts/`.
**Fix:**
1. Read the GitHub Issue — it has the exact canonical URL value to set.
2. Go to the dev.to article → Edit → More options → Canonical URL → paste the value.
3. The next sync run will detect no change (same `body_markdown` hash) so no new PR will be opened; the canonical URL will be correct if you set it before merging the current PR.

### Multiple Open PRs for Same Article (D-02 Behavior)

**Symptom:** Two or more PRs open for the same article slug.
**Cause:** Expected behavior per D-02. When an article changes, a new PR is always created. The old PR is not automatically closed.
**Fix:** Close the older PR(s) manually. The PR title includes `dev.to #{id}` for easy identification and filtering.

### Local Run Writes Files but No PR

**Symptom:** `pnpm sync:devto` writes markdown to `src/content/posts/` but no PR appears in GitHub.
**Cause:** Expected behavior. PRs are only created when `GITHUB_TOKEN` is set. Local runs intentionally skip PR creation (useful for reviewing translation quality before committing).
**Fix:** This is not a bug. To open a PR, run via GitHub Actions (see "Running Manually" above).

### `body_markdown` Undefined — Hash Constant Across All Articles

**Symptom:** ALL articles appear "changed" every run; circuit breaker fires on every run.
**Cause:** DevToClient is incorrectly reading `body_markdown` from the listing response (which does not include it). This would be a regression bug in the two-step fetch.
**Fix:** Check `scripts/devto-client.ts` — `getArticle(id)` must be called for each article. The listing response (`listArticles`) intentionally does NOT return `body_markdown`.

---

## Secrets Setup (First-time)

### 1. ANTHROPIC_API_KEY

1. Log in to https://console.anthropic.com
2. Go to **API Keys** → **Create Key** → copy the value
3. Go to https://github.com/sertaoseracloud/blog_sertao/settings/secrets/actions
4. Click **New repository secret** → name: `ANTHROPIC_API_KEY` → paste value → **Add secret**

### 2. Budget Alert (Anthropic)

1. In Anthropic Console → **Billing** → **Usage limits**
2. Set **Monthly spend limit** to `$5`
3. This prevents runaway API cost if the DiffDetector has a bug

### 3. GH_PAT (Optional — only if reviewer assignment fails)

If PRs are created but `sertaoseracloud` is not assigned as reviewer:
1. Go to https://github.com/settings/personal-access-tokens/new
2. Create a Fine-grained PAT scoped to `sertaoseracloud/blog_sertao` with `Contents: read/write` + `Pull requests: read/write`
3. Add as repo secret named `GH_PAT`
4. Update `sync-devto.yml` line: `GITHUB_TOKEN: ${{ secrets.GH_PAT }}` instead of `secrets.GITHUB_TOKEN`

### 4. Windows Task Scheduler Setup (Local PC)

Before the first scheduled local run:
1. Set `ANTHROPIC_API_KEY` as a Windows user environment variable (Start → "Edit environment variables for your account")
2. Set `GITHUB_TOKEN` as a Windows user environment variable (Fine-grained PAT: Contents+PRs+Issues write on `sertaoseracloud/blog_sertao`)
3. Run once:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/setup-scheduled-task.ps1
   ```
4. Verify: `Get-ScheduledTask -TaskName 'SertaoSeraCloud-Sync'`
5. Manual test: `Start-ScheduledTask -TaskName 'SertaoSeraCloud-Sync'`

---

## Monitoring

| Signal | Where to check |
|--------|----------------|
| Daily sync ran | https://github.com/sertaoseracloud/blog_sertao/actions/workflows/sync-devto.yml |
| New translation PRs | https://github.com/sertaoseracloud/blog_sertao/pulls?q=is:pr+label:sync |
| Glossary drift issues | https://github.com/sertaoseracloud/blog_sertao/issues?q=is:issue+label:glossary-drift |
| Canonical URL issues | https://github.com/sertaoseracloud/blog_sertao/issues?q=is:issue+%5Bcanonical%5D |
| Anthropic spend | https://console.anthropic.com/billing |

---

## Updating the Glossary

`.planning/glossary.json` controls both the Translator (system prompt) and the GlossaryEnforcer (drift detection).

**When to update:**
- After merging a PR where you manually corrected a translated term → add the variant to `preserve_as_is` or `prefer_en_over_pt`
- When a new cloud service becomes relevant → add its name to `preserve_as_is`
- When GlossaryEnforcer fires a false positive on a plural/variant → add the variant form

**Bump `version`** in `glossary.json` after each update so the next run's PR body logs the new version.

---

## Pipeline Decisions Reference

| Decision | Summary |
|----------|---------|
| D-01 | Section-by-section translation (split on H2/H3) — one Haiku call per section |
| D-02 | Re-sync always creates a new PR draft; old PRs closed manually |
| D-03 | `manual_override: true` in frontmatter → article skipped entirely |
| D-04 | PR body must include: Source, Translation Stats, Glossary Enforcement, Canonical URL Lint |
| D-05 | PR is draft; `sertaoseracloud` assigned as reviewer |
| D-06 | Missing canonical_url → opens GitHub Issue (non-blocking); PR still created |
| D-07 | Canonical check: starts with `https://sertaoseracloud.com/posts/` (prefix only) |
| D-08 | `MAX_TRANSLATIONS_PER_RUN=5` circuit breaker per run |
| D-09 | Glossary drift → hard fail (no PR for that article), opens GitHub Issue, other articles continue |
