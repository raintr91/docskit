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

## Owned architecture family

`harness install` also syncs `/architecture` `/context` `/containers`
`/component` `/journey` `/deployment` `/decision` `/cross-cutting` and the
deprecated `/dynamics` redirect, plus the `architecture-core` extract bundle.

## Accelerators (optional)

```text
ArtifactGraph: optional registry/tag/parity hints only
else: continue with Hubdocs tools + direct Markdown inspection

Hubdocs never requires ArtifactGraph.
ArtifactGraph must not index or own architecture Markdown.
If this MCP is not connected: Glob/search under architecture/ and product/,
then Read scoped Markdown. Authoring is never blocked.
```

At run start, assign one stable `runId`. If `@platform/artifactgraph` is not
configured, unavailable, or its invocation fails, continue with targeted local
search and scoped Markdown reads. Count each successful fallback file read and
its exact raw byte length. After the fallback completes, emit exactly one
`hubdocs.missing-optional` JSON event for the `runId` + optional pair using
`.cursor/schemas/hubdocs/missing-optional-event.schema.json`. Deduplicate
retries. Report only actual `fileReads` and `contextBytes`; never estimate
tokens or token savings.
