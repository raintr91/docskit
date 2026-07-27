# Module README template

Path: `product/surfaces/<surface>/modules/CMP-{NN}-{slug}/index.md` — **MD only** (yaml under `<function-slug>/code/`).

```markdown
# CMP-{NN} — Name

Lead-assigned module. **This README is MD-only** (no YAML).

Owns …

| | |
|--|--|
| **ID** | `CMP-{NN}` |
| **Business Process** | [`FLOW-…`](/architecture/03-business-process/FLOW-…) |
| **Functions** | `<function-slug>`, … |
| **Screens** | `W-…` |
| **APIs** | `API-…` |

\`\`\`mermaid
flowchart LR
  CMP[CMP-{NN}]
  W[W-…]
  API[API-…]
  CMP --> W
  CMP --> API
\`\`\`

## Code paths

- [`<function-slug>/code/W-…/`](./<function-slug>/code/W-…/)
- [`<function-slug>/code/API-…/`](./<function-slug>/code/API-…/)
```
