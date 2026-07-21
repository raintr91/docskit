# Docs hub graph — load per phase (arc42 × C4)

Extract bundles: `.cursor/extracts/extract-registry.json`

Path root: `architecture/01`…`12` + `product/` · resolve via `docskit_*` MCP

| Need | MCP tool | Do not load |
|------|----------|-------------|
| Layout / ID homes | `docskit_layout` | guess old flat C4 paths |
| List IDs | `docskit_list_ids` | whole `architecture/**` tree |
| One element | `docskit_get_element` | unrelated chapters |
| Refs from ID | `docskit_deps_of` | full link graph |
| Who mentions ID | `docskit_dependents_of` | all MD grep |
| Topic → chapter | `docskit_route` | all chapters |
| Journeys | `docskit_journeys` | every journey file |
| Catalog gaps | `docskit_orphans` | — |
| Broken links | `docskit_validate_links` | — |

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

| Phase | Prefer docskit first | Then load (targeted) |
|-------|---------------------|----------------------|
| `/architecture` | `docskit_route` | one chapter via `docskit_get_element` |
| `/journey` | `docskit_journeys` | selected `FLOW-*` |
| `/context` | `docskit_list_ids` kind=CTX\|LND | `docskit_get_element` |
| `/containers` | `docskit_list_ids` kind=CTR | `docskit_get_element` |
| `/component` | `docskit_list_ids` kind=CMP | `docskit_get_element` |
| `/decision` | `docskit_list_ids` kind=ADR | `docskit_get_element` |
| `/deployment` | `docskit_list_ids` kind=DEP | stub-first |
