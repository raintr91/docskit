---
name: overview
description: /overview — Handles the Overview root folder (Operational areas and business surfaces).
disable-model-invocation: true
extractBundle: architecture-core
---
# /overview
**Target Paths:** `product/overview/operational-areas/[Admin operations | Workforce operations | ...]`
**Guidelines:** Focus on personas, operational areas, business surfaces, and high-level system purpose. Use `surface` to mean "who does what on which channel", not a project or repo.

## Workflow / Luồng thực thi
1. Kiểm tra xem thư mục `product/overview` đã tồn tại chưa. Nếu chưa, tạo mới.
2. Nếu gọi kèm `common` (vd: `/overview common`):
   - Kiểm tra xem `product/overview/common` đã có chưa.
   - Nếu có, tiến hành cập nhật. Nếu chưa, tạo mới thư mục/file tương ứng rồi mới cập nhật.

## Overview / Surfaces alignment
- An overview may mention operational areas such as Admin operations, Workforce operations, or Integration operations.
- Each operational area can point to one or more business surfaces.
- Keep the wording aligned with the business meaning of surfaces:
  - Admin Web: admin / engineer / supervisor / QA on Portal
  - Line/HMI: operator / technician on the line
  - Integration Gateway: PLC / MES / CMMS integration
  - Common: shared scope across surfaces
- Do not describe surfaces as projects, repos, or deployment units.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /overview`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Nhiệm vụ là "khảo cổ": map các actor/persona, systems, and channels cũ thành Operational Areas / business surfaces tương ứng, ghi nhận vào cùng thư mục đang thao tác nhưng tên file thêm tiền tố `legacy-` ở đầu (vd: `product/overview/legacy-overview.md`).
