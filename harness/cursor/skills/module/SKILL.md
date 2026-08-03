---
name: module
description: EXCLUSIVE /module — Handles business modules (CMP-*). DO NOT output fake Markdown reports.
disable-model-invocation: true
extractBundle: architecture-core
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.
> - Do NOT perform shallow checks. Verify your results against the **Verification Checklist** at the end of this skill before completing.

# /module

**Target Paths:**
- Thư mục Module: `product/surfaces/[Surface]/modules/[CMP-ID]/`
- File tài liệu chính: `product/surfaces/[Surface]/modules/[CMP-ID]/[CMP-ID].md`

**Guidelines:** Modules can contain their own `common` scope and `functions`.

## Target / ID Resolution Rule

- User prompt MAY specify a CMP ID or Module name (e.g. `CMP-ADM-000`, `CMP-123`).
- Agent MUST use `docskit_route` or `docskit_get_element` (or glob search) to resolve target surface and module folder under `product/surfaces/...`.
- Do NOT demand full surface filesystem paths from the user if a CMP ID is given.

## Workflow / Luồng thực thi
1. Nếu gọi kèm ID/Tên module (vd: `/module CMP-ADM-000` hoặc `/module "Customer App" CMP-123`):
   - Sử dụng `docskit_route` / glob search để tìm vị trí `product/surfaces/[Tên Surface]/modules/[CMP-ID]`.
   - Tiến hành tạo hoặc cập nhật file tài liệu chính tại `product/surfaces/[Tên Surface]/modules/[CMP-ID]/[CMP-ID].md`.
2. Nếu gọi kèm `common` (vd: `/module CMP-123 common`):
   - Kiểm tra thư mục `product/surfaces/[Tên Surface]/modules/[CMP-ID]/common`. Tạo mới/cập nhật.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /module`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Khảo cổ: phân tích subsystem/component cũ và map sang cấu trúc Modules (`CMP-*`) mới, ghi nhận vào `product/surfaces/[Tên Surface]/modules/[CMP-ID]/legacy-module.md`.

## Verification Checklist (Evidence Required)
- [ ] **Target Resolved:** Resolved CMP ID to `product/surfaces/[Surface]/modules/[CMP-ID]/`.
- [ ] **Main Module File:** Created or updated `[CMP-ID].md` inside module directory.
- **DO NOT output fake checklists, i18n tables, or framework prose.**

