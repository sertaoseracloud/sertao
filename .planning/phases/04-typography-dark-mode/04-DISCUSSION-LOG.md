# Phase 4: Typography + Dark mode + Syntax highlighting - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 04-typography-dark-mode
**Areas discussed:** Light theme scope, Shiki code themes, ThemeToggle placement, Font self-hosting

---

## Light Theme Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full branded light mode | Define `[data-theme='light']` palette — lighter background, dark text, brand accents | ✓ |
| Minimal system fallback | Inherits browser defaults + white/near-white background. Not branded. | |
| Dark-only, no toggle | Remove toggle entirely. Dark is the only mode. | |

**User's choice:** Full branded light mode

---

### Light Theme Background

| Option | Description | Selected |
|--------|-------------|----------|
| Warm off-white (#F5F0E8) | Slightly warm paper feel — fits Sertão narrative. Works with navy body text. | ✓ |
| Cool light gray (#F2F4F8) | Neutral, modern. Similar to GitHub Light. | |
| Pure white (#FFFFFF) | Maximum contrast, cleanest look. | |

**User's choice:** Warm off-white #F5F0E8

---

### Light Mode Accents

| Option | Description | Selected |
|--------|-------------|----------|
| Switch to deep navy (#284068) for accents | Cyan on light fails WCAG. Navy is the safe brand color. 7.9:1 contrast on #F5F0E8. | ✓ |
| Keep cyan but darken it for light mode | Use a darker teal variant (~#0E6B6E) for brand continuity. | |

**User's choice:** Deep navy #284068 — no cyan in light mode

---

## Shiki Code Themes

| Option | Description | Selected |
|--------|-------------|----------|
| houston + github-light | Astro's own theme — brand-matching cyan accents + clean light mode | ✓ |
| github-dark + github-light | Roadmap default. Familiar but grey-black won't match page background. | |
| catppuccin-mocha + catppuccin-latte | Warm dark/light pair. More opinionated. | |
| Custom brand pair | Author a theme JSON using brand tokens. Maximum alignment, most work. | |

**User's choice:** houston + github-light

---

### Shiki Transformers

| Option | Selected |
|--------|----------|
| transformerNotationDiff | ✓ |
| transformerNotationHighlight | ✓ |
| transformerNotationFocus | ✓ |
| transformerMetaHighlight | ✓ |

**User's choice:** All 4 transformers enabled

---

## ThemeToggle Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Inside Header, right-aligned | Consistent, always visible, accessible. Header exists. | ✓ |
| Floating fixed corner | Sticky bottom/top-right. More visible, can overlap on mobile. | |
| Footer only | Minimal. Most readers won't find it. | |

**User's choice:** Header, right-aligned

---

### Toggle Style

| Option | Description | Selected |
|--------|-------------|----------|
| Icon only ☀️ / 🌙 | Sun in dark mode, moon in light mode. Clean, minimal. | ✓ |
| Icon + label 'Light' / 'Dark' | More explicit, takes more space. | |
| Sliding pill toggle | Animated CSS toggle. Polished but more markup. | |

**User's choice:** Icon only (sun/moon SVG)

---

### System Preference Detection

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-detect prefers-color-scheme on first visit | Native feel. localStorage overrides after interaction. | ✓ |
| Always start dark | Simpler FOUC logic. Brand-first. | |

**User's choice:** Auto-detect on first visit

---

## Font Self-Hosting

| Option | Description | Selected |
|--------|-------------|----------|
| Self-host all 3 current fonts | Space Grotesk + Chakra Petch + JetBrains Mono as WOFF2. Keeps brand. | ✓ |
| Replace body font with variable font | Swap to Inter Variable. Fewer files, slight brand change. | |
| Self-host body + mono, keep Chakra Petch on CDN | Pragmatic middle ground. | |

**User's choice:** Self-host all 3 fonts

---

### Font Weights

| Option | Description | Selected |
|--------|-------------|----------|
| Space Grotesk: 400, 500, 600 only | Covers all current design system usage. Smaller bundle. | ✓ |
| Space Grotesk: 300–700 (all weights) | Future-proof but larger. 300 and 700 not currently used. | |

**User's choice:** 400, 500, 600 only

---

## Claude's Discretion

- Exact WOFF2 download source (Fontsource npm, Google Fonts download, or subsetting tool)
- `@font-face` unicode-range specification
- SVG path data for sun/moon icons
- ThemeToggle component internal CSS
- Whether `@tailwindcss/typography` prose classes replace or augment the existing `.prose` class

## Deferred Ideas

- Callout/admonition components — Phase 9
- Footnote polish — Phase 9
- Reading progress indicator — Phase 9
- Table of Contents — Phase 9
