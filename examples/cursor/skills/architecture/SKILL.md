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
| Overview · Common · **Module+** | **arc42** spirit (short — not full 01–12) | **C4** |
| **Function** | **C4** only | **C4** only |

No **dynamics** on new trees — use **flow** / `FLOW-*` / **`/journey`**.

Architecture folder: prefer **§01 intro** + **§07 deploy** for team; other chapters stub OK.

## Route map (business → skill)

| Ask / topic | Business layer | Next skill |
|-------------|----------------|------------|
| System purpose / overview / landscape / CTX | Overview | **`/context`** (+ short §01 if needed) |
| Operational area / persona / interaction channel | Context / operating model | **`/context`** |
| Portal · Client · API service · Gateway / CTR | C4 Containers | **`/containers`** |
| Module / CMP box | Module | **`/component`** |
| Screen / API detail / CRUD | Function | **`/spec`** (Bundlekit; grill as needed) — C4 only. If `/spec` unavailable: leave Function as CMP README stub + handoff note |
| `*_flow` / sequence / journey | Flow | **`/journey`** |
| Where it runs | Deploy | **`/deployment`** (stub-first) |
| ADR / decision | — | **`/decision`** |
| Cross-cutting | — | **`/cross-cutting`** |
| Constraints / strategy / quality… | — | Stub chapter only — no waffle |

Legacy arc42 chapter numbers still map the same paths under `architecture/01`…`12`.

## Rules

- Format under `architecture/`: MD + Mermaid (`flowchart` / `sequenceDiagram`; avoid Mermaid `C4Context`)
- Product Code (`W-*`/`API-*`) stays in `product/components/…/code/` — never under `05/CODE`
- API service belongs to C4 Containers; API endpoint/contract belongs to Function detail
- Prefer `/journey` over `/dynamics`
- One concern per edit

## After route

Load the child skill + extract bundle `architecture-core`.

## Accelerators (optional)

Prefer `hubdocs_route` then `hubdocs_list_ids` / `hubdocs_validate_links` / `hubdocs_journeys` before large edits.

```text
if Hubdocs available: targeted hubdocs_* tools for IDs / deps / journeys / links
else: Glob/search under architecture/ and product/, then Read scoped Markdown

Missing Hubdocs never blocks authoring.
Missing ArtifactGraph never blocks Hubdocs or architecture skills.
```

When ArtifactGraph is missing, follow `/hubdocs` fallback evidence: continue
targeted local reads, then emit one deduplicated `hubdocs.missing-optional`
event per run and optional with actual `fileReads` and `contextBytes` only.

