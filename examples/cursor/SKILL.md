---
name: docskit
extractBundle: docskit
description: /docskit — MCP index for a conforming arc42 × C4 documentation hub.
disable-model-invocation: true
---

# /docskit

Package: [raintr91/docskit](https://github.com/raintr91/docskit)

The target repository owns its Markdown. Docskit only indexes, validates, and
routes content from the configured docs root.

## Protocol

```text
docskit_layout / docskit_route / docskit_list_ids
  → docskit_get_element
  → docskit_deps_of / docskit_dependents_of
  → docskit_orphans / docskit_validate_links
```

Use `docskit_journeys` before reading every journey file. Prefer targeted tool
results over dumping `architecture/**`.

## Root and setup

Project-local MCP wiring should set `DOCSKIT_ROOT` to this docs hub:

```bash
cd /path/to/docs-hub
docskit init --location=local --yes
docskit harness install
```

Every tool also accepts `docsRoot`, which is required for a rootless global MCP
entry. The selected hub must contain `architecture/`.
