---
name: grill-api-spec
description: EXCLUSIVE /grill-api-spec — ONLY for auditing backend API contract YAML in product/surfaces/ after /api-spec. DO NOT generate Markdown reports.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.
> - Do NOT perform shallow checks. Verify your results against the **Verification Checklist** at the end of this skill before completing.

# /grill-api-spec — Backend Contract Audit (Pure Backend Technical)

After `/api-spec`, before `/api-code`. **Pure Backend Technical Audit** (Database schemas, API endpoints, data types, securitySchemes, `#reuse-api` checks).

Shared extracts: `.cursor/extracts/spec-evolution.md`, `api-spec-sync.md`, `entity-relationship.md`, `call-external.md`, `cross-entity-service.md`, `derived-data.md`, `agent-discipline.md`, `api-codegen-readiness.md`, `api-codegen-tags.md`, `verify-gate.md`

## Goal

- Backend contract matches Portal `spec.yaml` + testcases (**skip Portal cross-check when `feature.source.base: none`** — use `/grill-integration-spec`)
- OpenAPI and mock data align with `01-backend-spec.yaml`
- Verify API reuse (`#reuse-api`) — skip generating duplicate contracts for existing APIs
- Spec is **codegen-ready** for `pnpm api:gen:dry`
- Hashtags and edge cases documented for implementation

## Workflow

1. Resolve feature slug under `product/surfaces/<surface>/modules/CMP-*/<slug>/` or `product/surfaces/common/yaml/<slug>/`; read spec and backend YAML trio
2. Cross-check requirements vs endpoints, entities, permissions, validation, errors
3. Audit Engineering Hashtags & Templates:
   - Verify `#call-external`, `#cross-service`, `#cross-entity-service`, `#derived-data`, `#tech-debt:*`.
   - Check if backend service/DTO HBS codegen templates match endpoints.
4. Enrich spec: `codegen`, `api.endpoints[].action`, `#gen:*` tags, `approval` (see `api-codegen-readiness.md`)
4. Fix clear gaps in YAML/OpenAPI/mock **in scope**
5. Run gates (repo root):
   `pnpm api:gen:dry --spec product/surfaces/<surface>/modules/CMP-*/<slug>/01-backend-spec.yaml --write-spec` and `pnpm openapi:render`
6. Ask user only for product decisions; use codebase/Portal evidence otherwise
7. Record handoff in `.harness/progress.md` when present — NOT in generated files
8. Remind member: `pnpm docs:render` for review docs

## Out of scope

- **NO PROSE / NO BQA REPORTS:** Do NOT output Markdown reports, BQA 3-Pillars reports, or framework-specific code snippets.
- Do not scaffold code classes directly.

## Verification Checklist (Evidence Required)
- [ ] **Target Location:** Audited `01-backend-spec.yaml` under `product/surfaces/...` directory.
- [ ] **Codegen Tags Added:** Verified `#gen:*` tags and `action` populated on endpoints.
- [ ] **Gates Executed:** `pnpm api:gen:dry --write-spec` and `pnpm openapi:render` both exit 0.
- [ ] **Approval Updated:** `approval.status` set to `reviewed` (or `approved`) in YAML.
- **DO NOT output fake checklists, i18n tables, or framework prose.**

