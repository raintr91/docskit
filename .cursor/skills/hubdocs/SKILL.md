---
name: hubdocs
extractBundle: hubdocs
description: /hubdocs — local MCP for arc42/C4 docs hub ID index (this package).
disable-model-invocation: true
---

# /hubdocs

Package root: repo này · GitHub: [raintr91/hubdocs](https://github.com/raintr91/hubdocs)

**Docs trong package:** `README.md` · `docs/INIT.md` · `mcp.cursor.example.json`  
**Rule:** `hubdocs.mdc` · hooks: `.cursor/extracts/hubdocs-phase-hooks.md`

## Local-first (docs index)

```text
hubdocs_list_ids / hubdocs_route  →  hubdocs_get_element (targeted slice)
  → hubdocs_deps_of / hubdocs_dependents_of (impact)
  → hubdocs_orphans / hubdocs_validate_links (catalog health)
```

| Local | Không dump context |
|-------|-------------------|
| One ID via `hubdocs_get_element` | Whole `architecture/**` |
| `hubdocs_route` topic → chapter | All arc42 chapters |
| `hubdocs_journeys` list | Every journey file |

## Tools (MCP)

`hubdocs_list_ids` · `hubdocs_get_element` · `hubdocs_deps_of` · `hubdocs_dependents_of` · `hubdocs_orphans` · `hubdocs_validate_links` · `hubdocs_route` · `hubdocs_journeys` · `hubdocs_layout`

Env: `HUBDOCS_ROOT` → absolute path tới docs hub (`architecture/` required).

## Install / wire

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/main/install.sh | bash
hubdocs init
# cd /path/to/your/docs-hub && hubdocs init --yes
```
