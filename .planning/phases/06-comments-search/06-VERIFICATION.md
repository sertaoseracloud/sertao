---
phase: 06-comments-search
verified: 2026-04-28T22:00:00Z
status: human_needed
score: 10/12 must-haves verified
overrides_applied: 0
gaps: []
human_verification:
  - test: "Open any post page in a browser after pnpm build && pnpm preview. Scroll to bottom. Verify Giscus iframe loads (GitHub login prompt visible). Note: requires authorial prerequisite — enable GitHub Discussions on sertaoseracloud/sertao, create 'Comments' category, run giscus.app wizard, replace REPLACE_WITH_REPO_ID and REPLACE_WITH_CATEGORY_ID in src/components/CommentsEmbed.astro"
    expected: "Giscus comment widget appears with GitHub login prompt in Portuguese. No console errors about missing config."
    why_human: "Requires live GitHub Discussions setup + real Giscus repo-id/category-id values. Placeholder IDs (REPLACE_WITH_REPO_ID, REPLACE_WITH_CATEGORY_ID) are present in CommentsEmbed.astro — the code structure is complete and correct but Giscus iframe will not load until real IDs are substituted. This is a documented authorial prerequisite from Plan 01 Task 0."
  - test: "With Giscus iframe loaded on a post page, toggle dark/light mode using the ThemeToggle button. Observe the Giscus widget."
    expected: "Giscus iframe switches theme (dark/light) immediately when the toggle is clicked — no page reload required."
    why_human: "postMessage bridge requires a live Giscus iframe to observe behavior. The code is verified in ThemeToggle.astro (querySelector + postMessage to 'https://giscus.app'), but the effect is only visible with a functioning Giscus widget."
  - test: "After pnpm build && pnpm preview, press Ctrl+K on any page. Type 'cloud' in the search input."
    expected: "Modal overlay opens, search input is focused, results appear as you type. Results are in Portuguese and relate to the post content."
    why_human: "Pagefind search functionality requires the built dist/ output and a running preview server. The static index (dist/pagefind/) is generated at build time. PT-BR stemming behavior (D-09) is a runtime language-level behavior that cannot be verified from file contents alone."
  - test: "Navigate to /tags/ in the preview. Verify tag names are all lowercase and post counts are accurate."
    expected: "/tags/ page lists all unique tags with correct counts, sorted by count descending then alphabetically."
    why_human: "Post count accuracy requires cross-referencing rendered HTML against actual post data — cannot be verified purely from source files."
  - test: "Click a tag chip on the /tags/ page (e.g., 'aws'). Navigate to /tags/aws."
    expected: "Filter page shows only posts tagged 'aws'. Heading reads 'Posts com #aws'. Back link '← Todas as tags' returns to /tags/."
    why_human: "UI navigation behavior and content accuracy require browser interaction."
---

# Phase 6: Comments + Search — Verification Report

**Phase Goal:** Leitores podem comentar (via GitHub identity) e buscar posts por texto livre. Nenhuma interação precisa de backend próprio.
**Verified:** 2026-04-28T22:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | pnpm build succeeds with pagefind running as a post-step (dist/pagefind/ exists after build) | ✓ VERIFIED | `package.json` build script: `"astro build && pagefind --site dist"`; `dist/pagefind/pagefind.js`, `pagefind-ui.js`, `pagefind-ui.css` all present |
| 2 | ThemeToggle.applyTheme() sends postMessage to iframe.giscus-frame with targetOrigin 'https://giscus.app' | ✓ VERIFIED | Lines 73-78 of ThemeToggle.astro: `querySelector<HTMLIFrameElement>('iframe.giscus-frame')`, optional chain `?.contentWindow`, `postMessage({ giscus: { setConfig: { theme: ... } } }, 'https://giscus.app')` |
| 3 | CommentsEmbed.astro has Giscus script with is:inline and data-loading='lazy' | ✓ VERIFIED | `is:inline` on line 14, `data-loading="lazy"` on line 27; `data-mapping="og:title"`, `data-reactions-enabled="1"` all present |
| 4 | global.css has all 6 Phase 6 CSS classes: .tag-cloud, .tag--cloud, .tag-count, .search-kbd-hint, #pagefind-search, .comments-section | ✓ VERIFIED | grep confirms all 6 selectors at lines 968-1009 of global.css |
| 5 | Search icon appears in header, LEFT of ThemeToggle, inside .nav-actions | ✓ VERIFIED | Header.astro line 39: `<Search />` before `<ThemeToggle />` (line 40) inside `.nav-actions` |
| 6 | Ctrl+K and clicking the search icon open a modal overlay | ✓ VERIFIED | Search.astro: `id="search-toggle"` button, `id="search-modal"` div with `role="dialog"`, keydown handler with `e.ctrlKey && e.key === 'k'`, Escape handler, backdrop click handler |
| 7 | Modal contains Pagefind search UI initialized on first open | ✓ VERIFIED | `import('/pagefind/pagefind-ui.js')` dynamic import on first open; `id="pagefind-search"` mount point; PT-BR copywriting `'Buscar posts...'`; rollupOptions.external configured in astro.config.mjs |
| 8 | CommentsEmbed appears in PostLayout after the article, before Footer, inside .stage | ✓ VERIFIED | PostLayout.astro: `import CommentsEmbed`, `<section class="comments-section">` with `<h2>Comentários</h2>` and `<CommentsEmbed />` after `<CopyCode />`; no `client:` directive (correct — uses `data-loading="lazy"` inside CommentsEmbed) |
| 9 | Tag chips in PostLayout article header link to /tags/{tag} | ✓ VERIFIED | PostLayout.astro line 33: `<a href={`/tags/${tag.toLowerCase()}`} class="tag">`; `tags?: string[]` prop added; `[...slug].astro` passes `tags={post.data.tags}` |
| 10 | Tag chips on homepage are `<a>` elements linking to /tags/{tag} (not `<span>`) | ✓ VERIFIED | index.astro line 46: `<a href={`/tags/${tag.toLowerCase()}`} class="tag">` — no remaining `<span class="tag">` in tag-row map |
| 11 | /tags/ page generates at build time with all unique tags and post counts sorted desc | ✓ VERIFIED | `src/pages/tags/index.astro` exists; Map+Set aggregation with `raw.toLowerCase()`; sort by count desc then alpha; `dist/tags/index.html` present; 13 tag directories in dist/tags/ |
| 12 | /tags/{tag} pages generate at build time with filtered non-draft posts | ✓ VERIFIED | `src/pages/tags/[tag].astro` exists with `getStaticPaths`; tagMap builds paths; PROD draft filter applied; 13 tag subdirectories in dist/tags/ (architecture, arq, aws, azure, cloud, dynamodb, eventdriven, lambda, python, sns, sqs, terraform, tutorial) |
| Human | Giscus iframe loads with real GitHub identity on live post page | ? NEEDS HUMAN | CommentsEmbed.astro has correct structure and config but placeholder `data-repo-id="REPLACE_WITH_REPO_ID"` and `data-category-id="REPLACE_WITH_CATEGORY_ID"` — authorial prerequisite pending (D-01: enable GitHub Discussions, run giscus.app wizard) |
| Human | Ctrl+K search returns results in PT-BR (Pagefind runtime behavior) | ? NEEDS HUMAN | Requires preview server + browser interaction to verify search results and PT-BR stemming (D-09) |

**Score:** 12/12 automated truths verified. 2 behaviors require human testing (live Giscus + runtime search).

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/CommentsEmbed.astro` | Giscus embed with is:inline and lazy load | ✓ VERIFIED | is:inline, data-loading="lazy", data-mapping="og:title", reactions-enabled, placeholder IDs documented |
| `src/components/ThemeToggle.astro` | Giscus postMessage bridge in applyTheme() | ✓ VERIFIED | Lines 73-78: giscus-frame querySelector + postMessage to 'https://giscus.app' |
| `src/styles/global.css` | Phase 6 CSS classes | ✓ VERIFIED | 6 selectors at lines 968-1009 |
| `package.json` | Build script with pagefind post-step | ✓ VERIFIED | `"astro build && pagefind --site dist"`, pagefind@^1.5.2 and @pagefind/default-ui@^1.5.2 in devDependencies |
| `src/components/Search.astro` | Search icon button + modal + Pagefind lazy init | ✓ VERIFIED | 106 lines; search-toggle button, search-modal dialog, Ctrl+K/Escape/backdrop handlers, dynamic import, PT-BR copywriting |
| `src/components/Header.astro` | Search left of ThemeToggle in .nav-actions | ✓ VERIFIED | Line 39 Search before line 40 ThemeToggle |
| `src/layouts/PostLayout.astro` | CommentsEmbed + tags prop + tag chips | ✓ VERIFIED | CommentsEmbed imported and rendered; tags?: string[] in Props; tag chips linking to /tags/{tag} |
| `src/pages/tags/index.astro` | /tags/ tag cloud index page | ✓ VERIFIED | getCollection + Map+Set aggregation + sortedTags + tag-cloud rendering |
| `src/pages/tags/[tag].astro` | /tags/[tag] dynamic filter pages | ✓ VERIFIED | getStaticPaths with tagMap + post cards + Todas as tags back link |
| `src/pages/index.astro` | Homepage tag chips as `<a>` links | ✓ VERIFIED | href="/tags/{tag.toLowerCase()}" on all tag chips |
| `astro.config.mjs` | rollupOptions.external for pagefind runtime | ✓ VERIFIED | `/pagefind/pagefind-ui.js` and `/pagefind/pagefind.js` externalized |
| `dist/pagefind/` | Pagefind index generated after build | ✓ VERIFIED | pagefind.js, pagefind-ui.js, pagefind-ui.css, pagefind-entry.json present |
| `dist/tags/` | 13 tag directories + index.html | ✓ VERIFIED | 13 subdirectories: architecture, arq, aws, azure, cloud, dynamodb, eventdriven, lambda, python, sns, sqs, terraform, tutorial |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/components/ThemeToggle.astro` | `https://giscus.app` | postMessage in applyTheme() | ✓ WIRED | `'https://giscus.app'` targetOrigin hardcoded; optional chain prevents null errors |
| `package.json` | `dist/pagefind/` | pagefind --site dist post-build | ✓ WIRED | Build script confirmed; dist/pagefind/ populated |
| `src/components/Header.astro` | `src/components/Search.astro` | import + `<Search />` in .nav-actions | ✓ WIRED | import on line 3, `<Search />` on line 39 |
| `src/layouts/PostLayout.astro` | `src/components/CommentsEmbed.astro` | import + `<CommentsEmbed />` in .comments-section | ✓ WIRED | import on line 6, `<CommentsEmbed />` inside section.comments-section |
| `src/components/Search.astro` | `dist/pagefind/pagefind-ui.js` | dynamic import('/pagefind/pagefind-ui.js') on first open | ✓ WIRED | Line 61: `import('/pagefind/pagefind-ui.js').then(...)` with rollupOptions.external allowing runtime resolution |
| `src/pages/tags/[tag].astro` | `astro:content getCollection` | getStaticPaths collecting tags from all non-draft posts | ✓ WIRED | `export const getStaticPaths` with `getCollection('posts', ...)` and PROD draft filter |
| `src/pages/index.astro` | `src/pages/tags/[tag].astro` | tag chip `<a href='/tags/{tag}'>` links | ✓ WIRED | `href={`/tags/${tag.toLowerCase()}`}` on all tag chip anchors |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `src/pages/tags/index.astro` | `sortedTags` | `getCollection('posts')` → Map aggregation | Yes — real post collection | ✓ FLOWING |
| `src/pages/tags/[tag].astro` | `posts` prop from getStaticPaths | `getCollection('posts')` → tagMap filter | Yes — real post collection | ✓ FLOWING |
| `src/layouts/PostLayout.astro` tag chips | `tags` prop | `[...slug].astro` passes `post.data.tags` | Yes — from content collection | ✓ FLOWING |
| `src/components/Search.astro` | search results | `import('/pagefind/pagefind-ui.js')` → PagefindUI | Yes — static index from dist/pagefind/ | ✓ FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED for Giscus (requires live external service). Pagefind and tag pages verified via build artifacts.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| dist/pagefind/ populated | `ls dist/pagefind/pagefind-ui.js dist/pagefind/pagefind.js dist/pagefind/pagefind-ui.css` | All 3 files present | ✓ PASS |
| Tag directories lowercase | `ls dist/tags/` | architecture, arq, aws, azure, cloud, dynamodb, eventdriven, lambda, python, sns, sqs, terraform, tutorial — all lowercase | ✓ PASS |
| dist/tags/index.html exists | `test -f dist/tags/index.html` | EXISTS | ✓ PASS |
| Tag chip href in built index.html | `grep "href.*tags" dist/index.html` | `<a href="/tags/{tag}" class="tag">` elements present | ✓ PASS |
| postMessage targetOrigin not wildcard | `grep "giscus.app" ThemeToggle.astro` | `'https://giscus.app'` — never `'*'` | ✓ PASS |

---

### Requirements Coverage

Requirements D-01 through D-16 are defined in `06-CONTEXT.md` (no standalone REQUIREMENTS.md file — requirement definitions are embedded in the context document). All requirement IDs claimed across the three plans are accounted for.

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| D-01 | 06-01 | Giscus uses sertaoseracloud/sertao repo; enable GitHub Discussions | ? NEEDS HUMAN | Authorial prerequisite — code ready, Discussions not yet enabled; placeholder IDs in CommentsEmbed |
| D-02 | 06-02 | Discussion thread mapping: og:title | ✓ SATISFIED | `data-mapping="og:title"` in CommentsEmbed.astro line 20 |
| D-03 | 06-02 | CommentsEmbed in PostLayout after article, inside .stage, lazy load | ✓ SATISFIED | PostLayout.astro: CommentsEmbed inside .comments-section after CopyCode; data-loading="lazy" (note: plan used `client:visible` in CONTEXT.md but RESEARCH.md correction applied — no client: directive, Giscus native lazy via data-loading=lazy) |
| D-04 | 06-01 | Giscus theme inherits dark/light via ThemeToggle postMessage bridge | ✓ SATISFIED | ThemeToggle.astro lines 73-78: postMessage to giscus-frame with theme value |
| D-05 | 06-01 | CommentsEmbed config: reactions-enabled=1, emit-metadata=0, input-position=top | ✓ SATISFIED | All three attributes present in CommentsEmbed.astro lines 22-24 |
| D-06 | 06-02 | Search modal overlay opened by icon or Ctrl+K | ✓ SATISFIED | Search.astro: ctrlKey handler, search-toggle button, search-modal overlay |
| D-07 | 06-01 | @pagefind/default-ui with CSS token overrides | ✓ SATISFIED | @pagefind/default-ui@^1.5.2 in devDependencies; #pagefind-search CSS vars in global.css |
| D-08 | 06-01 | Pagefind post-build step: astro build && pagefind --site dist | ✓ SATISFIED | package.json build script confirmed; dist/pagefind/ populated |
| D-09 | 06-01 | lang=pt-BR causes Pagefind PT stemming (no extra config) | ? NEEDS HUMAN | BaseLayout has lang="pt-BR" (verified in prior phases); Pagefind auto-detection is runtime behavior — cannot verify stemming output from files |
| D-10 | 06-02 | Search.astro plain script block, no client: directive | ✓ SATISFIED | Search.astro uses `<script>` (not `<script client:...>`) — consistent with ThemeToggle pattern |
| D-11 | 06-02 | Search icon left of ThemeToggle in .nav-actions | ✓ SATISFIED | Header.astro: `<Search />` line 39 before `<ThemeToggle />` line 40 |
| D-12 | 06-03 | Tag chips as `<a>` linking to /tags/{tag} on post cards and homepage | ✓ SATISFIED | index.astro and [tag].astro: `<a href="/tags/${tag.toLowerCase()}">` — no remaining `<span class="tag">` in tag maps |
| D-13 | 06-03 | /tags/ index with all unique tags + post counts, sorted by count desc | ✓ SATISFIED | tags/index.astro: Map+Set aggregation, sort by count desc then alpha, dist/tags/index.html generated |
| D-14 | 06-03 | /tags/[tag] dynamic route per unique tag with filtered post cards | ✓ SATISFIED | tags/[tag].astro: getStaticPaths with tagMap; 13 static tag pages in dist/tags/ |
| D-15 | 06-03 | Tag normalization: lowercase + dedup at build time; empty tags skipped | ✓ SATISFIED | .toLowerCase() in three locations (getStaticPaths param, index.astro hrefs, [tag].astro hrefs); Set<string> per-post dedup; posts with tags:[] silently skipped |
| D-16 | 06-03 | Tags source: tags field in content.config.ts (z.array(z.string()).default([])) | ✓ SATISFIED | getCollection('posts') used throughout; no schema change needed; tags field pre-existing |

**Coverage: 14/16 satisfied programmatically. D-01 and D-09 require human verification.**

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/CommentsEmbed.astro` | 17, 19 | `REPLACE_WITH_REPO_ID`, `REPLACE_WITH_CATEGORY_ID` placeholder values | ⚠️ Warning | Giscus iframe will not load until real IDs substituted. Code structure is complete and correct — this is a documented authorial prerequisite, not a code stub. No impact on search, tag pages, or theme bridge. |

**Stub classification:** The placeholder IDs are NOT a blocker for the broader phase goal — search (Pagefind), tag pages, and the theme bridge all function independently. The commenting feature specifically requires the authorial prerequisite to be completed. The plan explicitly anticipated this with a `checkpoint:human-action` gate (Plan 01 Task 0).

---

### Human Verification Required

#### 1. Giscus Comment Widget (D-01, D-03, D-05)

**Test:** Enable GitHub Discussions on `sertaoseracloud/sertao` repo (Settings → Features → Discussions). Create a category named "Comments". Run giscus.app wizard for the repo, select og:title mapping, copy `data-repo-id` and `data-category-id`. Replace `REPLACE_WITH_REPO_ID` and `REPLACE_WITH_CATEGORY_ID` in `src/components/CommentsEmbed.astro`. Run `pnpm build && pnpm preview`. Open any post page and scroll to the comments section.

**Expected:** Giscus comment widget appears with GitHub login prompt in Portuguese (`data-lang="pt"`). No console errors. Widget reflects current dark/light theme.

**Why human:** Requires live GitHub Discussions setup and external service (giscus.app) configuration. Cannot verify Giscus iframe loading from static file checks — the code structure is complete but the IDs are placeholders.

#### 2. Giscus Theme Bridge — Live Behavior (D-04)

**Test:** With Giscus loaded on a post page (after completing test 1 above), toggle the dark/light mode using the ThemeToggle button.

**Expected:** The Giscus iframe immediately switches between `dark` and `light` themes without page reload.

**Why human:** ThemeToggle postMessage code is verified in source, but the bridge effect requires a live Giscus iframe to observe.

#### 3. Pagefind Search Results (D-06, D-07, D-08)

**Test:** Run `pnpm build && pnpm preview`. Open any page. Press Ctrl+K. Type "cloud" or "terraform" in the search input.

**Expected:** Modal opens with search input focused. Results appear as you type, showing relevant posts. Closing with Escape returns focus to the toggle button.

**Why human:** Pagefind search requires the dist/ preview server. The built index and dynamic import path are verified but result quality is only observable at runtime.

#### 4. Pagefind PT-BR Stemming (D-09)

**Test:** After `pnpm build && pnpm preview`, press Ctrl+K and search "arquitetura" (lowercase).

**Expected:** Results include posts containing "Arquitetura" or "arquitetura" — confirming Portuguese language detection via `lang="pt-BR"` in `<html>`.

**Why human:** Language stemming behavior is a Pagefind runtime feature — `lang="pt-BR"` is confirmed on BaseLayout but the stemming effect cannot be verified from file inspection alone.

#### 5. Tag Page Content Accuracy (D-13, D-14)

**Test:** Navigate to `/tags/` in preview. Verify counts match actual post data. Click `aws` tag. Verify only posts tagged aws appear.

**Expected:** Correct counts displayed on /tags/ index; /tags/aws shows only aws-tagged posts with correct titles.

**Why human:** Requires rendered content inspection against actual post data.

---

### Gaps Summary

No gaps found. All 12 programmatically verifiable must-haves are VERIFIED. The 5 human verification items are runtime behaviors requiring a live browser session or external service configuration (Giscus GitHub Discussions authorial prerequisite).

The known stub (`REPLACE_WITH_REPO_ID`, `REPLACE_WITH_CATEGORY_ID`) in CommentsEmbed.astro was documented from Plan 01 as an intentional authorial prerequisite — the code structure is complete and production-ready pending the author's one-time setup of GitHub Discussions.

---

### ROADMAP Success Criteria Assessment

| Criterion | Status | Notes |
|-----------|--------|-------|
| GitHub Discussions habilitado, categoria 'Comments' criada | ? NEEDS HUMAN | Authorial action — not code |
| Giscus instalado via giscus.app config | ? NEEDS HUMAN | Placeholder IDs in CommentsEmbed.astro; code structure complete |
| CommentsEmbed in PostLayout (lazy load) | ✓ SATISFIED | Uses data-loading="lazy" (RESEARCH.md correction from CONTEXT.md `client:visible` — both achieve lazy load; plan chose the simpler approach) |
| Giscus config: categoria, og:title mapping, theme inherit | ✓ SATISFIED (partial) | og:title and theme bridge verified; categoria requires real IDs |
| Pagefind --site dist no build | ✓ SATISFIED | Build script + dist/pagefind/ confirmed |
| UI busca Ctrl+K + modal | ✓ SATISFIED | Search.astro fully wired |
| lang=pt-BR results | ? NEEDS HUMAN | Runtime behavior |
| Tag pages /tags/ + /tags/{tag} | ✓ SATISFIED | 13 tag pages + index generated |
| Tag normalization lowercase + dedup | ✓ SATISFIED | .toLowerCase() in 3 locations + Set dedup |

**Note on ROADMAP wording mismatch:** The ROADMAP success criterion says `<CommentsEmbed client:visible>` but the RESEARCH.md (06-RESEARCH.md) explicitly identifies `client:visible` as Pitfall 1 — wrong for a plain Astro component embedding an HTML script tag. The plans correctly use `data-loading="lazy"` on the Giscus script instead. This is a ROADMAP documentation lag, not a code defect — the implementation is correct.

---

_Verified: 2026-04-28T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
