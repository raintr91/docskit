---
name: grill-with-docs
extractBundle: grill-with-docs
description: /grill-with-docs — reconcile BQA↔Dev; FE dry-gen remains a handoff.
disable-model-invocation: true
---

# /grill-with-docs — Reconcile + codegen gate

**Mindset:** Spec Validation + Decision Resolution — **not** Interview / archaeology.

Doc hub: `platform/toolchain/PORTAL-CODEGEN.md`

**Extracts:** `extractBundle: grill-with-docs` → `.cursor/extracts/grill/validation.md`

## Load policy

| Load | Do not load |
|------|-------------|
| `*.bundle.yaml`, `ir/design.yaml`, `ir/legacy.yaml` | Legacy repo source, `models/` |
| `ir/spec.yaml` or `bundle.gen` (reconcile codegen) | Full module trace |
| `*.test.yaml`, testcase YAML | `platform-repos` / `legacy-repos` full read |
| `codegen/readiness.md`, `codegen/tags.md` | |

## When to use

- After `/bqa-grill-docs` + `/dev-grill-docs` when **contradiction** remains
- **Not** default after `/legacy-spec`

## Workflow

0. Tech debt step 0 (`grill-tech-debt.md`).
1. Resolve spec ↔ legacyEvidence ↔ design conflicts in **bundle**.
2. Write/fix `bundle.gen` → `bundle_split` (fallback: `bundlekit split`).
3. If ArtifactGraph is available, use `artifactgraph_allowlist_check` +
   `artifactgraph_recommend_command` for `genDry`; never execute FE gen here.
4. `docs_render` (fallback: `bundlekit render`).
5. Handoff ID/path + recommendation to FE Codegenkit. Missing Codegenkit is a
   pending handoff, not a reason to invent a local shell fallback.

## Accelerators (optional)

```text
if ArtifactGraph available: reconcile/parity/tag hints + command recommendation
else: model reconcile from scoped bundle slices (model fallback)

if Hubdocs available: resolve referenced CMP/FLOW IDs
else: repository path conventions (deterministic fallback)
```

Missing optionals never block `/grill-with-docs`. After the existing fallback
completes, emit exactly one `bundlekit.missing-optional` event per `runId` +
optional against
`.cursor/schemas/bundlekit/missing-optional-event.schema.json`. Deduplicate
retries and report only actual `fileReads` / `contextBytes`.

## Do not

- Re-read legacy source or archaeology
- Implement UI/API

## Handoff

→ `/prototype` after FE Codegenkit dry-run passes
