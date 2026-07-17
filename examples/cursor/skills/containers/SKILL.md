---
name: containers
description: /containers — arc42 §05 Building blocks; CTR-* views + CMP index links.
disable-model-invocation: true
extractBundle: architecture-core
---

# /containers — C4 Containers / building blocks (§05)

**Architecture layer:** Runtime containers (Portal · Client/HMI · API service · Gateway)
**Standards:** prose → **arc42**-lite; diagrams → **C4** `CTR-*`

## Write

- Path: `architecture/05-building-blocks/`
- IDs: `CTR-*` (description + flowchart + Code refs table)
- Name runtime ownership explicitly: `*-web`, `*-api`, `*-client`, `*-gateway`
- Keep operational areas/personas in `/context`; do not classify Admin/Worker as C4 Containers
- CMP: **index/link only** → `product/components/CMP-*` (use `/component` for README)
- Format: MD + Mermaid only

## Do not

- Embed OpenAPI / UI DSL
- Create `code/` under `05`
- Invent containers without lead ID

## Pilot

[`architecture/05-building-blocks/`](../../../architecture/05-building-blocks/) · `CTR-admin-web` · `CTR-admin-api`

Parent router: `/architecture` · CMP skill: `/component` · [Start now](../../../platform/guide/start-now.md)

## Accelerators (optional)

Prefer `hubdocs_list_ids` kind `CTR` and `hubdocs_dependents_of`.

```text
if Hubdocs available: targeted hubdocs_* tools for IDs / deps / journeys / links
else: Glob/search under architecture/ and product/, then Read scoped Markdown

Missing Hubdocs never blocks authoring.
Missing ArtifactGraph never blocks Hubdocs or architecture skills.
```

