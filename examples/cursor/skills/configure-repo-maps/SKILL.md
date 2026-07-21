---
name: configure-repo-maps
extractBundle: configure-repo-maps
description: /configure-repo-maps — NL → machine-local platform/legacy checkout maps (thin Docskit copy; prefer Platform DNA skill when installed).
disable-model-invocation: true
---

<!-- toolkit:configure-repo-maps-thin -->

# /configure-repo-maps — Declare checkout maps in natural language

**Extracts:** `extractBundle: configure-repo-maps`

**Owner:** Platform DNA. Prefer `.cursor/skills/configure-repo-maps/SKILL.md` from
Platform DNA when that toolkit is installed (same name — load DNA copy first).
This Docskit extract exists so members who only init Docskit can still fill
maps without hand-editing JSON.

## Goal

Member describes repo topology in natural language → agent merges keys into the
correct **machine-local** map. Never ask the member to paste JSON.

## Which file

| Intent | Write |
|--------|--------|
| Platform checkouts (portal, api, docs, tests, …) | `platform-repos.local.json` |
| Legacy / brownfield / keys `legacy-*` | `legacy-repos.local.json` |
| Portable catalog key+url only (legacy) | optional `legacy-repos.json` (`url` + `root: "."` only) |

**Do not** write absolute/sibling paths into portable `platform-repos.json` or
`legacy-repos.json`. **Do not** create or overwrite `platform-repos.json` /
`platform-repos.example.json` (Platform DNA owns those).

Legacy-only prompts must not touch the platform portable map.

## Workflow

1. If Platform DNA skill is present under the same path after DNA init, follow
   that SSOT instead of this thin copy.
2. Parse the member prompt; ask when role / absolute root / key is missing —
   never invent sibling paths.
3. Merge by key (do not wipe existing projects unless member says replace).
4. Validate: local maps hold machine `root`; portable legacy entries are
   portable-only (`url`, optional `root: "."`).
5. After writes: suggest `platform-dna codegraph:wire` when Cursor is in use;
   if a checkout has no `.codegraph/`, print `cd <root> && codegraph init`.

## Example prompts

```text
docs = base-docs ở ~/ws/base-docs; portal admin ở ~/ws/portal; api core ở ~/ws/api
```

```text
legacy ERP cũ ở D:\legacy\erp, key legacy-erp
```

## Gaps handoff

Skills that need a checkout root (`/legacy-spec`, cross-repo traces) and find
maps empty / missing key → tell the member to run `/configure-repo-maps` with a
short NL description. Do not instruct copy/paste of JSON.
