---
name: surfaces
description: "/surfaces — Manage business/interaction surfaces (who does what on which channel)."
disable-model-invocation: true
extractBundle: architecture-core
---
# /surfaces
**Target Paths:** `product/surfaces/[Business Surface]`
**Guidelines:** Manage business/interaction surfaces, not repos or projects. A surface is defined by actor(s), channel, and business responsibility.

## Workflow / Luồng thực thi
1. Kiểm tra xem thư mục `product/surfaces` đã tồn tại chưa. Nếu chưa, tạo mới.
2. Nếu gọi kèm tên một business surface cụ thể (vd: `/surfaces "Customer App"`):
   - Kiểm tra xem thư mục `product/surfaces/[Tên Surface]` đã có chưa. Nếu chưa, tạo mới thư mục rồi mới làm việc.
3. Nếu gọi kèm `common`:
   - Nếu không nói tên surface (vd: `/surfaces common`): sẽ là scope common ở cấp toàn hệ thống `product/surfaces/common`. Kiểm tra đã có chưa, chưa có thì tạo mới, có rồi thì cập nhật.
   - Nếu có tên surface (vd: `/surfaces "Customer App" common`): sẽ là scope common của riêng surface đó `product/surfaces/[Tên Surface]/common`. Kiểm tra và tạo mới nếu chưa có.

## Surface meaning
- A surface represents a business interface or interaction channel (e.g., Customer Web, Admin Portal, Mobile App, Integration Gateway).
- common is shared scope used by more than one surface.
- API is **not** a surface; API belongs to architecture containers or function / API contract detail.

## Overview alignment
When writing overview content, describe the surface in the same business sense:
- who uses it
- what they do
- which channel they use
- what business responsibility it covers

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /surfaces`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Khảo cổ: truy vết và ánh xạ các client / app / integration cũ vào đúng business surface hiện tại, ghi nhận vào cùng thư mục đang thao tác nhưng tên file thêm tiền tố `legacy-` ở đầu (vd: `product/surfaces/legacy-surface.md` hoặc `product/surfaces/Customer App/legacy-surface.md`).
