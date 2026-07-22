---
name: component
description: /component — CMP-* README under product/components (MD-only); Code stays in code/.
disable-model-invocation: true
extractBundle: architecture-core
---

# /component — Module (CMP)

**Business layer:** Module  
**Standards:** README prose → **arc42** (why this capability exists, which operational areas it supports); relation diagrams → **C4**. Function detail → `/spec` (**C4 only**, Docskit). If `/spec` is unavailable: keep Function off the README and record an explicit Docskit handoff.

## Write

- **CRITICAL DIRECTORY STRUCTURE**: You MUST create a dedicated directory for the module (`product/components/CMP-{NN}-{slug}/`) and place the documentation inside `index.md`. **DO NOT** create a single file like `CMP-{NN}-{slug}.md`.
- Path: `product/components/CMP-{NN}-{slug}/index.md`
- Update `product/components/index.md` table
- Update `architecture/05-building-blocks/` Components index when adding CMP
- Template: `.cursor/extracts/tpl-component.md` (column **Journey**, not Dynamics)
- Format: **MD only** on README; yaml only under `code/W-*` / `code/API-*`
- Map the module to relevant operational areas/personas and runtime `CTR-*`; do not duplicate the module per area

## Do not

- Scaffold FE `pages/` / composables (docs hub)
- Put API/UI contracts on the README (those are functions)
- Place CMP Code under `architecture/05`
- Call trees **dynamics** — journeys are `FLOW-*` / `/journey`

## Pilot

[`CMP-01-auth`](../../../product/components/CMP-01-auth/) · Journey [`FLOW-login`](../../../architecture/06-runtime/journeys/FLOW-login.md)

Parent: `/architecture` · sequences → `/journey` · [Start now](../../../platform/guide/start-now.md) · [Structure](../../../platform/guide/SYSTEM-DOC-STRUCTURE.md)

## Accelerators (optional)

Prefer `docskit_get_element` / `docskit_deps_of` for `CMP-*` before editing README.

```text
if Docskit available: targeted docskit_* tools for IDs / deps / journeys / links
else: Glob/search under architecture/ and product/, then Read scoped Markdown

Missing Docskit never blocks authoring.
Missing ArtifactGraph never blocks Docskit or architecture skills.
```

When ArtifactGraph is missing, follow `/docskit` fallback evidence: continue
targeted local reads, then emit one deduplicated `docskit.missing-optional`
event per run and optional with actual `fileReads` and `contextBytes` only.

