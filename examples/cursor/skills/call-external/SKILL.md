---
name: call-external
description: EXCLUSIVE #call-external hashtag — ONLY for third-party integration tags. DO NOT output fake Markdown reports.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.
> - Do NOT perform shallow checks. Verify your results against the **Verification Checklist** at the end of this skill before completing.

# #call-external

Read `.cursor/extracts/call-external.md` for spec, OpenAPI, and implementation rules.

Used from `/api-spec`, `/grill-api-spec`, and `/api-code` when hashtag is present.

## Target / ID Resolution Rule

- User prompt MAY specify a function ID or API endpoint slug (e.g. `API-AUTH-001`, `stripe/charge`).
- Agent MUST use `docskit_route` or `docskit_get_element` (or glob search) to locate the target `01-backend-spec.yaml` under `product/surfaces/...`.

## Verification Checklist (Evidence Required)
- [ ] **Target Spec Located:** Located `01-backend-spec.yaml` via ID or path resolution.
- [ ] **Hashtag Applied:** Documented `externalCalls` and added `#call-external` in spec YAML.
- **DO NOT output fake checklists, i18n tables, or framework prose.**

