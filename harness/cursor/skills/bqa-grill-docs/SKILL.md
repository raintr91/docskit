---
name: bqa-grill-docs
extractBundle: bqa-grill
description: EXCLUSIVE /bqa-grill-docs — ONLY for BA/BQA UI acceptance criteria and open questions. DO NOT trigger for dev codegen tags.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - Pre-flight: re-read this entire `SKILL.md` via a file-read tool (do not rely on memory).
> - Materialize `TODO.md` ở root from every Workflow step + optional Accelerators before other durable writes.
> - For `#missing_info` / open gaps: ArtifactGraph re-check → micro-scope → propose (Recommended) on **Chat Thread** → **STOP for member confirm** before patching settled SSOT and updating **Artifact Registry**.
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.
> - Do NOT perform a shallow check. Verify against the **Verification Checklist** via harness TODO evidence.

# /bqa-grill-docs — Spec Validation (BQA / UI)

**Mindset:** Spec Validation + Decision Resolution — **not** domain archaeology.

**Extracts:** `extractBundle: bqa-grill` → `.cursor/extracts/grill/validation.md`

## Target / ID Resolution Rule

- User prompt MAY specify a screen ID, function ID, or slug (e.g. `CMP-ADM-000-001`, `W-AD-AUTH-001`, `login`).
- Agent MUST use `docskit_route` or `docskit_get_element` (or glob search) to resolve target path under `product/surfaces/...`.
- Do NOT demand full surface/module filesystem paths from the user.

## Load policy


| Load | Do not load |
|------|-------------|
| `{function}/ir/design.yaml` | `ir/spec.yaml` / `bundle.gen` (codegen) |
| `{function}/ir/legacy.yaml` — ui slice only | Full `_legacy.dynamics.yaml` module |
| `{function}/*.bundle.yaml` — `review`, `openQuestions` | Legacy repo source, `models/` |
| `yaml/common/*/ir/design.yaml` or bundle (common UI) | Generated `md/` (trừ session BA riêng) |
| `*.test.yaml` | |

> [!IMPORTANT] MANDATORY UI ERROR HANDLING BEHAVIOR SPECIFICATION
> Agent MUST explicitly document 3 UI execution outcomes for EVERY user action / API call in `design.yaml`:
> 1. **On Success (`200/201`):** Action feedback, state transition, toast/modal feedback, navigation.
> 2. **On Common Global Error (`401/500/503`):** Default inheritance from `#ui-common:error-handler` (Global toast/redirect). Explicitly document `override: true` if UI requires custom behavior (e.g. Inline alert instead of global toast).
> 3. **On Specific Error (`422/404/403/409`):**
>    - **`422 Validation`:** Exact placement of inline field error messages (`errors: {field: [msg]}`).
>    - **`404 Not Found`:** Empty state UI / 404 Component rendering.
>    - **`403 IDOR` (`TENANT_IDOR_VIOLATION`):** Access blocked UI / Safety redirect.
>    - **`409 Conflict`:** Specific modal/dialog copywriting for duplicate data or invalid state.

## Workflow

**Step A — fact-lock** (`grillStatus.bqaFacts`)

0. Create/update `TODO.md` ở root + plan. Tech debt: `#tech-debt:*` where `deferTo: bqa-grill-docs` (`grill-tech-debt.md`).
1. Compare `design.zones/behavior/actions` vs `legacy.ui` vs common UI.
2. **Cross-check Common Patterns:** Read Markdown rules in `product/surfaces/<surface>/common/patterns/` and `product/surfaces/common/patterns/` to ensure proposed UI and business flows comply with globally defined rules (e.g., Breadcrumb flow, Delete flow).
3. **Audit UI Error Handling Flows:** Ensure every user action/API call in `design.yaml` has detailed specifications for Success, Common Global Error, and Specific Errors.
4. Patch **bundle** (`design`, `review`, `spec` requirements) → `docskit_bundle_split` / `docskit split` (fallback `pnpm docs:split`).
5. Set `grillStatus.bqaFacts: done`.
6. **Rule:** chưa `bqaFacts: done` → không thêm `openQuestions` mới.

**Step B — open-pass** (`grillStatus.bqaOpen`)

7. Ask ≤5 focused batches: copy, layout, breadcrumb, delete dialogs, testId intent, error copywriting.
8. Record decisions in `openQuestions` + tags.
9. Set `grillStatus.bqaOpen: done`.
10. User: `docs_render` / `docskit render` (fallback `pnpm docs:render`).

## Accelerators (optional)

```text
if ArtifactGraph available: grill/parity hints
else: model review from design+legacy slices (model fallback)

if Docskit available: ID → doc path for referenced CMP/FLOW
else: search docs tree (local fallback)
```

Missing optionals never block `/bqa-grill-docs`. After the existing fallback
completes, emit exactly one `docskit.missing-optional` event per `runId` +
optional against
`.cursor/schemas/docskit/missing-optional-event.schema.json`. Deduplicate
retries and report only actual `fileReads` / `contextBytes`.

## specOrigin branches

- **legacy:** design vs legacyEvidence vs common UI
- **requirement:** complete zones + common — không legacy

## Out of scope

`codegen`, `gen`, `ui.filters/columns`, `portal:gen`, implement UI.

## Handoff

→ `/dev-grill-docs`

## Verification Checklist
- [ ] Harness TODO under `TODO.md` ở root kept in sync with evidence.
- [ ] Strict compliance with Load Policy (did not load out-of-scope files like codegen or legacy source code).
- [ ] **UI Error Flow Detailed:** Every API call/user action in `design.yaml` has explicit On Success, On Common Error, and On Specific Error handling specified.
- [ ] `#missing_info` / proposals used the hard confirmation gate (no silent overwrite of settled SSOT), updated Artifact Registry after confirm.
- [ ] Step A completed with `grillStatus.bqaFacts: done` before Step B open questions.
- [ ] `grillStatus.bqaOpen: done` updated after open questions resolved.
- [ ] Executed bundle split and rendered docs.

