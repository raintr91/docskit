---
name: update-spec-legacy
extractBundle: update-spec-legacy
description: /update-spec-legacy — delta from legacy evidence.
disable-model-invocation: true
---

# /update-spec-legacy — Legacy delta patch

**Extracts:** `extractBundle: update-spec-legacy` → `.cursor/extracts/extract-registry.json`

## Load policy

| Load | Do not load |
|------|-------------|
| `_legacy.dynamics.yaml` on **base-docs** — **one slice** for target function | Full module re-archaeology |
| `bundle.legacy` delta | `codegen/*`, `test/*`, prototype |
| Evidence pointer from trace/refs | Legacy repo (unless `#legacy-recheck`) |

## Workflow

1. Receive delta from `/update-spec` or grill gap.
2. Patch trace slice + `bundle.legacy` (behaviors, fields, ui) with confidence.
3. **Micro-read** legacy file/symbol only when tagged `#legacy-recheck`.
4. `bundle_split` + `legacy_dynamics_validate` if trace changed (CLI: `docskit split` / `docskit legacy-validate`; fallback pnpm scripts).
5. Handoff → `/bqa-grill-docs` or `/dev-grill-docs` per section touched.

## Accelerators (optional)

```text
if codegraph-<legacyKey> MCP available for the resolved checkout:
  micro-read symbol evidence for #legacy-recheck
else if checkout exists without .codegraph/:
  report: cd <root> && codegraph init
  then targeted file read only (local fallback)
else: targeted file read only (local fallback)

if ArtifactGraph available: parity slice (local-only; never a shared index)
else: model review from patched legacy evidence (model fallback)
```

Never use the CodeGraph index of the currently open docs hub for another
repository. Route per `.cursor/rules/cross-repo-index.mdc` (Platform DNA SSOT).

Missing optionals never block `/update-spec-legacy`. After the existing
fallback completes, emit exactly one `docskit.missing-optional` event per
`runId` + optional against
`.cursor/schemas/docskit/missing-optional-event.schema.json`. Deduplicate
retries and report only actual `fileReads` / `contextBytes`.

## Done

- Delta backed by evidence pointer or explicit `openQuestions`.
- No full bundle replacement unless user confirms scope explosion.
