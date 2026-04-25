# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev            # start dev server (Astro on localhost:4321)
pnpm build          # static build → dist/
pnpm preview        # preview built output
pnpm format         # Prettier format all files
pnpm format:check   # check formatting without writing
pnpm sync:devto     # run dev.to→PT-BR sync pipeline (Phase 2+)
```

Run type checking:
```bash
pnpm astro check    # Astro TypeScript diagnostics
```

Run unit tests (Phase 2+, once installed):
```bash
pnpm test:sync      # node:test suite for sync pipeline components
```

## Architecture

### Stack
- **Astro 6** SSG with TypeScript strict mode (`astro/tsconfigs/strict`)
- **Tailwind v4** via `@tailwindcss/vite` Vite plugin — NOT the legacy `@astrojs/tailwind` integration
- **MDX** via `@astrojs/mdx` for post content
- **pnpm 9.15.0 / Node ≥22.12.0** — `package.json` has `"type": "module"` (ESM only)
- Deploy: GitHub Actions → GitHub Pages at `sertaoseracloud.com`

### Content pipeline
Posts live in `src/content/posts/*.md`. The Zod schema in `src/content.config.ts` is the canonical source of truth for all frontmatter fields. The sync pipeline (`scripts/sync-devto.ts`, Phase 2) writes these files — PRBuilder output must match this schema exactly.

Key schema fields: `title`, `description`, `pubDate`, `draft`, `tags`, `source.*` (populated by sync pipeline), `canonical_url`, `manual_override`.

### Design system
"Código Chama Azul" design system tokens live as CSS custom properties in `src/styles/global.css`. Brand palette rules:
- `--color-text-primary` (`#284068`) — safe for body text (WCAG AA ✓)
- `--color-accent` (`#14878c`) — icons ≥24px or large headings only (fails WCAG AA at body size)
- `--color-decorative` (`#65d7b1`) — backgrounds/borders only (fails WCAG AA for any text)

Font stack: Space Grotesk / Chakra Petch / JetBrains Mono (from design system; overrides early planning docs that mention Inter/Fira Code).

**Known TODO:** `src/styles/global.css` has a Google Fonts import that must be replaced with self-hosted WOFF2 before Phase 5 (First Post Shipped). This is tracked as a blocker in `.planning/STATE.md`.

### Sync pipeline (Phase 2)
`scripts/sync-devto.ts` is the entry point for the dev.to→PT-BR translation pipeline. Five components:
1. **DevToClient** — Forem API two-step fetch (listing → per-article; `body_markdown` only in per-article)
2. **DiffDetector** — SHA-256 of normalized `body_markdown` vs `source.hash` in committed frontmatter
3. **Translator** — Claude Haiku 4.5 section-by-section (split on H2/H3), glossary in system prompt
4. **GlossaryEnforcer** — hard fail if any `preserve_as_is` term from `.planning/glossary.json` drifts
5. **PRBuilder** — writes `src/content/posts/{slug}.md` + `src/content/posts/images/` + opens PR draft

All components use dependency injection (accept `fetchFn`/`anthropicClient` as parameters) for testability without real API calls.

### GitHub Actions
- `.github/workflows/deploy.yml` — triggered on push to `main`; pnpm/action-setup@v4 + setup-node@v4 setup pattern is canonical (replicate in any new workflow)
- `.github/workflows/sync-devto.yml` (Phase 2) — sync trigger workflow

### Planning system
Project uses GSD (`.planning/`). Key files:
- `.planning/ROADMAP.md` — phase breakdown and success criteria
- `.planning/phases/{NN}-{slug}/` — per-phase CONTEXT.md, RESEARCH.md, PLAN.md files
- `.planning/glossary.json` — translation glossary (update after any PR requiring editorial correction)
- `.planning/STATE.md` — current position and blockers
