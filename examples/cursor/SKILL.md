---
name: hubdocs
extractBundle: hubdocs
description: /hubdocs — local MCP for arc42/C4 docs hub ID index.
disable-model-invocation: true
---

# /hubdocs

Package: [raintr91/hubdocs](https://github.com/raintr91/hubdocs)

**Rule:** `hubdocs.mdc` · hooks: `hubdocs-phase-hooks.md` · `mcp.cursor.example.json`

## Setup

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/main/install.sh | bash
hubdocs init
# hubdocs init --docs-root=/absolute/path/to/your/docs-hub --yes
```

## Tools

`hubdocs_list_ids` · `hubdocs_get_element` · `hubdocs_deps_of` · `hubdocs_dependents_of` · `hubdocs_orphans` · `hubdocs_validate_links` · `hubdocs_route` · `hubdocs_journeys` · `hubdocs_layout`

Prefer these before dumping whole `architecture/**`.
