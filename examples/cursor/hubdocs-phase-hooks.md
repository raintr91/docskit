# Hubdocs — phase hooks

Hubdocs is an optional index over Markdown owned by the current docs hub.

```text
(1) hubdocs_layout / hubdocs_route / hubdocs_list_ids — narrow scope
(2) hubdocs_get_element — canonical file and targeted excerpt
(3) hubdocs_deps_of / hubdocs_dependents_of — reference impact
(4) hubdocs_orphans / hubdocs_validate_links — catalog health
```

Use `FLOW-*` and `hubdocs_journeys` for journeys. Keep ADRs in the configured
arc42 decision home and code-level IDs in the target hub's product tree.

If Hubdocs is not connected, continue with direct Markdown inspection. To wire
it locally:

```bash
cd /path/to/docs-hub
hubdocs init --location=local --yes
```
