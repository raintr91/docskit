---
name: architecture
description: /architecture — route context/operations, containers, modules, functions, flows, and deployment.
disable-model-invocation: true
extractBundle: architecture-core
---

# /architecture — router (business layers → skills)

Ask which **business layer** (or infer). Then load the child skill — do **not** write every arc42 chapter in one pass.

People map: [`platform/guide/start-now.md`](../../../platform/guide/start-now.md)  
Tree + standards: [`platform/guide/SYSTEM-DOC-STRUCTURE.md`](../../../platform/guide/SYSTEM-DOC-STRUCTURE.md)

## Content standards (all child skills)

| Layer | Prose (text) | Diagrams / DB / sequence |
|-------|--------------|---------------------------|
| Overview · Surfaces · **Module+** | **Architecture/Product** spirit | **C4** / **Mermaid** |
| **Function** | **C4** only | **C4** only |

No **dynamics** on new trees — use **flow** / `FLOW-*` / **`/journey`** or **`/business-process`**.

Architecture folder: prefer **System Context** + **Deployment** for team; other chapters stub OK.

## Route map (business → skill)

| Ask / topic | Business layer | Next skill |
|-------------|----------------|------------|
| Operational area / persona / business purpose | Overview | **`/overview`** |
| Common scope / Cross-service / Database / Business processes | Surfaces / Modules | **`/business-process`**, **`/db-erd`**, **`/cross-service`** |
| Admin Web · Client · Gateway / App level | Surfaces | **`/surfaces`** |
| System Context / Landscape / CTX | Architecture Context | **`/system-context`** |
| Portal · Client · API service · Gateway / CTR | Architecture Containers | **`/containers`** |
| Module / CMP box | Module | **`/module`** |
| Screen / API detail / CRUD | Function | **`/spec`** (grill with **`/spec-grill`** as needed) |
| `*_flow` / sequence / runtime journey | Flow / Journey | **`/journey`** |
| Where it runs | Deploy | **`/deployment`** |
| Architecture discussion / grilling | High-level Design | **`/architecture-grill`** |

## Rules

- Format: MD + Mermaid (`flowchart` / `sequenceDiagram`; avoid Mermaid `C4Context`)
- Product Code (`W-*`/`API-*`) stays in `product/components/…/code/`
- API service belongs to C4 Containers; API endpoint/contract belongs to Function detail
- Prefer `/journey` over `/dynamics`
- One concern per edit

## After route

Load the child skill + extract bundle `architecture-core`.

## Accelerators (optional)

Prefer `docskit_route` then `docskit_list_ids` / `docskit_validate_links` / `docskit_journeys` before large edits.

```text
if Docskit available: targeted docskit_* tools for IDs / deps / journeys / links
else: Glob/search under architecture/ and product/, then Read scoped Markdown

Missing Docskit never blocks authoring.
Missing ArtifactGraph never blocks Docskit or architecture skills.
```

When ArtifactGraph is missing, follow `/docskit` fallback evidence: continue
targeted local reads, then emit one deduplicated `docskit.missing-optional`
event per run and optional with actual `fileReads` and `contextBytes` only.

