---
name: common
description: EXCLUSIVE /common — Use this to define common business rules, UX/UI rules, and patterns for a Surface as Markdown documentation. DO NOT use this to generate YAML technical bundles (use /common-spec for that).
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.

# /common

**Target Path:** `product/surfaces/[Surface]/common/patterns/`

## Purpose

The `/common` skill is exclusively for creating **Markdown** documentation describing business logic, UX/UI principles, validation rules, or workflow patterns that apply globally across a surface (e.g., Breadcrumb Flow, Delete Confirmation Flow, Maintenance Pages). It is intended for BQA/BA and developers to align on human-readable rules.

**DO NOT** generate YAML bundles here. If the user wants to generate codegen bundles for common features, instruct them to use `/common-spec`.

## Target / ID Resolution Rule

- User prompt MUST specify a Surface (e.g. `admin-web`, `line-client-hmi`).
- If `product/surfaces/[Surface]/common/` does not exist, you MUST instruct the user to run `/surfaces common` first to scaffold the directory structure. Do NOT scaffold it yourself here.

## Rules for Markdown Content

1. Use clear, non-technical language where possible, geared towards Business / QA / Dev alignment.
2. If applicable, define rules based on the surface type (e.g., Kiosk UI rules differ from Web Portal UI rules).
3. Do NOT output fake i18n tables or framework prose. Focus on the actual rules (e.g., "Confirm dialog must always block background").

## Verification Checklist (Evidence Required)
- [ ] **Surface Resolved:** Resolved the target surface to `product/surfaces/[Surface]/`.
- [ ] **Common Directory Exists:** Verified that `common/` exists.
- [ ] **Markdown Output:** Generated a `.md` file in `product/surfaces/[Surface]/common/patterns/`.
