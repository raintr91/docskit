# Package bootstrap (curl / irm)

> **Wire agents:** [INIT.md](./INIT.md) — lệnh chính là `hubdocs init`.

Repo: [raintr91/hubdocs](https://github.com/raintr91/hubdocs)

## Hai bước

| Bước | Lệnh | Việc |
|------|------|------|
| 1 | `curl …/install.sh \| bash` | CLI trên PATH |
| 2 | **`hubdocs init`** | Wire Cursor / Claude / Kilo (↑↓ · Space) |

## Linux / WSL

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/main/install.sh | bash
hubdocs version
cd /path/to/your/docs-hub    # must contain architecture/
hubdocs init --location=local --yes
# hubdocs init               # interactive agents
```

Uninstall:

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/main/install.sh | bash -s -- --uninstall
```

Defaults: tree → `~/.hubdocs`, link → `~/.local/bin/hubdocs`.

Docs hub: **cd vào hub rồi `hubdocs init`**. Local là mặc định; root resolve từ
`--docs-root` → `HUBDOCS_ROOT` → valid cwd. Package không lưu target marker và
không tìm sibling repo.

## Update

Cùng lệnh install (ghi đè `~/.hubdocs`):

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/main/install.sh | bash
hubdocs version
```

Pin tag: `HUBDOCS_REF=v1.0.2 curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/v1.0.2/install.sh | bash`

## Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/raintr91/hubdocs/main/install.ps1 | iex
```

WSL có sẵn → chạy `install.sh` trong WSL, cd vào docs hub rồi
`hubdocs init --location=local --yes --wsl`.

## Alias

`hubdocs install` → deprecated alias của `init` (agents).

## Managed Cursor harness

```bash
hubdocs harness install --type=docs [--project-root /path/to/docs] [--force]
hubdocs harness install --type=consumer [--project-root /path/to/fe-or-be] [--force]
hubdocs status [--project-root /path/to/docs]
hubdocs prune [--project-root /path/to/docs]        # preview only
hubdocs prune [--project-root /path/to/docs] --yes  # apply safe deletions
```

## Uninstall

```bash
hubdocs uninstall                     # TTY scope menu (repo / all-repos / mcp / cli / all)
hubdocs uninstall --yes               # this repo: harness + local MCP
hubdocs uninstall --all --yes         # all ledger repos + MCP local/global + CLI
hubdocs uninstall --scope=all-repos --discover ~/workspace --yes
```

Dry-run unless `--yes`. Owned harness files matching their recorded hash are
deleted; **member-modified files are preserved and reported**. Only the
Hubdocs-owned bundle keys are removed from the shared
`.cursor/extracts/extract-registry.json` (the file is deleted only if no other
toolkit's bundles remain). `harness install` records each repo in an install
ledger (`$XDG_STATE_HOME/hubdocs/installs.json`) so `--all`/`all-repos` can clean
every location without a manual `cd`; use `--discover <dir>` to rebuild the list
for older ledger-less installs. `--scope=cli` removes just the CLI
(`~/.hubdocs` + `~/.local/bin` symlinks), equivalent to
`install.sh -- --uninstall`.

`docs` syncs the complete architecture-authoring family. `consumer` syncs only
the lightweight `/hubdocs` lookup skill/rule/schema/hook; wire its local MCP
entry with an explicit `--docs-root` so `HUBDOCS_ROOT` points to the
member-selected docs repo.

`.hubdocs/install-manifest.json` tracks only Hubdocs-owned files copied
directly into `.cursor/`. Install preserves modified managed files unless
`--force` is explicit and records package files that disappear on upgrade as
stale. Prune removes only stale files that still match their recorded hash;
modified and unmanaged files remain. The shared merged
`.cursor/extracts/extract-registry.json` is outside the ownership manifest and
is never pruned. Hubdocs does not write `platform-repos*.json`; project maps
are Platform DNA-owned and optional.
