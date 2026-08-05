---
name: grill-with-docs
extractBundle: grill-with-docs
description: EXCLUSIVE /grill-with-docs — ONLY for reconciling BQA vs Dev conflicts. DO NOT trigger for standalone dev-grill or bqa-grill.
disable-model-invocation: true
---

# /grill-with-docs — Reconcile + codegen gate

## Mindset & Scope Alignment

- **`/bqa-grill-docs`**: Business/BQA view (UI layout, copy, user action flows, acceptance criteria). **NO technical/API/database debates.**
- **`/dev-grill-docs`**: Engineering/Dev view (Database tables, data types, API routes, `#reuse-api`, codegen tags).
- **`/grill-with-docs`**: Merges and reconciles BOTH BQA Business requirements AND Dev Technical specifications when contradictions exist.

## Workflow

0. Tech debt step 0 (`grill-tech-debt.md`).
1. Resolve spec ↔ legacyEvidence ↔ design conflicts in **bundle**.
2. **Reconcile Common Patterns:** Verify that the feature bundle inherits and complies with the common patterns specified by both BQA (business flows) and Dev (`#pattern` codegen tags).
3. **Reconcile API & Tech Decisions (`#reuse-api`):** Verify Dev technical decisions (DB tables, API routes, `#reuse-api` tags) against BQA business flows. Ensure duplicate APIs are tagged `#reuse-api`.
4. Write/fix `bundle.gen` → `docskit_bundle_split` (fallback: `docskit split`).
5. If ArtifactGraph is available, use `artifactgraph_allowlist_check` +
   `artifactgraph_recommend_command` for `genDry`; never execute FE gen here.
6. `docs_render` (fallback: `docskit render`).
5. Handoff ID/path + recommendation to FE Codegenkit. Missing Codegenkit is a
   pending handoff, not a reason to invent a local shell fallback.

## Accelerators (optional)

```text
if ArtifactGraph available: reconcile/parity/tag hints + command recommendation
else: model reconcile from scoped bundle slices (model fallback)

if Docskit available: resolve referenced CMP/FLOW IDs
else: repository path conventions (deterministic fallback)
```

Missing optionals never block `/grill-with-docs`. After the existing fallback
completes, emit exactly one `docskit.missing-optional` event per `runId` +
optional against
`.cursor/schemas/docskit/missing-optional-event.schema.json`. Deduplicate
retries and report only actual `fileReads` / `contextBytes`.

## Do not

- Re-read legacy source or archaeology
- Implement UI/API

## Handoff

→ `/prototype` after FE Codegenkit dry-run passes
