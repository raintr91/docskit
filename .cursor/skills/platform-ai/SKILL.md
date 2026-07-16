---
name: platform-ai
extractBundle: platform-ai
description: /platform-ai — maintain MCP package + harness map (hubdocs tooling lane).
disable-model-invocation: true
---

# /platform-ai — MCP tooling harness

Chỉ khi **sửa** package MCP, `platform-repos.json`, sync scripts, hoặc `.cursor/` **trong repo này** — không implement feature app / spec / E2E plans.

## Phạm vi repo này

| Giữ tại **hubdocs** | Không làm chính tại đây |
|---------------------|-------------------------|
| `src/`, `bin/`, `README.md` | `/prototype` `/wire` `/test` (portal) |
| `platform-repos.json` + `harness` + lane groups | `/spec` grill `/dynamics` (`base-docs`) |
| `scripts/sync-platform-repos-bases.py` (map only) | `/testcase` (`base-tests`) |
| `scripts/platform-workspace-from-repos.mjs` | `platform-base` (Nuxt — chỉ portal) |
| Skills: `platform-ai`, `platform-mark`, `hubdocs` | Bulk copy `.cursor/` từ portal |

**SSOT:** map = `platform-repos.json` (sync từ `@artifactgraph`) · harness `.cursor/` = chỉnh **tại repo này**.

## Scripts

```bash
python3 scripts/sync-platform-repos-bases.py          # propagate map → sibling bases (run from artifactgraph SSOT)
node scripts/platform-workspace-from-repos.mjs --group=mcp   # local workspace (gitignored)
./scripts/cursor-export-kilo                        # optional Kilo mirror
```

## Commands

| Command | Khi nào |
|---------|---------|
| `/platform-ai` | this — MCP package + harness |
| `/hubdocs` | MCP tools, docs index, validate links |
| `/platform-mark` | Tags/lexicon — lanes `fe` · `be` · `plans` (hub R2.1 / R3.1) |

Feature / spec / plans → workspace lane đúng (`--group=docs`, `code-fe`, …) — **một chat một lane**.

## Tag / vocabulary (3 lane nghiệp vụ)

| Lane | MCP `suggest_tags` | Hub lexicon |
|------|-------------------|-------------|
| FE / UI | `fe`, `docs` | R2.1 `registry-tags.en.txt` (@base-docs) |
| BE / API | `be` | R2.1 (`#api:`, `#needs-endpoint`, `#needs-dto`) |
| Test / plans | `plans` | R3.1 `testcase-taxonomy.en.txt` (@base-tests) |

Registries SSOT trên product repo · `analyzeBullets` auto lane từ stack · chi tiết `/platform-mark`.

## MCP harness template

Repo **hubdocs** = tooling lane MCP (cùng DNA với `artifactgraph`). Khi phát triển MCP mới, **copy/adapt tay** từ `@artifactgraph`:

| Copy gần nguyên | Đổi theo từng MCP |
|-----------------|-------------------|
| `platform-ai/`, `platform-mark/` | Skill chính: `hubdocs/` (repo này) |
| `platform-ai.mdc`, `platform-code-size.mdc`, `team-flow-harness-state.mdc` | Rule opt-in: `hubdocs.mdc` |
| `extracts/core/`, `platform-mark*`, registry bundles tooling | hooks / bundle MCP riêng |

Giữ lane **tooling**: không nhét skill code (`api`, `prototype`, …) hay docs (`spec`, `testcase`, …). Map workspace: `platform-repos.json` · group `mcp`.

## Done

- [x] Chỉ 3 skill folders; rules = `platform-ai`, `hubdocs`, `platform-code-size`, `team-flow-harness-state`
- [x] `platform-repos.json` harness khớp lane groups
- [x] Không copy `.cursor/` từ portal vào hubdocs
