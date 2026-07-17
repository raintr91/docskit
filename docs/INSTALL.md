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

Pin tag: `HUBDOCS_REF=v1.0.1 curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/v1.0.1/install.sh | bash`

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
hubdocs harness install [--project-root /path/to/docs] [--force]
hubdocs status [--project-root /path/to/docs]
hubdocs prune [--project-root /path/to/docs]        # preview only
hubdocs prune [--project-root /path/to/docs] --yes  # apply safe deletions
```

`.hubdocs/install-manifest.json` tracks only Hubdocs-owned files copied
directly into `.cursor/`. Install preserves modified managed files unless
`--force` is explicit and records package files that disappear on upgrade as
stale. Prune removes only stale files that still match their recorded hash;
modified and unmanaged files remain. The shared merged
`.cursor/extracts/extract-registry.json` and `platform-repos.json` are outside
the ownership manifest and are never pruned.
