---
name: journey
description: /journey — product runtime journeys (FLOW-*).
disable-model-invocation: true
extractBundle: architecture-core
---

# /journey — Flow (`FLOW-*` / `*_flow`)

**Business layer:** Runtime Journeys  
**Standards:** 1–2 lines purpose OK; body diagram → **C4 `sequenceDiagram`**. Skill name stays **`/journey`** — do not say *dynamics* on new docs trees.

## Write

- Path: `Architecture/Runtime Journeys/` — files `FLOW-*.md`
- Format: **MD + Mermaid only** — `sequenceDiagram` preferred
- May reference Code IDs (`W-*`, `API-*`, `CTR-*`) on steps/diagram only
- Apply curated criteria (extract `tpl-journey.md` / `architecture-core.md`)
- Keep one `FLOW-*` file; state whether it crosses operational areas, modules, or runtime containers

## Do not

- Endpoint contracts → `product/surfaces/.../modules/CMP-*/code/API-*` or `shared/api-catalog`
- UI DSL → `code/W-*`
- Full backlog of every story — only ~10–20% core/hard/cross-system
- Confuse with `product/legacy-dynamics/` or `/business-process-trace` (brownfield)
- Name folders/nav **dynamics** for new work

## Aliases

- `/dynamics` → thin redirect to this skill (deprecated wording)
- `/flow-trace` → deprecated redirect to `/business-process-trace` — **not** product `FLOW-*`
- `/business-process-trace` → observed process through code/evidence

## Accelerators (optional)

Prefer `docskit_journeys`, `docskit_deps_of`, `docskit_orphans` before adding a journey.

```text
if Docskit available: targeted docskit_* tools for IDs / deps / journeys / links
else: Glob/search under architecture/ and product/, then Read scoped Markdown

Missing Docskit never blocks authoring.
Missing ArtifactGraph never blocks Docskit or architecture skills.
```

When ArtifactGraph is missing, follow `/docskit` fallback evidence: continue
targeted local reads, then emit one deduplicated `docskit.missing-optional`
event per run and optional with actual `fileReads` and `contextBytes` only.


Pilot: [`FLOW-login`](../../../Architecture/Runtime Journeys/FLOW-login.md) · [Start now](../../../platform/guide/start-now.md)
