---
name: surfaces
description: /surfaces — Handles the Surfaces layer (Admin Web, Line Client, Gateway, etc).
disable-model-invocation: true
extractBundle: architecture-core
---
# /surfaces
**Target Paths:** `Surfaces/[Surface]`
**Guidelines:** Manage the `Common` scope within surfaces (Business processes, Data model, Cross-service flows).

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /surfaces`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Khảo cổ: truy vết và ánh xạ các frontend client / app cũ vào lớp Surfaces hiện tại, ghi nhận vào `legacy/surface.md`.
