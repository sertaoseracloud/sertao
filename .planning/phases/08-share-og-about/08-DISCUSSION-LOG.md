# Phase 8: Share + OG dinâmico + About/Sobre — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 08-share-og-about
**Areas discussed:** OG template design, Share buttons placement, /sobre page structure

---

## OG Template Design

### Background style

| Option | Description | Selected |
|--------|-------------|----------|
| Dark navy solid | Solid #0A0F1E background, title in white, cyan separator line | ✓ |
| Dark + sertão texture | Dark navy + decorative geometric motif on right side | |
| Gradient dark→teal | Left-to-right #0A0F1E → #0A2525 gradient | |

**User's choice:** Dark navy solid — clean, on-brand, easy to implement with satori.

### OG fields to include

| Option | Selected |
|--------|----------|
| Title (required) | ✓ |
| Author name | ✓ |
| Site wordmark | ✓ |
| First tag | ✓ |

**Notes:** All four fields selected. User confirmed the preview showing: title → cyan separator → "Cláudio Rapôso · O Sertão será Cloud" bottom row.

---

## Share Buttons Placement

### Placement in PostLayout

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom of article only | After article, before NewsletterEmbed | |
| Top + bottom of article | Bookends — share bar before article header AND after article | ✓ |

**User's choice:** Top + bottom.

### Button style

| Option | Description | Selected |
|--------|-------------|----------|
| Icon + label | "X" "LinkedIn" "WhatsApp" "Copiar link" with inline SVG icons | ✓ |
| Icon-only with tooltip | Compact SVG icons, tooltip on hover | |
| Icon + short label | Icons with abbreviated labels ("in", "Link") | |

**User's choice:** Icon + label (full text labels).

### Copy-link feedback

| Option | Selected |
|--------|----------|
| Button text swaps to "Copiado! ✓" for 2s | ✓ |
| No feedback | |

**User's choice:** "Copiado! ✓" swap feedback.

---

## /sobre Page Structure

### Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Narrative-first | Long-form prose, photo at top-right, thesis as essay | ✓ |
| Structured sections | Clear headings (Sobre Mim, O que escrevo, etc.) | |

**User's choice:** Narrative-first prose.

### Photo

| Option | Selected |
|--------|----------|
| Yes — I'll add it to public/ | ✓ |
| No — placeholder | |

**Notes:** User confirmed they have a photo ready.

### Social links

| Option | Selected |
|--------|----------|
| GitHub | ✓ |
| LinkedIn | ✓ |
| X / Twitter | ✓ |
| Email | ✓ |

**Notes:** All four selected. LinkedIn needs to be added to `consts.ts` SOCIAL object.

---

## Claude's Discretion

- OG generation approach: satori endpoint (not discussed — Claude chose the idiomatic Astro approach)
- satori vs @resvg/resvg-js for SVG→PNG conversion
- Exact satori layout structure (padding, font sizes, flexbox)
- ShareBar hover state styling
- /sobre social links row visual treatment

## Deferred Ideas

- Floating sidebar share buttons — user chose top+bottom inline instead
- /palestras, /projetos, /uses, /agora — Phase 9 per ROADMAP
