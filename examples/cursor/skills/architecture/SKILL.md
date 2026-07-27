---
name: architecture
description: /architecture — route overview, surfaces, modules, functions, flows, and deployment.
disable-model-invocation: true
extractBundle: architecture-core
---

# /architecture — router (business layers → skills)

Ask which **business layer** (or infer). Then load the child skill.

People map: [`platform/guide/start-now.md`](../../../platform/guide/start-now.md)  
Tree + standards: [`platform/guide/SYSTEM-DOC-STRUCTURE.md`](../../../platform/guide/SYSTEM-DOC-STRUCTURE.md)

## Route map (business → skill)

| Ask / topic | Business layer | Next skill |
|-------------|----------------|------------|
| Operational area / persona / business purpose | Overview | **`/overview`** |
| Common scope / Cross-service / Database / Business processes | Surfaces / Modules | **`/business-process`**, **`/db-erd`**, **`/cross-service`** |
| Business surfaces (who does what on which channel) | Surfaces | **`/surfaces`** |
| Module / CMP box | Module | **`/module`** |
| Screen / API detail / CRUD | Function | **`/spec`** (grill with **`/spec-grill`** as needed) |
| Where it runs / Physical infrastructure | Deploy | **`/deployment`** |
| Architectural decisions | ADR | **`/decision`** |
| Architecture discussion / grilling | High-level Design | **`/grill`**, **`/architecture-grill`** |

## Rules

- Format: MD + Mermaid (`flowchart` / `sequenceDiagram`)
- Treat `Surfaces` as business surfaces, not projects or repos.
- Product Code (`W-*`/`API-*`) stays in `product/surfaces/<surface>/modules/CMP-*/<slug>/code/`
- API endpoint/contract belongs to Function detail.
- One concern per edit.

## After route

Load the child skill + extract bundle `architecture-core`.

## Accelerators (optional)

Prefer `docskit_route` then `docskit_list_ids` / `docskit_validate_links` / `docskit_business_processes` before large edits.

```text
if Docskit available: targeted docskit_* tools for IDs / deps / processes / links
else: Glob/search under architecture/ and product/, then Read scoped Markdown

When ArtifactGraph is missing, follow `/docskit` fallback evidence: continue
with plain read tools and ID greps.
```
