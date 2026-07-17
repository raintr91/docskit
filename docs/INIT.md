# hubdocs init — wire MCP into agents

Repo: [raintr91/hubdocs](https://github.com/raintr91/hubdocs)

## Hai bước

| Bước | Lệnh | Phạm vi | Việc làm |
|------|------|---------|----------|
| 1. Package trên PATH | `curl …/install.sh \| bash` | Máy | Clone + build CLI `hubdocs` |
| 2. Wire **agents** | **`hubdocs init`** | cwd (**local mặc định**) | Ghi MCP vào Cursor / Claude / Kilo / … |

Không có `init-project` — **cd vào docs hub** (có `architecture/`) rồi `hubdocs init`. Tuỳ chọn `--docs-root` / `HUBDOCS_ROOT`.


Alias cũ: `hubdocs install` → gọi `init`.

---

## `hubdocs init` (agents)

### Interactive

```bash
hubdocs init
```

```text
hubdocs init — wire MCP into agents

Which agents should get hubdocs MCP?
  (↑↓ move · Space toggle · a all · Enter confirm)
 ❯ ◉ Claude Code  (detected)
   ◉ Cursor  (detected)
   ◯ Codex CLI
   …
```

| Phím | Việc |
|------|------|
| ↑ / ↓ (hoặc `k` / `j`) | Di chuyển |
| **Space** | Bật/tắt agent đang trỏ |
| `a` | Chọn / bỏ hết |
| **Enter** | Xác nhận |
| Ctrl+C | Huỷ |

### Non-interactive

```bash
cd /path/to/your/docs-hub
hubdocs init --yes
hubdocs init --target=cursor,claude,kilo --yes
hubdocs init --target=auto --location=local --yes
hubdocs init --docs-root=/absolute/path/to/other/hub --yes   # khi không đứng trong hub
hubdocs init --print-config cursor
hubdocs init --location=global --yes                         # rootless global
```

| Flag | Giá trị | Mặc định |
|------|---------|----------|
| `--target` | `auto` · `all` · `none` · csv | prompt / với `--yes` = `auto` |
| `--location` | `local` · `global` | **local** cho interactive, `--yes`, non-TTY |
| `--docs-root` | absolute path tới docs hub | local: `HUBDOCS_ROOT` → cwd có `architecture/`; global: không root nếu bỏ flag |
| `--yes` | bỏ prompt | — |
| `--wsl` | Cursor Win → MCP qua `wsl.exe` | — |
| `--print-config <id>` | in snippet, không ghi | — |
| `--mcp-file <path>` | ghi thẳng 1 file (cursor) | — |

### File được ghi

| Agent | `--location=global` | `--location=local` |
|-------|---------------------|--------------------|
| Claude Code | `~/.claude.json` (+ allow `mcp__hubdocs__*`) | `./.claude.json` |
| Cursor | `~/.cursor/mcp.json` | `./.cursor/mcp.json` |
| Codex CLI | `~/.codex/config.toml` | — (global only) |
| opencode | `~/.config/opencode/opencode.jsonc` | `./opencode.jsonc` |
| Hermes | `$HERMES_HOME/config.yaml` | — (global only) |
| Gemini CLI | `~/.gemini/settings.json` | `./.gemini/settings.json` |
| Antigravity | `~/.gemini/config/mcp_config.json` | — (global only) |
| Kiro | `~/.kiro/settings/mcp.json` | `./.kiro/settings/mcp.json` |
| Kilo Code | `~/.kilocode/mcp.json` | `./.kilocode/mcp.json` |

Entry MCP (Cursor / Claude / …):

```json
{
  "mcpServers": {
    "hubdocs": {
      "type": "stdio",
      "command": "/path/to/node",
      "args": ["/path/to/hubdocs/bin/hubdocs-mcp.mjs"],
      "env": {
        "HUBDOCS_ROOT": "/path/to/your/docs-hub"
      }
    }
  }
}
```

Sau khi ghi: **restart** agent → thử `hubdocs_list_ids`.

## Root semantics

Mỗi tool resolve theo thứ tự:

1. `docsRoot` trong tool call.
2. `HUBDOCS_ROOT` trong project-local MCP entry.
3. cwd của MCP process nếu là docs hub hợp lệ.
4. Báo lỗi setup.

Package không tạo `docs-root.path`, không tìm sibling repository và không giữ
target dùng chung giữa các project.

Global mode chỉ được bật bằng `--location=global`. Mặc định entry global không
có root cố định; truyền `docsRoot` cho mỗi tool. Có thể tạo một named global
default bằng `--location=global --docs-root=/absolute/path/to/hub`, nhưng entry
đó chỉ dành cho hub đã chỉ định.

## Optional Cursor harness

Sau khi cài package, có thể cài skill, rule và phase hooks Hubdocs vào project:

```bash
hubdocs harness install
```

Lệnh idempotent và không ghi đè file đã tùy chỉnh. Dùng `--force` nếu chủ động
muốn thay bằng bản package; `--project-root` để chọn project khác cwd.
