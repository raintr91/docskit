---
name: overview
description: /overview — Handles the Overview root folder (Operational areas).
disable-model-invocation: true
extractBundle: architecture-core
---
# /overview
**Target Paths:** `Overview/Operational areas/[Admin operations | Workforce operations | ...]`
**Guidelines:** Focus on personas, operational areas, and high-level system purpose.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /overview`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Nhiệm vụ là "khảo cổ": map các actor/persona và hệ thống con cũ thành Operational Areas tương ứng, ghi nhận vào `legacy/overview.md`.
