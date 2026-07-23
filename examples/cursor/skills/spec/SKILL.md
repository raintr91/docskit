---
name: spec
extractBundle: spec-requirement
description: /spec — author design bundle only (no testcase plans). Plans → base-tests /testcase.
disable-model-invocation: true
---

# /spec — Function detail (design)

**Business layer:** Function (screen `W-*` / API `API-*` inside a module)  
**Standards:** **C4 only** — do **not** open new arc42 chapters for one screen.

**Extracts:** `extractBundle: spec-requirement` → `.cursor/extracts/extract-registry.json`

Template: `templates/feature.bundle.yaml` · rules: `templates/bundle-authoring.md`  
Tree: [`platform/guide/SYSTEM-DOC-STRUCTURE.md`](../../../platform/guide/SYSTEM-DOC-STRUCTURE.md) · [Start now](../../../platform/guide/start-now.md)

## Scope

**In:** Code bundle / `--id` under `product/surfaces/.../modules/CMP-*/functions/[Screen | API]`, `pnpm spec:split`, `pnpm docs:render` (design MD only), harness notes.

**Out:** E2E plans → **`base-tests` `/testcase`**. UI → `/prototype` after grill-docs. product/overview / CTR → `product/architecture` children.

## Workflow

1. Confirm **module (`CMP-*`) exists**, its operational-area mapping is known, and the implementing `CTR-*` is identified — otherwise stop for lead/owner.
2. If bundle exists, verify gaps: actors, fields, validations, routes, actions, API contracts, edge cases, acceptance.
3. If new, draft from user bullets — `*.bundle.yaml` with `specOrigin: requirement` under `product/surfaces/.../functions/...`.
4. Incremental blocks per extracts when needed.
5. Apply common UI / spec-split extracts.
6. `pnpm spec:split -- <bundle>` then `pnpm docs:render` (**no** testcase MD emit).
7. Update `.harness/progress.md` when present.
8. Handoff plans: open **base-tests** → `/testcase` from acceptance.

## Output

- `spec` / `design` only (see `bundle-authoring.md`)
- **Không** author `TC-*` / `*.test.yaml` here (R3)

## Rules

- Do not edit FE production code or Playwright.
- Do not run `portal:gen` / `testcase:gen`.
- Vague spec → `/bqa-grill-docs` before `/prototype`.
- No arc42 chapter prose for a single function — stay C4/code-level.

## Tools (required after docskit init)

Prefer MCP/CLI when Docskit is installed:

- `bundle_split` / `docskit split -- <bundle>`
- `docs_render` / `docskit render …`
- Local fallback only if package not installed: `pnpm spec:split` · `pnpm docs:render`

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
