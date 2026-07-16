# Docs hub graph — load per phase (arc42 × C4)

Extract bundles: `.cursor/extracts/extract-registry.json`

Path root: `architecture/01`…`12` + `product/` · resolve via `hubdocs_*` MCP

| Need | MCP tool | Do not load |
|------|----------|-------------|
| Layout / ID homes | `hubdocs_layout` | guess old flat C4 paths |
| List IDs | `hubdocs_list_ids` | whole `architecture/**` tree |
| One element | `hubdocs_get_element` | unrelated chapters |
| Refs from ID | `hubdocs_deps_of` | full link graph |
| Who mentions ID | `hubdocs_dependents_of` | all MD grep |
| Topic → chapter | `hubdocs_route` | all chapters |
| Journeys | `hubdocs_journeys` | every journey file |
| Catalog gaps | `hubdocs_orphans` | — |
| Broken links | `hubdocs_validate_links` | — |

## Canonical homes (SSOT)

| Prefix | Path |
|--------|------|
| `LND-*` `CTX-*` | `architecture/03-context/` (headings) |
| `CTR-*` | `architecture/05-building-blocks/` (headings) |
| `FLOW-*` | `architecture/06-runtime/journeys/` |
| `DEP-*` | `architecture/07-deployment/` (headings) |
| `ADR-*` | `architecture/09-decisions/` |
| `CMP-*` `W-*` `API-*` `UI-*` | `product/` |

**Ignored (redirect stubs):** `architecture/{landscape,context,containers,dynamics,deployments}` · `product/shared/adr`  
**Deprecated:** `DYN-*` → use `FLOW-*` + `/journey`

| Phase | Prefer hubdocs first | Then load (targeted) |
|-------|---------------------|----------------------|
| `/architecture` | `hubdocs_route` | one chapter via `hubdocs_get_element` |
| `/journey` | `hubdocs_journeys` | selected `FLOW-*` |
| `/context` | `hubdocs_list_ids` kind=CTX\|LND | `hubdocs_get_element` |
| `/containers` | `hubdocs_list_ids` kind=CTR | `hubdocs_get_element` |
| `/component` | `hubdocs_list_ids` kind=CMP | `hubdocs_get_element` |
| `/decision` | `hubdocs_list_ids` kind=ADR | `hubdocs_get_element` |
| `/deployment` | `hubdocs_list_ids` kind=DEP | stub-first |
