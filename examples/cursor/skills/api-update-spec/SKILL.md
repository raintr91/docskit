---
name: api-update-spec
description: EXCLUSIVE /api-update-spec — ONLY for updating/syncing backend contract under product/surfaces/ when Portal spec changes or BE-only requirements update. DO NOT generate Markdown reports.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.
> - Do NOT perform shallow checks. Verify your results against the **Verification Checklist** at the end of this skill before completing.

# /api-update-spec — Portal Sync & BE-Only Updates

No Laravel code. No `codegen` / `#gen:*` — grill adds those after sync.

Shared extracts: `.cursor/extracts/api-spec-sync.md`, `spec-evolution.md`, `entity-relationship.md`, `derived-data.md`, `agent-discipline.md`

## Target / ID Resolution Rule

- User prompt MAY provide a full path OR just a function/module/screen ID (e.g. `CMP-ADM-000-001`, `W-AD-AUTH-001`, `login`).
- If an ID is provided, Agent MUST use `docskit_route` or `docskit_get_element` (or glob search) to resolve the exact target folder under `product/surfaces/...`. Do NOT force the user to prompt the full folder path.

## Modes

| Mode | Prompt | Sửa gì |
|------|--------|--------|
| **portal-sync** (default) | `/api-update-spec <ID or path>` | Diff portal spec → update `01/02/03` YAML |
| **be-only** | `/api-update-spec <ID or path> --be-only` | Chỉ `beOnlyRequirements`, `derivedData`, validation nội bộ — **không** đổi FE contract |

## Input & Folder Location

```text
product/surfaces/<surface>/CMP-*/<slug>/
├── 01-backend-spec.yaml   # updated in place
├── 02-openapi.yaml
└── 03-mock-data.yaml
```

## Workflow (portal-sync)

1. Resolve ID / slug to `product/surfaces/<surface>/CMP-*/<slug>/`; read backend YAML trio
2. Scan portal specs in folder
3. Diff requirements, endpoints, acceptance vs backend contract
4. Update in-place (`01-backend-spec.yaml`, `02-openapi.yaml`, `03-mock-data.yaml`)
5. Bump `feature.version`
6. `changeLog` entry
7. **No** direct `.md` file writing — user runs `pnpm docs:render`

## Out of scope

- **NO PROSE / NO BQA REPORTS:** Do NOT output Markdown reports, BQA 3-Pillars reports, or framework-specific code snippets.

## Verification Checklist (Evidence Required)
- [ ] **ID Resolved:** Resolved target ID/slug to `product/surfaces/<surface>/CMP-*/<slug>/`.
- [ ] **YAML Updated In-Place:** Modified `01-backend-spec.yaml`, `02-openapi.yaml`, `03-mock-data.yaml`.
- [ ] **No Direct Markdown:** Did NOT write `.md` files directly.
- **DO NOT output fake checklists, i18n tables, or gross combined files.**

└── generated/backend-spec.md   ← pnpm docs:render
```

## Done

- Portal delta reflected or explicitly listed in `pendingTechDebt` / `openQuestions`
- `source.portalRefs` current
- `changeLog` + version bumped
- Handoff: `/grill-api-spec {slug}` (re-run gates + codegen tags)

## Guardrails

- Do not split slug folder for child functions in same bounded context
- Do not rename API fields for FE convenience
- External integrations → record `openQuestions`; grill adds `#call-external`
- Export/import/custom → add endpoint stub + `pendingTechDebt.expectedWhenDone` if not merging this session
