---
status: partial
phase: 06-comments-search
source: [06-VERIFICATION.md]
started: 2026-04-28T00:00:00Z
updated: 2026-04-28T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Giscus iframe loads on post page
expected: After replacing placeholder IDs in CommentsEmbed.astro (REPLACE_WITH_REPO_ID and REPLACE_WITH_CATEGORY_ID) with real values from giscus.app, the Giscus iframe should appear below the article content on any post page when scrolled into view.

result: [pending — authorial prerequisite: enable GitHub Discussions, create "Comments" category, run giscus.app wizard]

### 2. Giscus theme bridge live behavior
expected: Toggling dark/light mode via ThemeToggle while a Giscus iframe is visible should update the Giscus theme in real time (dark mode → Giscus dark theme, light mode → Giscus light theme).

result: [pending — requires live Giscus iframe (see test 1)]

### 3. Pagefind search returns results
expected: Run `pnpm preview`. Open browser at localhost:4321. Press Ctrl+K — modal opens. Type a keyword (e.g., "aws") — results appear showing post titles. Press Escape — modal closes. Click search icon in header — same modal opens.

result: [pending]

### 4. PT-BR stemming in Pagefind
expected: Searching "cloud" should also surface posts containing "clouds", "nuvem", etc. (Pagefind uses lang="pt-BR" from BaseLayout for Portuguese stemming). Results should be in Portuguese.

result: [pending]

### 5. Tag page content accuracy
expected: Visit /tags/ — tag cloud shows all unique tags with post counts, sorted desc. Click a tag (e.g., /tags/aws) — filtered post list shows only posts with that tag. All tag URLs are lowercase.

result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
