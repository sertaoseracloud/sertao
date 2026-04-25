# TOGAF 10 Detailed Phase Reference

## ADM Phase Flow

```text
                    ┌─────────────────────────────────────┐
                    │         PRELIMINARY PHASE           │
                    │   (Architecture Capability Setup)   │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │       PHASE A: VISION               │
                    │   (Scope, Stakeholders, Approval)   │
                    └─────────────────┬───────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌─────────────────┐           ┌───────────────┐
│   PHASE B     │           │    PHASE C      │           │   PHASE D     │
│   Business    │◄─────────►│   Info Systems  │◄─────────►│  Technology   │
│ Architecture  │           │  Architecture   │           │ Architecture  │
└───────┬───────┘           └────────┬────────┘           └───────┬───────┘
        │                            │                            │
        └────────────────────────────┼────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │  PHASE E: OPPORTUNITIES/SOLUTIONS│
                    │     (Work Packages, Approach)    │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │    PHASE F: MIGRATION PLANNING   │
                    │     (Roadmap, Dependencies)      │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │  PHASE G: IMPLEMENTATION GOV.    │
                    │    (Oversight, Compliance)       │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │ PHASE H: ARCHITECTURE CHANGE MGT │
                    │    (Evolution, New Cycles)       │
                    └──────────────────────────────────┘

          ╔═══════════════════════════════════════════════╗
          ║        REQUIREMENTS MANAGEMENT                ║
          ║   (Cross-cutting - operates in all phases)    ║
          ╚═══════════════════════════════════════════════╝
```

## Phase Inputs and Outputs

### Preliminary Phase

| Input | Output |
| --- | --- |
| Business principles | Architecture principles catalog |
| IT strategy | Tailored architecture framework |
| Organizational structure | Organization model for EA |
| Existing frameworks | Architecture repository structure |

### Phase A: Architecture Vision

| Input | Output |
| --- | --- |
| Request for architecture work | Architecture vision document |
| Business principles | Stakeholder map |
| Architecture repository | Statement of architecture work |
| Capability assessments | Approved architecture work |

### Phase B: Business Architecture

| Input | Output |
| --- | --- |
| Architecture vision | Business architecture document |
| Gap analysis | Baseline business architecture |
| Business scenarios | Target business architecture |
| | Business architecture gaps |

### Phase C: Information Systems Architecture

| Input | Output |
| --- | --- |
| Business architecture | Data architecture document |
| | Application architecture document |
| | Data/application architecture gaps |
| | Updated requirements |

### Phase D: Technology Architecture

| Input | Output |
| --- | --- |
| Business architecture | Technology architecture document |
| Data/application architecture | Technology standards catalog |
| Technology repository | Technology architecture gaps |
| | Updated requirements |

### Phase E: Opportunities and Solutions

| Input | Output |
| --- | --- |
| All architecture gaps | Implementation projects list |
| Transition requirements | Transition architectures |
| | Work package definitions |
| | Implementation approach |

### Phase F: Migration Planning

| Input | Output |
| --- | --- |
| Implementation projects | Implementation roadmap |
| Transition architectures | Migration plan |
| Business constraints | Resource estimates |
| | Prioritized projects |

### Phase G: Implementation Governance

| Input | Output |
| --- | --- |
| Implementation plan | Architecture compliance assessments |
| Architecture contracts | Change requests |
| | Implementation governance |
| | Sign-off on implementations |

### Phase H: Architecture Change Management

| Input | Output |
| --- | --- |
| Change requests | Architecture updates |
| Technology landscape changes | Recommendations for new cycles |
| Business requirement changes | Approved changes |

## Iteration Patterns

The ADM supports three iteration patterns:

### Architecture Development Iteration

Complete cycling through phases B, C, D to refine architectures.

### Architecture Capability Iteration

Iteration within Preliminary phase to mature EA capability.

### Transition Planning Iteration

Iteration between phases E and F to refine implementation approach.

## Key Artifacts by Phase

| Phase | Key Artifacts |
| --- | --- |
| Preliminary | Architecture principles, EA org model |
| A | Vision document, stakeholder map |
| B | Process models, capability maps |
| C | Data models, application portfolio |
| D | Technology standards, infrastructure diagrams |
| E | Work packages, transition architectures |
| F | Roadmap, migration plan |
| G | Compliance assessments, contracts |
| H | Architecture updates, change log |

## Reference

Based on TOGAF Standard, Version 10 by The Open Group.
