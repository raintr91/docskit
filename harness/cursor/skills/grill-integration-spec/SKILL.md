---
name: grill-integration-spec
description: EXCLUSIVE /grill-integration-spec — ONLY for auditing backend integration contracts under product/surfaces/integrations/. DO NOT generate Markdown reports.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.
> - Do NOT perform shallow checks. Verify your results against the **Verification Checklist** at the end of this skill before completing.

# /grill-integration-spec — Integration Contract Audit

After `/api-integration-spec`, before `/api-code`. No code implementation directly.

Shared extracts: `.cursor/extracts/api-integration-spec.md`, `api-codegen-readiness.md`, `api-codegen-tags.md`, `call-external.md`, `entity-relationship.md`, `agent-discipline.md`, `verify-gate.md`

## Goal

- Contract đủ cho implement webhook/partner API
- OpenAPI `securitySchemes` + mock khớp `01-backend-spec.yaml`
- Codegen-ready: `pnpm api:gen:dry` + `pnpm openapi:render`

## Workflow

1. Resolve integration slug under `product/surfaces/integrations/<provider>/<slug>/`; read spec and YAML trio
2. Audit auth, securitySchemes, idempotency, retry, and non-CRUD actions
3. Enrich spec with codegen tags (`#gen:*`, `#manual-service`, `#call-external`)
4. Run gates (repo root):
   `pnpm api:gen:dry --spec product/surfaces/integrations/<provider>/<slug>/01-backend-spec.yaml --write-spec` and `pnpm openapi:render`
5. Set `approval.status: reviewed` (or `approved`) in YAML

## Out of scope

- **NO PROSE / NO BQA REPORTS:** Do NOT output Markdown reports, BQA 3-Pillars reports, or framework-specific code snippets.
- Do not scaffold code classes directly.

## Verification Checklist (Evidence Required)
- [ ] **Target Location:** Audited `01-backend-spec.yaml` under `product/surfaces/integrations/...`.
- [ ] **Auth & Idempotency Verified:** OpenAPI `securitySchemes` and dedup keys populated.
- [ ] **Gates Executed:** `pnpm api:gen:dry --write-spec` and `pnpm openapi:render` both exit 0.
- [ ] **Approval Updated:** `approval.status` set to `reviewed` (or `approved`) in YAML.
- **DO NOT output fake checklists, i18n tables, or framework prose.**


## Guardrails

- Do not require Portal testcase or FE model alignment
- Do not scaffold PHP
- No "ready for code" without gate evidence

## Done

- `approval.status`: `reviewed` (or `approved` if signed off)
- `codegen.commands[]` via dry-run `--write-spec`
- Handoff `/api-code` after `approved`
