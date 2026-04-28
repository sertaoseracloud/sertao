---
status: partial
phase: 04-typography-dark-mode
source: [04-VERIFICATION.md]
started: 2026-04-27T00:00:00Z
updated: 2026-04-27T00:00:00Z
---

## Current Test

[awaiting human testing — requires pnpm dev + live browser]

## Tests

### 1. ThemeToggle dark/light switch
expected: Page switches between dark (#0A0F1E bg, cyan accents) and light (#F5F0E8 bg, navy #284068 accents). Sun icon in dark mode, moon icon in light. Icons swap on click. Preference persists across page reloads.
result: [pending]

### 2. FOUC + prefers-color-scheme detection
expected: Hard-reload with no localStorage — if OS is light mode, light theme applied immediately with no flash. If OS is dark, dark theme applied. No FOUC before FOUC script runs.
result: [pending]

### 3. Shiki dual-theme code block rendering
expected: /posts/hello-sertao — dark mode shows houston theme (dark blue ~#17191e bg, cyan tokens); light mode shows github-light (white bg, standard tokens). Switch is instant (no reload).
result: [pending]

### 4. CopyCode button clipboard interaction
expected: Click "Copiar" → shows "✓" for 1.5s → resets to "Copiar". Pasted content matches code block text exactly.
result: [pending]

### 5. No Google Fonts network requests
expected: DevTools Network → Fonts filter shows zero requests to fonts.googleapis.com or fonts.gstatic.com. All font requests serve from /fonts/*.woff2. Space Grotesk 400 is preloaded first.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps

### Deferred to Phase 5
- Core Web Vitals (LCP <2.5s, INP <200ms, CLS <0.1) — requires live deployed URL
- Bundle JS <50KB on post page — requires live Lighthouse run
