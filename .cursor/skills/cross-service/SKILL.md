---
name: cross-service
description: /cross-service — Handles Cross-service flows and Integrations.
disable-model-invocation: true
extractBundle: architecture-core
---
# /cross-service
**Target Paths:** `[Target Path]/Common/Cross-service flows`
**Guidelines:** Use Mermaid `sequenceDiagram` for sync/async RPC.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /cross-service`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Khảo cổ: trace các luồng giao tiếp nội bộ giữa các service cũ.
