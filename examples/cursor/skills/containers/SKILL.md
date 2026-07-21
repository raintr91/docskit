---
name: containers
description: /containers — Runtime Containers; CTR-* views + CMP index links.
disable-model-invocation: true
extractBundle: architecture-core
---

# /containers — C4 Containers / building blocks

**Architecture layer:** Runtime containers (Portal · Client/HMI · API service · Gateway)
**Standards:** prose → **Architecture/Product**-lite; diagrams → **C4** `CTR-*`

## Write

- Path: `Architecture/Runtime Containers/`
- IDs: `CTR-*` (description + flowchart + Code refs table)
- Name runtime ownership explicitly: `*-web`, `*-api`, `*-client`, `*-gateway`
- Keep operational areas/personas in `/overview` or `/system-context`; do not classify Admin/Worker as C4 Containers
- CMP: **index/link only** → `Surfaces/[Surface]/Modules/CMP-*` (use `/module` for README)
- Format: MD + Mermaid only

## Do not

- Embed OpenAPI / UI DSL
- Create `code/` under `05`
- Invent containers without lead ID

## Pilot

## Pilot

[`Architecture/Runtime Containers/`](../../../Architecture/Runtime Containers/) · `CTR-admin-web` · `CTR-admin-api`

Parent router: `/architecture` · CMP skill: `/module` · [Start now](../../../platform/guide/start-now.md)

## Accelerators (optional)

Prefer `hubdocs_list_ids` kind `CTR` and `hubdocs_dependents_of`.

```text
if Hubdocs available: targeted hubdocs_* tools for IDs / deps / journeys / links
else: Glob/search under architecture/ and product/, then Read scoped Markdown

Missing Hubdocs never blocks authoring.
Missing ArtifactGraph never blocks Hubdocs or architecture skills.
```

When ArtifactGraph is missing, follow `/hubdocs` fallback evidence: continue
targeted local reads, then emit one deduplicated `hubdocs.missing-optional`
event per run and optional with actual `fileReads` and `contextBytes` only.

