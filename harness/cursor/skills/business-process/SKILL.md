---
name: business-process
description: /business-process — Handles dynamic FLOW-* diagrams within Surfaces and Modules layers.
disable-model-invocation: true
extractBundle: architecture-core
---
# /business-process
**Target Paths:** `[Target Path]/Common/Business processes`
**Guidelines:** Use standard MD + Mermaid `flowchart` or `sequenceDiagram`.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /business-process`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Khảo cổ: truy vết flow nghiệp vụ từ hệ thống cũ để ánh xạ thành các luồng `FLOW-*` tương ứng. Đưa vào `legacy/process.md`.
