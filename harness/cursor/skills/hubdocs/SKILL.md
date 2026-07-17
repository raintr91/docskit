---
name: hubdocs
extractBundle: hubdocs
description: /hubdocs — MCP index for a conforming arc42 × C4 documentation hub.
disable-model-invocation: true
---

# /hubdocs

Package: [raintr91/hubdocs](https://github.com/raintr91/hubdocs)

The target repository owns its Markdown. Hubdocs only indexes, validates, and
routes content from the configured docs root.

## Protocol

```text
hubdocs_layout / hubdocs_route / hubdocs_list_ids
  → hubdocs_get_element
  → hubdocs_deps_of / hubdocs_dependents_of
  → hubdocs_orphans / hubdocs_validate_links
```

Use `hubdocs_journeys` before reading every journey file. Prefer targeted tool
results over dumping `architecture/**`.

## Root and setup

Project-local MCP wiring should set `HUBDOCS_ROOT` to this docs hub:

```bash
cd /path/to/docs-hub
hubdocs init --location=local --yes
hubdocs harness install
```

Every tool also accepts `docsRoot`, which is required for a rootless global MCP
entry. The selected hub must contain `architecture/`.
