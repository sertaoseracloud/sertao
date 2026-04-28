# Phase 5: First Post Shipped (GATE) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 05-first-post-shipped
**Areas discussed:** GitHub Pages + DNS timing, Lighthouse threshold, Post-mortem + glossary

---

## GitHub Pages + DNS Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Not yet — still pending | Plan needs a hard blocking checkpoint | |
| Already enabled | CI deploy workflow can already push to GitHub Pages | ✓ |

**DNS status:**
| Option | Selected |
|--------|----------|
| DNS not configured yet | |
| DNS configured, HTTPS resolving | ✓ |

**Notes:** Phase 1 authorial blocker is cleared. sertaoseracloud.com is live.

---

## Lighthouse Threshold

| Option | Description | Selected |
|--------|-------------|----------|
| Keep at 90 for all scores | Ship v1.0 with 90 as baseline | ✓ |
| Raise A11y to 95 | Phase 3 planned to raise in Phase 5 | |

**Manual Lighthouse run:**
| Option | Selected |
|--------|----------|
| CI gate is sufficient | ✓ |
| Include manual local Lighthouse run | |

---

## Post-Mortem + Glossary

| Option | Description | Selected |
|--------|-------------|----------|
| Lightweight — glossary.json + STATE.md notes | No formal doc | ✓ |
| Formal post-mortem doc | Structured post-mortem document | |

**PR corrections:**
| Option | Selected |
|--------|----------|
| Commit corrected terms to glossary.json in Phase 5 (before merging PR) | ✓ |
| Merge PR as-is, update glossary follow-up | |

---

## Claude's Discretion

- Exact article chosen for first post
- Whether hello-sertao.md stays visible after first real post
- Whether to sync additional existing articles

## Deferred Ideas

- Lighthouse A11y gate raised to 95 — Phase 9
- Formal post-mortem doc — v1.0 uses lightweight approach
