# CMP README template

Path: `product/components/CMP-{NN}-{slug}/index.md` — **MD only** (yaml under `code/`).

```markdown
# CMP-{NN} — Name

Lead-assigned component. **This README is MD-only** (no YAML).

Owns …

| | |
|--|--|
| **ID** | `CMP-{NN}` |
| **Containers** | `CTR-…` |
| **Journey** | [`FLOW-…`](/architecture/06-runtime/journeys/FLOW-…) |
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

- [`code/W-…/`](./code/W-…/)
- [`code/API-…/`](./code/API-…/)
```
