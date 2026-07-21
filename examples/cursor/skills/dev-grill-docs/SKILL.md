---
name: dev-grill-docs
extractBundle: dev-grill
description: /dev-grill-docs — Docs-side dev grill for codegen tags + bundle.gen; execution hands off to FE.
disable-model-invocation: true
---

# /dev-grill-docs — Dev / codegen grill

Doc hub: `platform/toolchain/PORTAL-CODEGEN.md`

**Extracts:** `extractBundle: dev-grill` → `codegen/readiness.md`, `platform-mark-detect.md`

## Load policy

| Load | Do not load |
|------|-------------|
| `ir/design.yaml`, `ir/legacy.yaml` (behaviors, fields) | Legacy source, `models/` |
| `bundle.spec` (api, entities, ui.routes) | Full trace module |
| `codegen/*`, `legacy/legacy-api-migration.md`, `platform-mark-detect.md` | UX copy debates |

## Workflow

1. Expect `grillStatus.bqaOpen: done` (or `bqaFacts` for requirement-only).
2. Derive from design + legacy behaviors → write **`bundle.gen`** (or patch `ir/spec.yaml` then `pnpm spec:merge`):
   - `codegen`, `tags`, `ui.filters`, `ui.columns`, `ui.composition`, `ui.testIds`
   - `api.endpoints[].action`
3. Giữ `#needs-component`, `#manual-composable`, `#skip-codegen`, `#wire-only`, `#phase-api`.
4. List: `#gen:test-schema`, `#gen:test-service` · Create: `#gen:test-validation`
5. **Common candidates** — scan columns, toolbar, filters, composables:
   - Prefer `artifactgraph_grill_check` / `artifactgraph_analyze` on `ir/spec.yaml` when MCP wired
   - Mỗi `render: custom` → `#needs-component: cell-{key}:MoXxx` **hoặc** Mo* trong design registry
   - Widget lạ → `lookupAlias()` → `#ui:` / `#needs-ui:`
   - Logic lặp (export, auth) → hỏi member `#common:` / `#needs-common:` (`platform-mark-detect.md`)
   - In bảng **Common candidates** (Vietnamese) — member chọn A/B/C; `artifactgraph_remember` when available
6. Optional `marks[]` on spec for confirmed B choices
7. Set `grillStatus.dev: done`.
8. **Recommendation gate:** if ArtifactGraph is available, call
   `artifactgraph_allowlist_check(commandKey=genDry)` then
   `artifactgraph_recommend_command`. Do **not** execute gen in docs hub.
9. `bundle_split` if edited bundle; user runs `docs_render`.
10. Handoff the spec ID/path + recommendation to FE Codegenkit. Missing
    Codegenkit means “pending FE dry-run”, not a docs failure.

## Accelerators (optional)

```text
if ArtifactGraph available: analyze/grill/tag hints + recommend genDry
else: model review from scoped bundle/design/legacy evidence (model fallback)

if Hubdocs available: resolve CMP/CTR IDs
else: repository path conventions (deterministic fallback)
```

Missing optionals never block this docs-side grill. After the existing fallback
completes, emit exactly one `bundlekit.missing-optional` event per `runId` +
optional against
`.cursor/schemas/bundlekit/missing-optional-event.schema.json`. Deduplicate
retries and report only actual `fileReads` / `contextBytes`.

## Out of scope

UX prose, acceptance rewrite, implement UI, full E2E.

## Handoff

- FE Codegenkit dry pass → `/prototype`
- BQA↔Dev conflict → `/grill-with-docs`
- Legacy fact gap → `/update-spec-legacy`
- Member chose promote common → `/platform-mark` same session or before `/prototype`
