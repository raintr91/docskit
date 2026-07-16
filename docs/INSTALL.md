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
hubdocs init                    # interactive agents
# hubdocs init --yes --docs-root=/absolute/path/to/your/docs-hub
```

Uninstall:

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/main/install.sh | bash -s -- --uninstall
```

Defaults: tree → `~/.hubdocs`, link → `~/.local/bin/hubdocs` — **không** phụ thuộc layout workspace của người cài.

Docs hub: `export HUBDOCS_ROOT=…` hoặc `hubdocs init --docs-root=…` (path tuyệt đối tới docs hub của bạn).

## Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/raintr91/hubdocs/main/install.ps1 | iex
```

WSL có sẵn → chạy `install.sh` trong WSL rồi `hubdocs init`.

## Alias

`hubdocs install` → deprecated alias của `init` (agents).
