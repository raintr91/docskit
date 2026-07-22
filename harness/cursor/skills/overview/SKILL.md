---
name: overview
description: /overview — Handles the Overview root folder (Operational areas).
disable-model-invocation: true
extractBundle: architecture-core
---
# /overview
**Target Paths:** `Overview/Operational areas/[Admin operations | Workforce operations | ...]`
**Guidelines:** Focus on personas, operational areas, and high-level system purpose.

## Workflow / Luồng thực thi
1. Kiểm tra xem thư mục `Overview` đã tồn tại chưa. Nếu chưa, tạo mới.
2. Nếu gọi kèm `common` (vd: `/overview common`):
   - Kiểm tra xem `Overview/Common` đã có chưa.
   - Nếu có, tiến hành cập nhật. Nếu chưa, tạo mới thư mục/file tương ứng rồi mới cập nhật.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /overview`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Nhiệm vụ là "khảo cổ": map các actor/persona và hệ thống con cũ thành Operational Areas tương ứng, ghi nhận vào cùng thư mục đang thao tác nhưng tên file thêm tiền tố `legacy-` ở đầu (vd: `Overview/legacy-overview.md`).
