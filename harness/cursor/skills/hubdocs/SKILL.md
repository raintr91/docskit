---
name: hubdocs
extractBundle: hubdocs
description: /hubdocs — MCP index for a conforming arc42 × C4 documentation hub.
disable-model-invocation: true
---

# /hubdocs

Package: [raintr91/hubdocs](https://github.com/raintr91/hubdocs)

The docs repo owns architecture/product Markdown. Hubdocs only indexes,
validates, and routes content from the configured docs root. This skill may be
installed as a lightweight consumer in FE/BE/tests; it must still read the
member-selected docs repo, never the current code repo.

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

Docs install:

```bash
cd /path/to/docs-hub
hubdocs init --location=local --yes
hubdocs harness install --type=docs
```

Consumer install from FE/BE/tests:

```bash
cd /path/to/code-or-tests-repo
hubdocs init --location=local --docs-root=/absolute/path/to/docs-hub --yes
hubdocs harness install --type=consumer
```

The local MCP entry stores `HUBDOCS_ROOT`; every tool also accepts `docsRoot`.
The selected hub must contain `architecture/`. Never infer a sibling checkout.

## Index routing

Do not merge repositories into one workspace graph. Route by intent:

- Architecture ID / C4 path → Hubdocs (`HUBDOCS_ROOT`). Never CodeGraph for
  architecture Markdown.
- IR / registry / generation → pointer kits when present
  (`CODEGENKIT_DOCS_ROOT`, `TESTKIT_DOCS_ROOT`, `TESTKIT_TESTS_ROOT`).
- Symbol / call-graph for repo `X` → CodeGraph MCP of repo `X`
  (`codegraph-<key>`, `--project-root` = checkout of `X`). Platform DNA wires
  those servers from `platform-repos.local.json` /
  `legacy-repos.local.json`; do not hand-edit `.cursor/mcp.json` for that.
- ArtifactGraph stays local-only and must not index other repositories.

## Owned architecture family

Docs `harness install --type=docs` also syncs `/architecture`, `/system-context`, `/containers`,
`/overview`, `/surfaces`, `/module`, `/business-process`, `/db-erd`, `/cross-service`, `/architecture-grill`,
`/deployment`, `/journey`, `/spec`, `/legacy-spec` and all `/legacy-*` variants, plus the `architecture-core` extract bundle.
Consumer mode syncs only `/hubdocs`, its rule/schema, and targeted phase hook.

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
