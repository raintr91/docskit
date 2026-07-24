---
name: cross-service
description: /cross-service — Models inter-service and inter-system integrations (sync/async, RPC, events, messages).
disable-model-invocation: true
extractBundle: architecture-core
---
# /cross-service
**Target Paths:** `[Target Path]/Common/Cross-service flows`
**Guidelines:** Use Mermaid `sequenceDiagram` for sync/async RPC, events, and messages. Focus on contract, direction, ownership, and handoff between services/systems.

## Flow meaning
- Model the interaction between services, systems, or boundaries.
- Include sync RPC, async messaging, and event-driven handoffs when relevant.
- Do not model internal code paths inside a single service; that belongs elsewhere.
- Keep the emphasis on integration contracts and ownership of the boundary.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /cross-service`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Khảo cổ: trace các luồng giao tiếp giữa các service / system / boundary cũ.
