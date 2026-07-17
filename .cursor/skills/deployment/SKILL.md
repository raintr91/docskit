---
name: deployment
description: /deployment — arc42 §07 optional DEP-* stub; do not invent prod topology.
disable-model-invocation: true
extractBundle: architecture-core
---

# /deployment — Deploy (§07) — stub-first

**Business layer:** Deploy (outside module tree; architecture thin surface)  
**Standards:** short prose OK; diagrams → **C4** `DEP-*` only when placement matters. Team-facing architecture: prefer **§01 + §07** active; other chapters stub.

## Default

If the user did **not** confirm placement matters → write/keep a **short stub** only (`tpl-deployment.md`). **Refuse** to invent staging/prod diagrams.

## Write (when justified)

- Path: `architecture/07-deployment/`
- ID: `DEP-*`
- MD + Mermaid optional; no secrets
- Do **not** write local IDE/WSL machine tips into the docs hub

## Do not

- Full multi-region topology from imagination
- Confuse with journey sequences (`/journey`)

## Pilot

[`architecture/07-deployment/`](../../../architecture/07-deployment/) · `DEP-local` (minimal)

## Accelerators (optional)

Prefer `hubdocs_list_ids` kind `DEP`; refuse inventing nodes not already in MD.

```text
if Hubdocs available: targeted hubdocs_* tools for IDs / deps / journeys / links
else: Glob/search under architecture/ and product/, then Read scoped Markdown

Missing Hubdocs never blocks authoring.
Missing ArtifactGraph never blocks Hubdocs or architecture skills.
```

When ArtifactGraph is missing, follow `/hubdocs` fallback evidence: continue
targeted local reads, then emit one deduplicated `hubdocs.missing-optional`
event per run and optional with actual `fileReads` and `contextBytes` only.


Parent: `/architecture` · [Start now](../../../platform/guide/start-now.md)
