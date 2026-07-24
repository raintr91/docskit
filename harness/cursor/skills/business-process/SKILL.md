---
name: business-process
description: /business-process — Models business action flows (actor + surface + action + outcome) as FLOW-*.
disable-model-invocation: true
extractBundle: architecture-core
---
# /business-process
**Target Paths:** `[Target Path]/Common/Business processes`
**Guidelines:** Use standard MD + Mermaid `flowchart` or `sequenceDiagram`. Model the process by business actions on surfaces, not by repo/service topology.

## Process meaning
- Start from the business question: who is doing what on which surface/channel.
- Show handoffs, decisions, exceptions, and outcomes.
- A process can touch multiple surfaces or modules, but the primary lens is business action, not technical boundary.
- Use `sequenceDiagram` when interactions between actors/surfaces matter; use `flowchart` when decision paths matter more.
- Do not describe the process as a service map unless the service boundary is the actual business concern.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /business-process`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Khảo cổ: truy vết flow nghiệp vụ từ hệ thống cũ để ánh xạ thành các luồng `FLOW-*` tương ứng theo actor / surface / action / outcome. Đưa vào cùng thư mục đang thao tác nhưng tên file thêm tiền tố `legacy-` ở đầu (vd: `legacy-process.md`).
