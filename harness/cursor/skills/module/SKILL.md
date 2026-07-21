---
name: module
description: /module — Replaces the old component skill. Handles business modules (CMP-*).
disable-model-invocation: true
extractBundle: architecture-core
---
# /module
**Target Paths:** `Surfaces/[Surface]/Modules/CMP-*`
**Guidelines:** Modules can contain their own `Common` scope and `Functions`.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /module`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Khảo cổ: phân tích subsystem/component cũ và map sang cấu trúc Modules (`CMP-*`) mới, ghi nhận vào `legacy/module.md`.
