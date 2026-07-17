---
name: context
description: /context — arc42 §03 Context; LND-* and CTX-* (MD + Mermaid).
disable-model-invocation: true
extractBundle: architecture-core
---

# /context — Overview / operating context (§03)

**Business layer:** Overview, actors/personas, operational areas, interaction channels
**Standards:** prose → **arc42**; diagrams → **C4** (`flowchart`, avoid Mermaid `C4Context`)

## Write

- Path: `architecture/03-context/`
- IDs: `LND-*`, `CTX-*` (D3: landscape lives here)
- Format: MD + Mermaid; prefer `flowchart`
- Template: `tpl-arc42-chapter.md` + pilot sections in `03-context/index.md`
- Keep text concise: purpose, actors, operational areas, interaction channels, boundary, and constraints
- Keep Portal/Client/API/Gateway runtime decomposition in `/containers`

## Do not

- API schemas / UI DSL
- Put LND under `05-building-blocks`
- Duplicate CTR/CMP here

## Pilot

[`architecture/03-context/`](../../../architecture/03-context/) · `LND-base` · `CTX-admin`

Parent router: `/architecture` · People: [Start now](../../../platform/guide/start-now.md)

## Accelerators (optional)

Prefer `hubdocs_list_ids` kind `CTX`|`LND` and `hubdocs_route`.

```text
if Hubdocs available: targeted hubdocs_* tools for IDs / deps / journeys / links
else: Glob/search under architecture/ and product/, then Read scoped Markdown

Missing Hubdocs never blocks authoring.
Missing ArtifactGraph never blocks Hubdocs or architecture skills.
```

