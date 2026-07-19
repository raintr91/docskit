# hubdocs init — agents → lane → optional toolkits → MCP + harness

Repo: [raintr91/hubdocs](https://github.com/raintr91/hubdocs)

## Member UX

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/main/install.sh | bash
cd /path/to/your/docs-hub    # folder with architecture/
hubdocs init
```

TTY wizard:

1. Choose agents (checkbox)
2. Choose lane (`docs` authoring hub or `consumer` lookup)
3. Choose optional toolkits (`ArtifactGraph`; none = skip, add later)
4. Wire **project-local** MCP configs into the current repo and install the harness

No location prompt. Every selected agent gets a config under the repo cwd
(including Codex / Hermes / Antigravity).

Alias cũ: `hubdocs install` → gọi `init`.

---

## Interactive

```bash
hubdocs init
```

```text
hubdocs init — choose agents

Which agents should get hubdocs MCP?
  (↑↓ move · Space toggle · a all · Enter confirm)
 ❯ ◉ Claude Code  (detected)
   ◉ Cursor  (detected)
   ◯ Codex CLI
   …

Which Hubdocs lane?
  (↑↓ move · Enter confirm)
 ❯ ● docs — architecture authoring hub
   ○ consumer — FE/BE/tests lookup only

Optional toolkits to initialize now (none = skip, add later):
  (↑↓ move · Space toggle · a all · Enter confirm)
 ❯ ◯ ArtifactGraph — local registry/tag/parity accelerator
```

Consumer lane outside a docs hub asks for the docs hub path used as `HUBDOCS_ROOT`.
ArtifactGraph is unchecked by default. Selecting it delegates to the separately
installed `artifactgraph init` without downloading anything. If that toolkit is
not installed, Hubdocs init still succeeds and prints the command to run later.

| Phím | Việc |
|------|------|
| ↑ / ↓ (hoặc `k` / `j`) | Di chuyển |
| **Space** | Bật/tắt agent đang trỏ |
| `a` | Chọn / bỏ hết |
| **Enter** | Xác nhận |
| Ctrl+C | Huỷ |

---

## Non-interactive (CI)

```bash
cd /path/to/your/docs-hub
hubdocs init --yes
hubdocs init --target=cursor,claude --type=docs --yes
hubdocs init --target=cursor --type=docs --with=artifactgraph --yes
hubdocs init --target=none --type=docs --with=none --yes
hubdocs init --type=consumer --docs-root=/absolute/path/to/docs-hub --yes
hubdocs init --print-config cursor
```

| Flag | Giá trị | Mặc định |
|------|---------|----------|
| `--target` | `auto` · `all` · `none` · csv | prompt / với `--yes` = `auto` |
| `--type` | `docs` · `consumer` | prompt / với `--yes` = `docs` |
| `--with` | `artifactgraph` · `none` | prompt / non-TTY = `none` |
| `--artifactgraph` / `--no-artifactgraph` | alias bật/tắt optional | — |
| `--docs-root` | absolute path tới docs hub | `HUBDOCS_ROOT` → cwd có `architecture/` |
| `--yes` | bỏ prompt | — |
| `--wsl` | Cursor Win → MCP qua `wsl.exe` | — |
| `--location` | `local` · `global` | **local** (advanced/CI) |
| `--print-config <id>` | in snippet, không ghi | — |
| `--mcp-file <path>` | ghi thẳng 1 file (cursor) | — |

`--with=none` is the explicit empty optional selection. Hubdocs itself and its
harness are still initialized; optional toolkits can register themselves later.
For a docs lane, delegated ArtifactGraph uses `--type=docs`; a generic consumer
lane uses only `--type=common` because Hubdocs cannot infer FE/BE/tests.

---

## File MCP local (mặc định)

| Agent | Path trong repo |
|-------|-----------------|
| Claude Code | `./.claude.json` (+ `./.claude/settings.json` permissions) |
| Cursor | `./.cursor/mcp.json` |
| Codex CLI | `./.codex/config.toml` |
| opencode | `./opencode.jsonc` |
| Hermes | `./.hermes/config.yaml` |
| Gemini CLI | `./.gemini/settings.json` |
| Antigravity | `./.gemini/config/mcp_config.json` |
| Kiro | `./.kiro/settings/mcp.json` |
| Kilo Code | `./.kilocode/mcp.json` |

`--location=global` vẫn ghi home configs cho CI/rootless wiring.

Harness assets land under `.cursor/` and are tracked in
`.hubdocs/install-manifest.json`. `hubdocs init` merges only the local paths it
actually wrote into `.gitignore` (shared `.cursor/` + exclusive `.hubdocs/` and
agent-local configs). Global agent configs are never added to the repo ignore
file. Use `hubdocs deinit` to remove this repo's owned harness artifacts and
exclusive ignore entries (shared `.cursor/` is kept for other toolkits) and
`hubdocs uninstall` to remove everything globally.

---

## Docs root resolution

Mỗi tool resolve theo thứ tự:

1. `docsRoot` trong tool call.
2. `HUBDOCS_ROOT` trong project-local MCP entry.
3. cwd của MCP process nếu là docs hub hợp lệ.
4. Báo lỗi setup.

Package không tạo `docs-root.path`, không tìm sibling repository và không giữ
target dùng chung giữa các project.

---

## Cursor harness profiles

`hubdocs init` installs the harness for the chosen lane. You can still run harness
alone when needed:

```bash
hubdocs harness install --type=docs
hubdocs harness install --type=consumer
```

`docs` syncs the complete architecture-authoring family. `consumer` syncs only
the lightweight `/hubdocs` lookup skill/rule/schema/hook.

After init: restart agent(s), then try tool `hubdocs_list_ids`.
