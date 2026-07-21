---
name: system-context
description: /system-context — Handles the System Context level in Architecture (CTX-* / LND-*).
disable-model-invocation: true
extractBundle: architecture-core
---
# /system-context
**Target Paths:** `Architecture/System Context/`
**Guidelines:** Use arc42 chapter 3 (Context).

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /system-context`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Khảo cổ: phân tích external dependencies, các integration partner của hệ thống cũ.
