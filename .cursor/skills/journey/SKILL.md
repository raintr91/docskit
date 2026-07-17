---
name: journey
description: /journey — product runtime journeys (FLOW-*) under arc42 §06; replaces /dynamics for new work.
disable-model-invocation: true
extractBundle: architecture-core
---

# /journey — Flow (`FLOW-*` / `*_flow`)

**Business layer:** Flow (optional node on the tree)  
**Standards:** 1–2 lines purpose OK (arc42-lite); body diagram → **C4 `sequenceDiagram`**. Skill name stays **`/journey`** — do not say *dynamics* on new docs trees.

## Write

- Path: `architecture/06-runtime/journeys/` — files `FLOW-*.md` (catalog: `06-runtime/index.md`)
- Format: **MD + Mermaid only** — `sequenceDiagram` preferred
- May reference Code IDs (`W-*`, `API-*`, `CTR-*`) on steps/diagram only
- Apply curated criteria (extract `tpl-journey.md` / `architecture-core.md`)
- Keep one `FLOW-*` file; state whether it crosses operational areas, modules, or runtime containers

## Do not

- Endpoint contracts → `product/components/.../code/API-*` or `shared/api-catalog`
- UI DSL → `code/W-*`
- Full backlog of every story — only ~10–20% core/hard/cross-system
- Confuse with `product/legacy-dynamics/` or `/business-process-trace` (brownfield)
- Name folders/nav **dynamics** for new work

## Aliases

- `/dynamics` → thin redirect to this skill (deprecated wording)
- `/flow-trace` → deprecated redirect to `/business-process-trace` — **not** product `FLOW-*`
- `/business-process-trace` → observed process through code/evidence

## Accelerators (optional)

Prefer `hubdocs_journeys`, `hubdocs_deps_of`, `hubdocs_orphans` before adding a journey.

```text
if Hubdocs available: targeted hubdocs_* tools for IDs / deps / journeys / links
else: Glob/search under architecture/ and product/, then Read scoped Markdown

Missing Hubdocs never blocks authoring.
Missing ArtifactGraph never blocks Hubdocs or architecture skills.
```


Pilot: [`FLOW-login`](../../../architecture/06-runtime/journeys/FLOW-login.md) · [Start now](../../../platform/guide/start-now.md)
