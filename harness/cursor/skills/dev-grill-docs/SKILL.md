---
name: dev-grill-docs
extractBundle: dev-grill
description: EXCLUSIVE /dev-grill-docs — ONLY for engineering codegen tags and bundle.gen. DO NOT trigger for BQA, BA, or UI design grills.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.
> - Do NOT perform a shallow check. Verify your results against the **Verification Checklist** at the end of this skill before completing.

# /dev-grill-docs — Dev / codegen grill

Doc hub: `platform/toolchain/PORTAL-CODEGEN.md`

**Extracts:** `extractBundle: dev-grill` → `codegen/readiness.md`, `platform-mark-detect.md`

## Target / ID Resolution Rule

- User prompt MAY specify a screen ID, function ID, or short slug (e.g. `CMP-ADM-000-001`, `W-AD-AUTH-001`, `login`).
- Agent MUST use `docskit_route` or `docskit_get_element` (or glob search) to resolve target path under `product/surfaces/...`.
- Do NOT demand full surface/module filesystem paths from the user.

## Load policy


| Load | Do not load |
|------|-------------|
| `ir/design.yaml`, `ir/legacy.yaml` (behaviors, fields) | Legacy source, `models/` |
| `bundle.spec` (api, entities, ui.routes) | Full trace module |
| `codegen/*`, `legacy/legacy-api-migration.md`, `platform-mark-detect.md` | UX copy debates |

## Workflow (Technical & Engineering Only — No BQA Business Questions)

1. Expect `grillStatus.bqaOpen: done` (or `bqaFacts` for requirement-only).
2. **Technical Review Only:** Focus strictly on Database tables, data types, API contracts, routing paths, hidden fields, composables, and codegen tags. Do **NOT** debate BQA business/UX copy rules.
3. Derive from design + legacy behaviors → write **`bundle.gen`** (or patch `ir/spec.yaml` then `pnpm spec:merge`):
   - `codegen`, `tags`, `ui.filters`, `ui.columns`, `ui.composition`, `ui.testIds`
   - `api.endpoints[].action`
   - **Component & HBS Template Check:** Verify if required UI components exist or if Handlebars (`.hbs`) codegen templates are available for rendering. Mark missing ones with `#needs-component` / `#needs-ui`.
   - **Check API Reuse (`#reuse-api`):** Search `product/surfaces/common/yaml/` or sibling modules. If API exists, tag `#reuse-api` to prevent duplicate API generation.
   - **Explicit Action Suffixes:** Ensure endpoints follow explicit naming (`/create`, `/{id}/update`, `/{id}/duplicate`, `/{id}/delete`, `/{id}/detail`). No ambiguous RESTful paths.
   - **Hashtag & Error Matrix Verification:** Verify and apply domain/engineering hashtags: `#call-external`, `#cross-service`, `#cross-entity-service`, `#derived-data`, `#tech-debt:*`, `#err:*` (`#err:validation`, `#err:idor-violation`, `#err:not-found`, `#err:permission-denied`).
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
9. `docskit_bundle_split` if edited bundle; user runs `docs_render`.
10. Handoff the spec ID/path + recommendation to FE Codegenkit. Missing
    Codegenkit means “pending FE dry-run”, not a docs failure.

## Accelerators (optional)

```text
if ArtifactGraph available: analyze/grill/tag hints + recommend genDry
else: model review from scoped bundle/design/legacy evidence (model fallback)

if Docskit available: resolve CMP/CTR IDs
else: repository path conventions (deterministic fallback)
```

Missing optionals never block this docs-side grill. After the existing fallback
completes, emit exactly one `docskit.missing-optional` event per `runId` +
optional against
`.cursor/schemas/docskit/missing-optional-event.schema.json`. Deduplicate
retries and report only actual `fileReads` / `contextBytes`.

## Out of scope

- **NO PROSE / NO BQA REPORTS:** Do NOT output Markdown reports, BQA 3-Pillars reports, or framework-specific code snippets (FastAPI, Pydantic, Axios, i18n).
- UX prose, acceptance rewrite, implement UI, full E2E.

## Handoff

- FE Codegenkit dry pass → `/prototype`
- BQA↔Dev conflict → `/grill-with-docs`
- Legacy fact gap → `/update-spec-legacy`
- Member chose promote common → `/platform-mark` same session or before `/prototype`

## Verification Checklist (Evidence Required)
- [ ] **Target Bundle Updated:** Must provide exact file path of updated `*.bundle.yaml` or `ir/spec.yaml`.
- [ ] **Tags Generated:** Must list actual tags added (e.g. `#needs-component`, `#gen:test-validation`, `#err:validation`, `#err:idor-violation`).
- [ ] **Status Updated:** `grillStatus.dev` is set to `done` inside the YAML file.
- [ ] **Split Command:** Executed `docskit split` or `pnpm spec:split` with zero errors.
- **DO NOT output fake checklists or unrelated framework reports.**


