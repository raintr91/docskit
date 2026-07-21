---
name: bqa-grill-docs
extractBundle: bqa-grill
description: /bqa-grill-docs — BA grill design+legacy in bundle.
disable-model-invocation: true
---

# /bqa-grill-docs — Spec Validation (BQA / UI)

**Mindset:** Spec Validation + Decision Resolution — **not** domain archaeology.

**Extracts:** `extractBundle: bqa-grill` → `.cursor/extracts/grill/validation.md`

## Load policy

| Load | Do not load |
|------|-------------|
| `{function}/ir/design.yaml` | `ir/spec.yaml` / `bundle.gen` (codegen) |
| `{function}/ir/legacy.yaml` — ui slice only | Full `_legacy.dynamics.yaml` module |
| `{function}/*.bundle.yaml` — `review`, `openQuestions` | Legacy repo source, `models/` |
| `yaml/common/*/ir/design.yaml` or bundle (common UI) | Generated `md/` (trừ session BA riêng) |
| `*.test.yaml` | |

## Workflow

**Step A — fact-lock** (`grillStatus.bqaFacts`)

0. Tech debt: `#tech-debt:*` where `deferTo: bqa-grill-docs` (`grill-tech-debt.md`).
1. Compare `design.zones/behavior/actions` vs `legacy.ui` vs common UI.
2. Patch **bundle** (`design`, `review`, `spec` requirements) → `bundle_split` / `bundlekit split` (fallback `pnpm spec:split`).
3. Set `grillStatus.bqaFacts: done`.
4. **Rule:** chưa `bqaFacts: done` → không thêm `openQuestions` mới.

**Step B — open-pass** (`grillStatus.bqaOpen`)

5. Ask ≤5 focused batches: copy, layout, breadcrumb, delete dialogs, testId intent.
6. Record decisions in `openQuestions` + tags.
7. Set `grillStatus.bqaOpen: done`.
8. User: `docs_render` / `bundlekit render` (fallback `pnpm docs:render`).

## Accelerators (optional)

```text
if ArtifactGraph available: grill/parity hints
else: model review from design+legacy slices (model fallback)

if Hubdocs available: ID → doc path for referenced CMP/FLOW
else: search docs tree (local fallback)
```

Missing optionals never block `/bqa-grill-docs`. After the existing fallback
completes, emit exactly one `bundlekit.missing-optional` event per `runId` +
optional against
`.cursor/schemas/bundlekit/missing-optional-event.schema.json`. Deduplicate
retries and report only actual `fileReads` / `contextBytes`.

## specOrigin branches

- **legacy:** design vs legacyEvidence vs common UI
- **requirement:** complete zones + common — không legacy

## Out of scope

`codegen`, `gen`, `ui.filters/columns`, `portal:gen`, implement UI.

## Handoff

→ `/dev-grill-docs`
