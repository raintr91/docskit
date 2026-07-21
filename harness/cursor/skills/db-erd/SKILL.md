---
name: db-erd
description: /db-erd — Handles Data model and Database documentation (ERD).
disable-model-invocation: true
extractBundle: architecture-core
---
# /db-erd
**Target Paths:** `[Target Path]/Common/Data model \ Database`
**Guidelines:** Use Mermaid `erDiagram`.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /db-erd`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Khảo cổ: ánh xạ schema cũ sang cấu trúc Data model.
