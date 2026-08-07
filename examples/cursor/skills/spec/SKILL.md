---
name: spec
extractBundle: spec-requirement
description: EXCLUSIVE /spec — ONLY for authoring design bundle (feature.bundle.yaml). DO NOT trigger for grill or testcase skills.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - Physical interlocks: `AGENTS.md` + `SSOT_AGENT_PROTOCOL.md` (Đạo luật 1–7). Chat-only done = FAILED.
> - ĐẠO LUẬT 1: First action **BẮT BUỘC** `Read` this entire `SKILL.md`. **TUYỆT ĐỐI KHÔNG** dựa trí nhớ.
> - ĐẠO LUẬT 2: **BẮT BUỘC** `TODO.md` ở root bóc **toàn bộ Workflow + Accelerators** → `- [ ]`. **TUYỆT ĐỐI KHÔNG** chỉ copy Verification Checklist. **TUYỆT ĐỐI KHÔNG** gộp/tick hàng loạt.
> - ĐẠO LUẬT 3–4: **BẮT BUỘC** gộp plan vào `TODO.md` (quote nguyên văn từng dòng Verification Checklist) trước khi write bundle; mọi kết quả bền ghi disk **NGAY** (No RAM).
> - ĐẠO LUẬT 5: Data chỉ User prompt | ArtifactGraph. Thiếu → trống / `#missing_info`. **TUYỆT ĐỐI KHÔNG** bịa business.
> - ĐẠO LUẬT 6–7: Grill Confirm trước khi vá gap; common/DSL chỉ `/common`|`/common-spec`|`/docs-mark`|Confirm — `/spec` chỉ consume.
> - You MUST follow ALL Workflow steps below; verify via harness TODO evidence, not a static AGENTS checklist.

# /spec — Function detail (design)

**Business layer:** Function (screen `W-*` / API `API-*` inside a module)  
**Standards:** **C4 only** — do **not** open new arc42 chapters for one screen.

**Extracts:** `extractBundle: spec-requirement` → `.cursor/extracts/extract-registry.json`

Template: `.docskit/templates/feature.bundle.yaml` · rules: `.docskit/templates/bundle-authoring.md`  
Tree: [`platform/guide/SYSTEM-DOC-STRUCTURE.md`](../../../platform/guide/SYSTEM-DOC-STRUCTURE.md) · [Start now](../../../platform/guide/start-now.md)

## Scope

**In:** Code bundle / `--id` under `product/surfaces/.../CMP-*/<slug>`, `pnpm docs:split`, `pnpm docs:render` (design MD only), harness notes.

**Out:** E2E plans → **`base-tests` `/testcase`**. UI → `/prototype` after grill-docs. product/overview / CTR → `product/architecture` children.

## Target / ID Resolution Rule

- User prompt MAY specify a screen ID, module ID, or slug (e.g. `CMP-ADM-000`, `W-AD-AUTH-001`, `login`).
- Agent MUST use `docskit_route` or `docskit_get_element` (or glob search) to resolve the exact target folder under `product/surfaces/.../CMP-*/<slug>/`.
- Do NOT force the user to provide the full filesystem surface/module path if an ID or short slug is given.

## Workflow

0. Create/update `TODO.md` ở root (all steps below + Accelerator if/else items + plan).
1. Confirm **module (`CMP-*`) exists**, its operational-area mapping is known, and the implementing `CTR-*` is identified — otherwise stop for lead/owner.
2. If bundle exists, verify gaps: actors, fields, validations, routes, actions, API contracts, edge cases, acceptance. Unknown business facts → `#missing_info` (do not invent); hand off to `/bqa-grill-docs` or `/grill` as needed.
3. If new, draft from user bullets only — create `*.bundle.yaml` with `specOrigin: requirement` under `product/surfaces/<surface>/CMP-*/<slug>/`. Do NOT write Markdown. Leave gaps empty or `#missing_info`.
4. Incremental blocks per extracts when needed.
5. Apply **existing** common UI / spec-split extracts (consume only — do not invent or overwrite common SSOT; promote via `/common-spec` or confirmed grill).
6. `pnpm docs:split -- <bundle>` then `pnpm docs:render` (**no** testcase MD emit).
7. Update `.harness/progress.md` when present; keep harness TODO in sync (`[x]` + evidence).
8. Handoff plans: open **base-tests** → `/testcase` from acceptance.

## Output

- `spec` / `design` only (see `bundle-authoring.md`)
- **Không** author `TC-*` / `*.test.yaml` here (R3)

## Rules

- Do not edit FE production code or Playwright.
- Do not run `portal:gen` / `testcase:gen`.
- Vague spec → `/bqa-grill-docs` before `/prototype`.

### Common Pattern Resolution (MANDATORY)
Before authoring a new Spec, you MUST:
1. Scan `product/surfaces/<surface>/common/yaml/` and `product/surfaces/common/yaml/` for existing common bundles (**consume only** — do not create/overwrite common here).
2. Read `templates/shared/patterns/*.pattern.yaml` to identify which `commonSpecs` are associated with each pattern.
3. From the prompt (structural cues only — not invented business fields), propose appropriate pattern tags:
   - Screen has a delete button → `#pattern: delete-flow`
   - Screen is a list/table → `#pattern: CRUD` + `common-list-page`, `common-pagination`
   - Contains confirm/overwrite actions → reference `common-confirm-dialog`
4. Inject references into the `design.patterns` of the bundle.yaml:
   ```yaml
   design:
     inherits: admin-crud
     patterns:
       - "#pattern: CRUD"
       - "#pattern: delete-flow"
   ```

- **STRICT API REUSE & `#reuse-api`:** Agent MUST search existing APIs under `product/surfaces/common/yaml/` or sibling modules before defining endpoints. Mark reused endpoints with `#reuse-api` in `bundle.yaml` so downstream `/api-spec` skips generating duplicate API YAML files.
- **EXPLICIT ACTION SUFFIX URIs:** All API endpoints MUST use explicit action suffixes (`/create`, `/{id}/update`, `/{id}/duplicate`, `/{id}/delete`, `/{id}/detail`, `/list`). Never use ambiguous RESTful paths without action suffixes.
- **MANDATORY UI & API ERROR HANDLING SPECIFICATION:**
  - **UI Actions (`design.yaml`):** Agent MUST specify 3 execution outcomes for EVERY user action / API call: `onSuccess` (feedback, navigation), `onCommonError` (inherit `#ui-common:error-handler` or explicit `override: true`), and `onSpecificError` (inline `422` validation, `404` empty state, `403 IDOR` safety block, `409` conflict copy).
  - **API Contract (`spec.yaml`):** MUST apply Endpoint Error Storming Matrix using `#err:*` tags. Detail/Update/Delete routes with `{id}` MUST have `#err:not-found` & `#err:idor-violation`. Form Submits MUST have `#err:validation` rules.
- **CRITICAL:** Output MUST be a `.bundle.yaml` file. Do NOT generate Markdown (`.md`) files directly. Markdown is generated by `pnpm docs:render` (which consumes the split `ir/*.yaml`).
- **STRICT YAML ESCAPING:** ALL string properties (e.g. `summary`, `label`, `review.layoutNotes`) containing colon (`:`), brackets (`[]`), or leading symbols MUST be quoted with double quotes (`"..."`) or written using YAML multiline block scalars (`|`). Never leave unquoted colons inside string values.
- If a custom template/layout is required, specify the template name in the bundle YAML's `template` field (e.g., `template: breadcrumb-flow`). Do not edit the generated Markdown output directly.

## Modifiers (If /legacy is used)
Khi người dùng gọi `... /legacy /spec`, Agent PHẢI:
- Đọc source từ `legacy-repos.local.json` thay vì source hiện tại.
- Trích xuất function logic từ source code cũ.
- Viết/cập nhật `product/legacy-dynamics/{module}/_legacy.dynamics.yaml` (`portal-legacy-dynamics/v1`).
- Viết `*.bundle.yaml` cho function đó vào `product/surfaces/<surface>/CMP-*/<slug>/` với `specOrigin: legacy`.
- **Không** tạo codegen tags. Hỗ trợ chạy validate: `legacy_dynamics_validate` / `pnpm legacy-dynamics:validate`.

## Tools (required after docskit init)

Prefer MCP/CLI when Docskit is installed:

- `docskit_bundle_split` / `docskit split -- <bundle>`
- `docs_render` / `docskit render …`
- Local fallback only if package not installed: `pnpm docs:split` · `pnpm docs:render`

## Accelerators (optional)

```text
if Docskit available: resolve CMP/CTR/FLOW IDs → paths
else: repository conventions / search (local fallback)

if ArtifactGraph available: tags/parity slice for touched contracts
else: model review from scoped bundle evidence (model fallback)
```

Missing optionals never block `/spec`. After the existing fallback completes,
emit exactly one `docskit.missing-optional` event per `runId` + optional
against `.cursor/schemas/docskit/missing-optional-event.schema.json`.
Deduplicate retries and report only actual `fileReads` / `contextBytes`.

## Done

- Design bundle coherent · split + docs:render pass · plans handoff → `/testcase` on tests hub.

## Verification Checklist
- [ ] Harness TODO + plan written under `TODO.md` ở root and kept in sync with evidence.
- [ ] Strict adherence to scope boundaries and module CMP mapping (`product/surfaces/<surface>/CMP-*/<slug>/`).
- [ ] No invented business fields/flows — gaps tagged `#missing_info` or left empty.
- [ ] Common/DSL only consumed (not invented); output MUST be a `.bundle.yaml` (Do NOT write `.md` directly).
- [ ] **YAML Syntax Check:** All strings with colons (`:`) or brackets (`[]`) are double-quoted (`"..."`) or block-escaped (`|`).
- [ ] Executed `docskit split` / `pnpm docs:split` followed by `docs:render` with zero parse errors.
- [ ] Handed off testcase plans to `base-tests` `/testcase`.


