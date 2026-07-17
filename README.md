# hubdocs

Local MCP for **arc42 × C4 docs hubs**: index architecture/product IDs, deps, orphans, broken links, and chapter routing — so agents query the hub **without dumping whole trees**.

Indexes and validates Markdown only — does not replace Structurizr or diagram renderers.

- GitHub: [raintr91/hubdocs](https://github.com/raintr91/hubdocs)
- **Init (agents):** [docs/INIT.md](./docs/INIT.md)
- **Package bootstrap:** [docs/INSTALL.md](./docs/INSTALL.md)

## Independence

Hubdocs owns the architecture authoring harness (`/architecture` family +
`/hubdocs`) and the docs ID/graph tools. ArtifactGraph is an **optional**
accelerator for registries/tags/parity only.

- Hubdocs **never requires** ArtifactGraph.
- ArtifactGraph must **not** index or own architecture Markdown.
- Missing Hubdocs MCP never blocks Markdown authoring: use repository search
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

## Quick start

**Linux / WSL**

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/main/install.sh | bash
hubdocs version
cd /path/to/your/docs-hub    # thư mục có architecture/
hubdocs init --location=local --yes
# hubdocs init               # interactive; local is the default
```

**Windows**

```powershell
irm https://raw.githubusercontent.com/raintr91/hubdocs/main/install.ps1 | iex
```

Requires **Node ≥ 22**.

Local `init` lấy docs root theo thứ tự `--docs-root` → `HUBDOCS_ROOT` → cwd có
`architecture/`. Không có sibling fallback hay package-global root marker.

Global wiring phải dùng `--location=global`. Không truyền `--docs-root` thì MCP
global là rootless và mỗi tool call phải truyền `docsRoot`.

Sau `init`: restart agent → thử tool `hubdocs_list_ids`.

---

## Update

Cùng lệnh cài — ghi đè `~/.hubdocs` + symlink CLI:

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/main/install.sh | bash
hubdocs version
```

Pin bản cụ thể:

```bash
HUBDOCS_REF=v1.0.0 curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/v1.0.0/install.sh | bash
```

Windows: chạy lại `irm …/install.ps1 | iex`.

Sau update: nếu đổi wire MCP thì `cd` docs hub → `hubdocs init --location=local --yes`
rồi restart agent.

Uninstall: `curl -fsSL …/install.sh | bash -s -- --uninstall`

---

## Commands

| Step | CLI |
|------|-----|
| Install / update package | `curl …/install.sh \| bash` |
| Wire agents (local default) | `hubdocs init` |
| Explicit rootless global MCP | `hubdocs init --location=global --yes` |
| Print MCP snippet | `hubdocs init --print-config cursor` |
| Install Cursor skill/rule/hooks | `hubdocs harness install` |
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

Docs root: tool `docsRoot` → project MCP `HUBDOCS_ROOT` → valid cwd → setup
error. Hub phải có `architecture/`.

Redirect stubs (old flat C4) bị bỏ qua khi index. `DYN-*` không còn được index — dùng `FLOW-*`.

---

## License

MIT
