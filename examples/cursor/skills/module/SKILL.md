---
name: module
description: /module — Replaces the old component skill. Handles business modules (CMP-*).
disable-model-invocation: true
extractBundle: architecture-core
---
# /module
**Target Paths:**
- Thư mục Module: `product/surfaces/[Surface]/modules/[CMP-ID]/`
- File tài liệu chính: `product/surfaces/[Surface]/modules/[CMP-ID]/[CMP-ID].md`

**Guidelines:** Modules can contain their own `common` scope and `functions`.

## Workflow / Luồng thực thi
1. Nếu gọi kèm tên surface và module (vd: `/module "Customer App" CMP-123`):
   - Kiểm tra xem thư mục Module `product/surfaces/[Tên Surface]/modules/[CMP-ID]` đã tồn tại chưa. Nếu chưa, tạo mới thư mục.
   - Tiến hành tạo hoặc cập nhật file tài liệu chính tại đường dẫn `product/surfaces/[Tên Surface]/modules/[CMP-ID]/[CMP-ID].md` (không tạo file trực tiếp trong thư mục `modules/`).
2. Nếu gọi kèm `common` (vd: `/module "Customer App" CMP-123 common`):
   - Kiểm tra xem thư mục `product/surfaces/[Tên Surface]/modules/[CMP-ID]/common` đã có chưa. Nếu chưa, tạo mới; có rồi thì cập nhật.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /module`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Khảo cổ: phân tích subsystem/component cũ và map sang cấu trúc Modules (`CMP-*`) mới, ghi nhận vào cùng thư mục đang thao tác tại `product/surfaces/[Tên Surface]/modules/[CMP-ID]/legacy-module.md`.
