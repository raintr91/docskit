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
hubdocs init --yes           # uses cwd as HUBDOCS_ROOT
# hubdocs init               # interactive agents
```

Uninstall:

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/main/install.sh | bash -s -- --uninstall
```

Defaults: tree → `~/.hubdocs`, link → `~/.local/bin/hubdocs`.

Docs hub: **cd vào hub rồi `hubdocs init`** (ưu tiên). Tuỳ chọn: `--docs-root=…` hoặc `HUBDOCS_ROOT`.

## Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/raintr91/hubdocs/main/install.ps1 | iex
```

WSL có sẵn → chạy `install.sh` trong WSL rồi `hubdocs init`.

## Alias

`hubdocs install` → deprecated alias của `init` (agents).
