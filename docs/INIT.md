# hubdocs init — wire MCP into agents

Repo: [raintr91/hubdocs](https://github.com/raintr91/hubdocs)

## Hai bước

| Bước | Lệnh | Phạm vi | Việc làm |
|------|------|---------|----------|
| 1. Package trên PATH | `curl …/install.sh \| bash` | Máy | Clone + build CLI `hubdocs` |
| 2. Wire **agents** | **`hubdocs init`** | Máy (global) hoặc cwd (local) | Ghi MCP vào Cursor / Claude / Kilo / … |

Không có `init-project` — chỉ cần trỏ `HUBDOCS_ROOT` (hoặc `--docs-root`) tới docs hub của bạn.

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
hubdocs init --yes
hubdocs init --target=cursor,claude,kilo --yes
hubdocs init --target=auto --location=local --yes
hubdocs init --docs-root=/absolute/path/to/your/docs-hub --yes
hubdocs init --print-config cursor
```

| Flag | Giá trị | Mặc định |
|------|---------|----------|
| `--target` | `auto` · `all` · `none` · csv | prompt / với `--yes` = `auto` |
| `--location` | `global` · `local` | interactive: **local**; `--yes`: `global` |
| `--docs-root` | absolute path tới docs hub | `HUBDOCS_ROOT` env · hoặc heuristic sibling (không giả định layout máy) |
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
