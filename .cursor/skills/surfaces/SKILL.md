---
name: surfaces
description: /surfaces — Handles the Surfaces layer (Admin Web, Line Client, Gateway, etc).
disable-model-invocation: true
extractBundle: architecture-core
---
# /surfaces
**Target Paths:** `Surfaces/[Surface]`
**Guidelines:** Manage the `Common` scope within surfaces (Business processes, Data model, Cross-service flows).

## Workflow / Luồng thực thi
1. Kiểm tra xem thư mục `Surfaces` đã tồn tại chưa. Nếu chưa, tạo mới.
2. Nếu gọi kèm tên một surface cụ thể (vd: `/surfaces "Admin Web"`):
   - Kiểm tra xem thư mục `Surfaces/[Tên Surface]` đã có chưa. Nếu chưa, tạo mới thư mục rồi mới làm việc.
3. Nếu gọi kèm `common`:
   - Nếu không nói tên surface (vd: `/surfaces common`): sẽ là scope common ở cấp toàn hệ thống `Surfaces/Common`. Kiểm tra đã có chưa, chưa có thì tạo mới, có rồi thì cập nhật.
   - Nếu có tên surface (vd: `/surfaces "Admin Web" common`): sẽ là scope common của riêng surface đó `Surfaces/[Tên Surface]/Common`. Kiểm tra và tạo mới nếu chưa có.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /surfaces`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Khảo cổ: truy vết và ánh xạ các frontend client / app cũ vào lớp Surfaces hiện tại, ghi nhận vào cùng thư mục đang thao tác nhưng tên file thêm tiền tố `legacy-` ở đầu (vd: `Surfaces/legacy-surface.md` hoặc `Surfaces/Admin Web/legacy-surface.md`).
