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
| Skills: `platform-ai`, `hubdocs` | Bulk copy `.cursor/` từ repo tooling khác |

**SSOT:** map = `platform-repos.json` · harness `.cursor/` = chỉnh **tại repo này**.

## Scripts

```bash
python3 scripts/sync-platform-repos-bases.py          # propagate map → sibling bases
node scripts/platform-workspace-from-repos.mjs --group=mcp   # local workspace (gitignored)
./scripts/cursor-export-kilo                        # optional Kilo mirror
```

## Commands

| Command | Khi nào |
|---------|---------|
| `/platform-ai` | this — MCP package + harness |
| `/hubdocs` | MCP tools, docs index, validate links |

Feature / spec / plans → workspace lane đúng (`--group=docs`, `code-fe`, …) — **một chat một lane**.

## Shared tooling conventions

`artifactgraph` là sibling MCP độc lập. Chỉ tham khảo các convention tooling dùng chung; Hubdocs tự sở hữu Cursor DNA, hooks, extracts và skill của mình. Không dùng ArtifactGraph làm copy source.

Giữ lane **tooling**: không nhét skill code (`api`, `prototype`, …) hay docs (`spec`, `testcase`, …). Map workspace: `platform-repos.json` · group `mcp`.

## Done

- [x] Chỉ 2 skill folders; rules = `platform-ai`, `hubdocs`, `platform-code-size`, `team-flow-harness-state`
- [x] `platform-repos.json` harness khớp lane groups
- [x] Không copy `.cursor/` từ portal vào hubdocs
