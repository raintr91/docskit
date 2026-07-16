# Hubdocs — phase hooks (docs hub MCP)

> Skill `/hubdocs`. SSOT = MD in the docs hub — MCP only **indexes** + validates.
> Layout: arc42 `architecture/01`…`12` + `product/` (not old flat C4 folders).

## Protocol

```text
(1) hubdocs_layout / hubdocs_route / hubdocs_list_ids  — narrow scope
(2) hubdocs_get_element  — primary + excerpts (canonical first)
(3) hubdocs_deps_of / hubdocs_dependents_of  — ref impact
(4) hubdocs_orphans / hubdocs_validate_links  — before claiming complete
```

| Do locally | Do NOT |
|------------|--------|
| Query by ID / kind / prefix | Dump whole `architecture/**` |
| Use `FLOW-*` + `/journey` | Write new `DYN-*` or `architecture/dynamics/` |
| ADR under `09-decisions/` | Put ADRs under `product/shared/adr` |
| Code under `product/**/code/` | Duplicate Code under `05-building-blocks` |

## Wire MCP

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/hubdocs/main/install.sh | bash
hubdocs init --docs-root=/absolute/path/to/your/docs-hub --yes
```

## Per skill

### `/architecture` — `hubdocs_route` → targeted chapter
### `/journey` — `hubdocs_journeys` → `FLOW-*`
### `/context` `/containers` `/component` `/decision` `/deployment` `/cross-cutting`
— `hubdocs_list_ids` filtered by kind → `hubdocs_get_element`
