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
- Missing ArtifactGraph falls back to targeted local reads and emits one
  deduplicated `hubdocs.missing-optional` event per run/optional with measured
  `fileReads` and `contextBytes`; token usage is not estimated.
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
cd /path/to/your-docs-hub    # thư mục có architecture/
hubdocs init                 # agents → lane → optional toolkits → MCP + harness
```

**Windows**

```powershell
irm https://raw.githubusercontent.com/raintr91/hubdocs/main/install.ps1 | iex
```

Requires **Node ≥ 22**.

`init` luôn ghi MCP **local trong repo đang chạy**. Local docs root theo thứ tự
`--docs-root` → `HUBDOCS_ROOT` → cwd có `architecture/`. Không có sibling
fallback. CI có thể dùng `hubdocs init --yes` (lane mặc định `docs`).
Optional ArtifactGraph mặc định được bỏ qua; chọn trong wizard hoặc dùng
`--with=artifactgraph`. Hubdocs không cài ngầm toolkit khác.

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
HUBDOCS_REF=v1.1.0 curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/v1.1.0/install.sh | bash
```

Windows: chạy lại `irm …/install.ps1 | iex`.

Sau update: `cd` docs hub → `hubdocs init` rồi restart agent.

---

## Uninstall

Hai cấp lifecycle tương ứng:

```bash
hubdocs deinit                         # repo hiện tại: harness + MCP local
hubdocs uninstall                      # global: mọi repo + MCP local/global + CLI
```

Mặc định lệnh sẽ preview và hỏi xác nhận trong TTY; thêm `--yes` cho automation.
File member đã sửa được **giữ lại + báo**.

`harness install` ghi lại repo vào **install ledger** (`$XDG_STATE_HOME/hubdocs/installs.json`)
để `hubdocs uninstall` dọn mọi nơi mà không cần `cd`. Với bản cài cũ chưa có ledger:

```bash
hubdocs uninstall --discover ~/workspace --yes
```

Các cờ `--scope`, `--project-root`, `--target` và `--location` vẫn giữ cho nhu cầu
advanced/backward compatibility, không cần trong luồng thông thường.

---

## Commands

| Step | CLI |
|------|-----|
| Install / update package | `curl …/install.sh \| bash` |
| Agents → lane → optional toolkits → MCP + harness | `hubdocs init` |
| CI non-interactive | `hubdocs init --yes` |
| CI + ArtifactGraph đã cài | `hubdocs init --with=artifactgraph --yes` |
| Print MCP snippet | `hubdocs init --print-config cursor` |
| Harness-only (advanced) | `hubdocs harness install --type=docs\|consumer` |
| Inspect managed harness assets | `hubdocs status` |
| Preview/remove stale managed assets | `hubdocs prune [--yes]` |
| Remove this repo's harness + local MCP | `hubdocs deinit [--yes]` |
| Remove everything globally | `hubdocs uninstall [--yes]` |
| Version / paths | `hubdocs version` |

`install` = deprecated alias của `init`.

Harness installs record direct-copy Hubdocs assets in
`.hubdocs/install-manifest.json`. Upgrades preserve locally modified managed
files unless `--force` is passed. Assets removed from a newer package become
stale; `prune` is a dry run, and `prune --yes` deletes only stale files whose
hash still matches the installed copy. The shared merged
`.cursor/extracts/extract-registry.json` is never claimed or pruned. Hubdocs
never writes `platform-repos*.json` (Platform DNA-owned, optional). The Hubdocs-owned optional fallback schema is installed at
`.cursor/schemas/hubdocs/missing-optional-event.schema.json` and follows the
same managed lifecycle.

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
