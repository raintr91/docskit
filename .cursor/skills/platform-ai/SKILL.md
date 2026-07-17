---
name: platform-ai
extractBundle: platform-ai
description: /platform-ai — build and maintain the independent Hubdocs MCP package.
disable-model-invocation: true
---

# /platform-ai — build Hubdocs MCP

Use this skill to design, implement, test, package, and release **Hubdocs as an
independent MCP**. Do not implement product features, specs, or E2E plans here.

## Scope

| Own here | Do not own here |
|----------|-----------------|
| MCP server/tools, CLI, package API | Product application implementation |
| Hubdocs installers and managed harness | Docs/spec content belonging to a product hub |
| Hubdocs-owned architecture skills/assets | Cross-repository workspace topology |
| Standalone tests, packaging, release docs | Platform DNA or another MCP's harness |

There is no `platform-repos.json` in an MCP repository. Product maps are
created in destination docs/code hubs; Hubdocs may merge only its owned skill
IDs during destination `init`.

## Workflow

1. Freeze the tool/input/output and ownership contract in `mcp-package.json`.
2. Implement deterministic behavior in `src/`; keep agent-facing orchestration
   in the packaged `harness/`.
3. Make `init` safe: explicit target root, managed hashes, conflict protection,
   no sibling checkout assumptions.
4. Update tests and public docs together with behavior.
5. Run build, standalone tests, and package-content checks before release.

## Commands

```bash
pnpm test
pnpm pack --dry-run
```

## Done

- Package installs and runs without sibling repositories.
- Shipped files contain only Hubdocs-owned tools and harness assets.
- Destination edits are managed, conflict-safe, and uninstallable.
- Docs, package version, manifest compatibility, and tests agree.
