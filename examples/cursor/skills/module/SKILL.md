---
name: module
description: /module — Replaces the old component skill. Handles business modules (CMP-*).
disable-model-invocation: true
extractBundle: architecture-core
---
# /module
**Target Paths:** `Surfaces/[Surface]/Modules/CMP-*`
**Guidelines:** Modules can contain their own `Common` scope and `Functions`.

## Workflow / Luồng thực thi
1. Nếu gọi kèm tên surface và module (vd: `/module "Admin Web" CMP-123`):
   - Kiểm tra xem cấu trúc `Surfaces/[Tên Surface]/Modules/[CMP-ID]` đã tồn tại chưa. Nếu chưa, tạo mới thư mục rồi mới làm việc.
2. Nếu gọi kèm `common` (vd: `/module "Admin Web" CMP-123 common`):
   - Kiểm tra xem thư mục `Surfaces/[Tên Surface]/Modules/[CMP-ID]/Common` đã có chưa. Nếu chưa, tạo mới; có rồi thì cập nhật.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /module`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Khảo cổ: phân tích subsystem/component cũ và map sang cấu trúc Modules (`CMP-*`) mới, ghi nhận vào cùng thư mục đang thao tác nhưng tên file thêm tiền tố `legacy-` ở đầu (vd: `Surfaces/[Tên Surface]/Modules/[CMP-ID]/legacy-module.md`).
