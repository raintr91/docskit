# docskit

Local MCP for **arc42 × C4 docs hubs**: index architecture/product IDs, deps, orphans, broken links, and chapter routing — so agents query the hub **without dumping whole trees**.

Indexes and validates Markdown only — does not replace Structurizr or diagram renderers.

- GitHub: [raintr91/docskit](https://github.com/raintr91/docskit.git)
- **Init (agents):** [docs/INIT.md](./docs/INIT.md)
- **Package bootstrap:** [docs/INSTALL.md](./docs/INSTALL.md)

## Independence

Docskit owns the architecture authoring harness (`/architecture` family +
`/docskit`) and the docs ID/graph tools. ArtifactGraph is an **optional**
accelerator for registries/tags/parity only.

- Docskit **never requires** ArtifactGraph.
- ArtifactGraph must **not** index or own architecture Markdown.
- Missing ArtifactGraph falls back to targeted local reads and emits one
  deduplicated `docskit.missing-optional` event per run/optional with measured
  `fileReads` and `contextBytes`; token usage is not estimated.
- Missing Docskit MCP never blocks Markdown authoring: use repository search
  and targeted file reads.

---

## What it does

| Công dụng | Chi tiết |
|-----------|----------|
| **ID index** | Liệt kê LND / CTX / CTR / CMP / FLOW / DEP / ADR / W / API / UI từ MD |
| **Slice theo ID** | Mở file + excerpt cho một phần tử — không load cả cây docs |
| **Deps / dependents** | Ai tham chiếu ID này / ID này tham chiếu ai |
| **Catalog health** | Orphans (thiếu FLOW/ADR/CMP), broken MD links |
| **Routing** | Topic → chương arc42 + skill gợi ý |
| **Journeys** | Liệt kê `FLOW-*` dưới `06-runtime/journeys/` |

---

## Skills (Harness Toolkit)

Docskit cung cấp bộ Agentic Skills toàn diện để hỗ trợ quá trình phân tích và viết tài liệu kiến trúc, specs, legacy traces. Các skill này được tự động cài đặt qua `docskit init`.

### 1. Kiến trúc (Architecture Hierarchy)
| Skill | Chức năng chính |
|-------|-----------------|
| `/architecture` | Router chính để điều hướng agent tới các skill chuyên biệt phía dưới. |
| `/overview` | Xử lý tài liệu tổng quan (Personas, Operational areas). |
| `/system-context` | Phân tích tài liệu ngữ cảnh hệ thống (System Context, Landscape). |
| `/surfaces` | Quản lý tài liệu tầng Surfaces (Admin Web, Line Client, Gateway...). |
| `/module` | Xử lý tài liệu mức Module (nghiệp vụ, data model chung của một nhóm chức năng). |
| `/containers` | Viết sơ đồ cấu trúc Runtime Containers. |
| `/journey` | Viết sơ đồ Runtime Journeys tổng thể. |
| `/deployment` | Viết tài liệu Deployment View. |

### 2. Common Layers & Diagrams
| Skill | Chức năng chính |
|-------|-----------------|
| `/business-process` | Vẽ sơ đồ luồng nghiệp vụ (Flowchart, Sequence) cho các `FLOW-*`. |
| `/db-erd` | Viết và định nghĩa Schema Database, ERD (Data model). |
| `/cross-service` | Mô tả luồng tích hợp, giao tiếp giữa các service (Sequence diagrams). |

### 3. Function Specs & Grill (Product)
| Skill | Chức năng chính |
|-------|-----------------|
| `/spec` | Khởi tạo tài liệu Function Detail / Design bundle (`W-*`, `API-*`). |
| `/bqa-grill-docs` | BA/UI Grill: Đặt câu hỏi thẩm định giao diện, validate hành vi, acceptance. |
| `/dev-grill-docs` | Dev Grill: Chuẩn bị thông số codegen, test schemas, metadata trước khi gen code. |
| `/grill-with-docs` | Reconcile: Giải quyết mâu thuẫn giữa BQA và Dev. |
| `/architecture-grill` | Phỏng vấn (grill) để chốt thiết kế kiến trúc/logic hệ thống ở các tầng cao (Modules, Surfaces). |
| `/update-spec` | Update delta một phần (patch) cho spec khi có thay đổi nhỏ, tránh viết lại toàn bộ. |

### 4. Legacy Trace (Archaeology)
| Skill | Chức năng chính |
|-------|-----------------|
| `/legacy-overview` | Phân tích tài liệu hệ thống cũ để map các actor/persona thành Operational areas mới. |
| `/legacy-surfaces` | Truy vết và ánh xạ các web app / frontend client cũ vào lớp Surfaces mới. |
| `/legacy-module` | Phân tích subsystem/component cũ để map thành cấu trúc Modules (`CMP-*`). |
| `/legacy-business-process` | Truy vết flow nghiệp vụ cũ để chuyển đổi thành business processes (`FLOW-*`). |
| `/legacy-system-context` | Phân tích sơ đồ ngữ cảnh (System Context), external dependencies cũ. |
| `/legacy-db-erd` | Ánh xạ cấu trúc bảng/cột từ schema database cũ sang Data model mới. |
| `/legacy-cross-service` | Phân tích luồng tích hợp, giao tiếp giữa các service (RPC/Message) cũ. |
| `/legacy-spec` | Truy xuất/phân tích source code hệ thống cũ để trích xuất `legacy.dynamics` cho Function. |
| `/update-spec-legacy` | Cập nhật delta spec dựa trên các bằng chứng (evidence) mới tìm thấy từ mã nguồn cũ. |

### 5. Tiện ích (Utilities)
| Skill | Chức năng chính |
|-------|-----------------|
| `/configure-repo-maps` | Cấu hình đường dẫn checkout local (repo map) bằng ngôn ngữ tự nhiên. |
| `/docskit` | Đồng bộ hóa kiến thức tổng quát và danh sách skill của bộ công cụ. |

---

## Quick start

**Prerequisites:**
Yêu cầu cài đặt toolkit **platform-dna** (cung cấp nền tảng cấu hình cross-repo và quản lý agentic skills cốt lõi) trước khi cài đặt `docskit`:
1. `curl -fsSL https://raw.githubusercontent.com/raintr91/platform-dna/main/install.sh | bash`
2. `platform-dna init`

**Linux / WSL**

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/docskit/main/install.sh | bash
docskit version
cd /path/to/your-docs-hub    # thư mục có architecture/
docskit init                 # agents → lane → optional toolkits → MCP + harness
```

**Windows**

```powershell
irm https://raw.githubusercontent.com/raintr91/docskit/main/install.ps1 | iex
```

Requires **Node ≥ 22**.

`init` luôn ghi MCP **local trong repo đang chạy**. Local docs root theo thứ tự
`--docs-root` → `DOCSKIT_ROOT` → cwd có `architecture/`. Không có sibling
fallback. CI có thể dùng `docskit init --yes` (lane mặc định `docs`).
Optional ArtifactGraph mặc định được bỏ qua; chọn trong wizard hoặc dùng
`--with=artifactgraph`. Docskit không cài ngầm toolkit khác.

Sau `init`: restart agent → thử tool `docskit_list_ids`.

---

## Update

Cùng lệnh cài — ghi đè `~/.docskit` + symlink CLI:

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/docskit/main/install.sh | bash
docskit version
```

Pin bản cụ thể:

```bash
DOCSKIT_REF=v1.1.0 curl -fsSL https://raw.githubusercontent.com/raintr91/docskit/v1.1.0/install.sh | bash
```

Windows: chạy lại `irm …/install.ps1 | iex`.

Sau update: `cd` docs hub → `docskit init` rồi restart agent.

---

## Uninstall

Hai cấp lifecycle tương ứng:

```bash
docskit deinit                         # repo hiện tại: harness + MCP local
docskit uninstall                      # global: mọi repo + MCP local/global + CLI
```

Mặc định lệnh sẽ preview và hỏi xác nhận trong TTY; thêm `--yes` cho automation.
File member đã sửa được **giữ lại + báo**.

`harness install` ghi lại repo vào **install ledger** (`$XDG_STATE_HOME/docskit/installs.json`)
để `docskit uninstall` dọn mọi nơi mà không cần `cd`. Với bản cài cũ chưa có ledger:

```bash
docskit uninstall --discover ~/workspace --yes
```

Các cờ `--scope`, `--project-root`, `--target` và `--location` vẫn giữ cho nhu cầu
advanced/backward compatibility, không cần trong luồng thông thường.

---

## Commands

| Step | CLI |
|------|-----|
| Install / update package | `curl …/install.sh \| bash` |
| Agents → lane → optional toolkits → MCP + harness | `docskit init` |
| CI non-interactive | `docskit init --yes` |
| CI + ArtifactGraph đã cài | `docskit init --with=artifactgraph --yes` |
| Print MCP snippet | `docskit init --print-config cursor` |
| Harness-only (advanced) | `docskit harness install --type=docs\|consumer` |
| Inspect managed harness assets | `docskit status` |
| Preview/remove stale managed assets | `docskit prune [--yes]` |
| Remove this repo's harness + local MCP | `docskit deinit [--yes]` |
| Remove everything globally | `docskit uninstall [--yes]` |
| Version / paths | `docskit version` |

`install` = deprecated alias của `init`.

Harness installs record direct-copy Docskit assets in
`.docskit/install-manifest.json`. Upgrades preserve locally modified managed
files unless `--force` is passed. Assets removed from a newer package become
stale; `prune` is a dry run, and `prune --yes` deletes only stale files whose
hash still matches the installed copy. The shared merged
`.cursor/extracts/extract-registry.json` is never claimed or pruned. Docskit
never writes `platform-repos*.json` (Platform DNA-owned, optional). The Docskit-owned optional fallback schema is installed at
`.cursor/schemas/docskit/missing-optional-event.schema.json` and follows the
same managed lifecycle.

Agents hỗ trợ: Claude · Cursor · Codex · opencode · Hermes · Gemini · Antigravity · Kiro · **Kilo**.

---

## MCP tools

| Tool | Purpose |
|------|---------|
| `docskit_list_ids` | List LND/CTX/CTR/CMP/FLOW/DEP/ADR/W/API |
| `docskit_get_element` | Files + excerpt for one ID |
| `docskit_deps_of` | IDs referenced from that element’s files |
| `docskit_dependents_of` | IDs that mention this ID |
| `docskit_orphans` | Missing canonical FLOW/ADR/CMP paths; catalog draft/TBD |
| `docskit_validate_links` | Broken MD links under architecture (+ product) |
| `docskit_route` | Topic → arc42 chapter + skill |
| `docskit_journeys` | List `FLOW-*` under `06-runtime/journeys/` |
| `docskit_layout` | Canonical paths per ID kind + ignored redirect stubs |

Manual Cursor snippet: [`mcp.cursor.example.json`](./mcp.cursor.example.json). **Ưu tiên `docskit init`** sau `install.sh`.

Docs root: tool `docsRoot` → project MCP `DOCSKIT_ROOT` → valid cwd → setup
error. Hub phải có `architecture/`.

Redirect stubs (old flat C4) bị bỏ qua khi index. `DYN-*` không còn được index — dùng `FLOW-*`.

---

## License

MIT
