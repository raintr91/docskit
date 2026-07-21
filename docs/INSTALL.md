# Package bootstrap (curl / irm)

> **Wire agents:** [INIT.md](./INIT.md) — lệnh chính là `docskit init`.

Repo: [raintr91/docskit](https://github.com/raintr91/docskit)

## Hai bước

| Bước | Lệnh | Việc |
|------|------|------|
| 1 | `curl …/install.sh \| bash` | CLI trên PATH |
| 2 | **`docskit init`** | Hỏi agent → lane → optional toolkits → MCP local + harness |

## Linux / WSL

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/docskit/main/install.sh | bash
docskit version
cd /path/to/your/docs-hub    # must contain architecture/
docskit init                 # interactive: agents → lane → optional toolkits
# docskit init --yes         # CI: detected agents + docs lane
# docskit init --with=artifactgraph --yes
```

Uninstall:

```bash
docskit uninstall              # preview + confirm: all repos, MCP and CLI
docskit uninstall --yes        # non-interactive
```

Defaults: tree → `~/.docskit`, link → `~/.local/bin/docskit`.

Docs hub: **cd vào hub rồi `docskit init`**. Local là mặc định; root resolve từ
`--docs-root` → `DOCSKIT_ROOT` → valid cwd. Package không tự tìm sibling repo;
install ledger chỉ phục vụ `docskit uninstall`, không tham gia resolve docs root.
Optional ArtifactGraph mặc định skip; chọn trong wizard hoặc dùng
`--with=artifactgraph`. Docskit chỉ delegate sang toolkit đã cài, không clone hay
cài ngầm; nếu chưa có thì init Docskit vẫn thành công và in lệnh chạy sau.

## Update

Cùng lệnh install (ghi đè `~/.docskit`):

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/docskit/main/install.sh | bash
docskit version
```

Pin tag: `DOCSKIT_REF=v1.1.0 curl -fsSL https://raw.githubusercontent.com/raintr91/docskit/v1.1.0/install.sh | bash`

## Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/raintr91/docskit/main/install.ps1 | iex
```

WSL có sẵn → chạy `install.sh` trong WSL, cd vào docs hub rồi
`docskit init --location=local --yes --wsl`.

## Alias

`docskit install` → deprecated alias của `init` (agents).

## Managed Cursor harness

```bash
docskit harness install --type=docs [--project-root /path/to/docs] [--force]
docskit harness install --type=consumer [--project-root /path/to/fe-or-be] [--force]
docskit status [--project-root /path/to/docs]
docskit prune [--project-root /path/to/docs]        # preview only
docskit prune [--project-root /path/to/docs] --yes  # apply safe deletions
```

## Uninstall

```bash
docskit deinit                         # this repo: harness + local MCP
docskit uninstall                      # global: all ledger repos + MCP + CLI
docskit deinit --yes                   # non-interactive apply
docskit uninstall --yes                # non-interactive global apply
docskit uninstall --discover ~/workspace --yes  # recover older ledger-less installs
```

Dry-run unless `--yes`. Owned harness files matching their recorded hash are
deleted; **member-modified files are preserved and reported**. Only the
Docskit-owned bundle keys are removed from the shared
`.cursor/extracts/extract-registry.json` (the file is deleted only if no other
toolkit's bundles remain). `harness install` records each repo in an install
ledger (`$XDG_STATE_HOME/docskit/installs.json`) so `docskit uninstall` cleans
every location without a manual `cd`; use `--discover <dir>` to rebuild the list
for older ledger-less installs. Advanced `--scope` filters remain supported but
are not needed for the normal install/init lifecycle.

`docs` syncs the complete architecture-authoring family. `consumer` syncs only
the lightweight `/docskit` lookup skill/rule/schema/hook; wire its local MCP
entry with an explicit `--docs-root` so `DOCSKIT_ROOT` points to the
member-selected docs repo.

`.docskit/install-manifest.json` tracks only Docskit-owned files copied
directly into `.cursor/`. Install preserves modified managed files unless
`--force` is explicit and records package files that disappear on upgrade as
stale. Prune removes only stale files that still match their recorded hash;
modified and unmanaged files remain. The shared merged
`.cursor/extracts/extract-registry.json` is outside the ownership manifest and
is never pruned. Docskit does not write `platform-repos*.json`; project maps
are Platform DNA-owned and optional.
