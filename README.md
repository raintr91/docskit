# hubdocs

Local MCP for **arc42 × C4 docs hubs**: index architecture/product IDs, deps, orphans, broken links, and chapter routing — so agents query the hub **without dumping whole trees**.

Indexes and validates Markdown only — does not replace Structurizr or diagram renderers.

- GitHub: [raintr91/hubdocs](https://github.com/raintr91/hubdocs)
- **Init (agents):** [docs/INIT.md](./docs/INIT.md)
- **Package bootstrap:** [docs/INSTALL.md](./docs/INSTALL.md)

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

## Quick start

**Linux / WSL**

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/main/install.sh | bash
hubdocs version
hubdocs init                    # ↑↓ · Space · Enter — Cursor / Claude / Kilo / …
```

**Windows**

```powershell
irm https://raw.githubusercontent.com/raintr91/hubdocs/main/install.ps1 | iex
```

Requires **Node ≥ 22**.

Wire từ trong docs hub (khuyến nghị):

```bash
cd /path/to/your/docs-hub    # thư mục có architecture/
hubdocs init --yes
```

`init` tự lấy `cwd` làm `HUBDOCS_ROOT`. Chỉ cần `--docs-root=…` khi chạy từ chỗ khác.

Sau `init`: restart agent → thử tool `hubdocs_list_ids`.

---

## Commands

| Step | CLI |
|------|-----|
| Wire agents (global/local) | `hubdocs init` |
| Print MCP snippet | `hubdocs init --print-config cursor` |
| Version / paths | `hubdocs version` |

`install` = deprecated alias của `init`.

Agents hỗ trợ: Claude · Cursor · Codex · opencode · Hermes · Gemini · Antigravity · Kiro · **Kilo**.

---

## MCP tools

| Tool | Purpose |
|------|---------|
| `hubdocs_list_ids` | List LND/CTX/CTR/CMP/FLOW/DEP/ADR/W/API |
| `hubdocs_get_element` | Files + excerpt for one ID |
| `hubdocs_deps_of` | IDs referenced from that element’s files |
| `hubdocs_dependents_of` | IDs that mention this ID |
| `hubdocs_orphans` | Missing canonical FLOW/ADR/CMP paths; catalog draft/TBD |
| `hubdocs_validate_links` | Broken MD links under architecture (+ product) |
| `hubdocs_route` | Topic → arc42 chapter + skill |
| `hubdocs_journeys` | List `FLOW-*` under `06-runtime/journeys/` |
| `hubdocs_layout` | Canonical paths per ID kind + ignored redirect stubs |

Manual Cursor snippet: [`mcp.cursor.example.json`](./mcp.cursor.example.json). **Ưu tiên `hubdocs init`** sau `install.sh`.

Docs root: `HUBDOCS_ROOT` hoặc `--docs-root` (hub phải có `architecture/`).

Redirect stubs (old flat C4) bị bỏ qua khi index. `DYN-*` không còn được index — dùng `FLOW-*`.

---

## License

MIT
