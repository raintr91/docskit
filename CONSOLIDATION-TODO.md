# Hubdocs MCP — standalone consolidation TODO

Status: package implementation complete — consumer cleanup handoffs prepared  
Owner: Hubdocs package first · consuming docs hubs thin afterward

## Goal

Hubdocs must work with any conforming arc42 × C4 documentation repository.
It must not depend on `base-docs`, the `base-*` cluster, a sibling repository,
or a package-global target marker.

Hubdocs still needs an explicit docs root to index. That is runtime input, not
a dependency on one predetermined target repository.

## Principles

1. **Target-agnostic package.** No fallback or default to `base-docs`.
2. **Project-local wiring by default.** Each docs hub owns its MCP root config.
3. **Explicit root resolution.** Tool argument / project config / valid cwd;
   otherwise fail with a setup message.
4. **No cluster topology in the published package.**
5. **One package-side Cursor DNA SSOT.** Consumer hubs keep only thin adapters.
6. **Hub data stays in the hub.** Markdown and `docs-index.json` never move here.
7. **Optional callers remain optional.** Architecture skills must work without
   Hubdocs connected.
8. **Guide links may point to a hub; runtime code/config may not.**

---

## Current coupling to remove

- `src/config/docs-root.ts` falls back to sibling `../base-docs`.
- Non-interactive `hubdocs init --yes` defaults to global wiring with one fixed
  `HUBDOCS_ROOT`.
- Package-global `docs-root.path` can pin one target for every workspace.
- Published `platform-repos.json` contains base-cluster topology.
- Cursor DNA exists in package `.cursor/`, `examples/cursor/`, and a divergent
  consumer skill in `base-docs`.
- Package wording still says “for base-docs” in some CLI/install text.

Expected and safe:

- A project-local `HUBDOCS_ROOT` pointing at the current docs hub.
- Tool-level `docsRoot`.
- Default arc42/C4 scan conventions for conforming hubs.
- Hub-specific usage links in documentation.

---

## Epic A — Decouple root resolution

### A1. Inventory all target selection paths

- [x] Audit `src/config/docs-root.ts`, CLI, MCP tools, installers, and tests.
- [x] Inventory `HUBDOCS_ROOT`, `docsRoot`, `docs-root.path`, cwd, and sibling
      fallback precedence.
- [x] Locate every `base-docs` / base-cluster literal in runtime and install code.

### A2. Remove implicit target-repo fallback

- [x] Delete the `../base-docs` sibling heuristic from source.
- [x] Do not replace it with workspace scanning or another named repository.
- [x] Remove generated `dist/` behavior through the normal package build.

### A3. Define deterministic resolution

- [x] Resolution order:
      **tool `docsRoot` → project-local MCP `HUBDOCS_ROOT` → valid cwd → error**.
- [x] Validate that the selected root contains the required hub structure.
- [x] Return a clear setup error with `hubdocs init --location=local`.
- [x] Do not silently use a package-global target.

### A4. Fix global mode

- [x] Make local wiring the default for interactive and `--yes` where supported.
- [x] Global mode must be explicit.
- [x] Global semantics: rootless by default (tool argument required);
      `--docs-root` explicitly creates a named fixed-root global entry.
- [x] Stop treating `~/.hubdocs/docs-root.path` as project authority.

### A5. Verify multiple independent hubs

- [x] Open two docs repositories with local MCP configs simultaneously.
- [x] Each process indexes only its configured root.
- [x] Installing/wiring repo B does not overwrite repo A's target.
- [x] A fresh external fixture hub works without any `base-*` repository.

---

## Epic B — Remove base-cluster package content

### B1. Stop publishing cluster workspace maps

- [x] Remove `platform-repos.json` from `package.json.files`.
- [x] Keep package-development topology outside distributable files.
- [x] Ship only neutral packaged examples with no base names.

### B2. Remove machine-specific assumptions

- [x] Audit install scripts/docs for `~/workspace/base-docs`,
      `/home/...`, and fixed package paths.
- [x] Generate local MCP entries from the current machine/project.
- [x] Document generated absolute configs as local state, not reusable package DNA.

### B3. Correct package wording

- [x] Replace “Local MCP for base-docs” with “Local MCP for arc42 × C4 docs hubs”.
- [x] Make installer claims match actual root detection.
- [x] Keep hub-specific examples clearly labeled as examples.

---

## Epic C — Consolidate Cursor DNA

### C1. Choose one package SSOT

- [x] Canonicalize Hubdocs skill, rule, and phase hooks under `harness/cursor/`.
- [x] Generate/sync `examples/cursor/` and package `.cursor/` mirrors from the
      canonical files.
- [x] Add CI drift detection.

### C2. Reconcile current copies

- [x] Compare:
      `.cursor/skills/hubdocs/SKILL.md`,
      `examples/cursor/SKILL.md`,
      and `base-docs/.cursor/skills/hubdocs/SKILL.md`.
- [x] Keep generic setup/tool protocol in this package.
- [x] Keep base-docs handbook links and related architecture skills out of the
      packaged harness; consumer thinning is tracked by the handoff TODO.
- [x] Keep rule/hooks generic; do not import unrelated ArtifactGraph or
      platform-mark DNA.

### C3. Install harness explicitly

- [x] Add idempotent `hubdocs harness install`.
- [x] Do not overwrite customized files unless `--force` is explicit.
- [x] Install only Hubdocs DNA; do not install all architecture skills.
- [x] Treat `.agents` as a generated mirror later; do not edit it in this pass.

### C4. Thin consuming hubs after package is ready

- [ ] Replace full consumer `/hubdocs` skill copies with short local adapters.
- [ ] Preserve optional `hubdocs_*` guidance in architecture skills.
- [ ] Keep local handbook links and routing labels in each docs hub.

Repository TODO: `../base-docs/HUBDOCS-CLEANUP-TODO.md`.

---

## Epic D — Configuration boundary

### D1. Keep hub content outside the package

- [x] Continue deriving IDs and links from target Markdown.
- [x] Do not require `registries/docs-index.json`.
- [x] Do not copy target Markdown, registries, or indexes into this repository.

### D2. Optional schema configuration (only if required)

- [x] Keep current arc42/C4 paths and ID homes as package defaults.
- [x] Do not add `hubdocs.json`: no real different-layout requirement exists yet.
- [x] Record potential future overrides: scan roots, canonical ID homes, ignored
      paths, and route labels/skills.
- [x] Do not genericize the scanner prematurely.

---

## Epic E — Documentation and verification

### E1. Update package docs

- [x] `README.md`, `docs/INIT.md`, and install docs use local wiring by default.
- [x] Explain explicit root precedence and global-mode limitations.
- [x] State through package boundaries that examples may be local while runtime
      never selects a named target repository.

### E2. Update base-docs guide after package migration

- [ ] Keep `base-docs/platform/toolchain/HUBDOCS.md` as a usage guide/pointer.
- [ ] Remove claims that imply base-docs is Hubdocs' package default.
- [ ] Do not remove its local project root configuration.

### E3. Test matrix

- [x] Unit tests for root precedence and missing-root errors.
- [x] Install tests for local vs global wiring.
- [x] External fixture hub with no `base-*` siblings.
- [x] Two concurrent local hubs.
- [x] Link, ID, dependency, route, journey, layout, and catalog tools pass.
- [x] Package tarball excludes cluster `platform-repos.json`.

---

## Epic F — Consumer cleanup handoff

Run this only after the standalone package, harness installer, and verification
matrix are complete. Repository-local TODO files may be created from this lane;
execute each cleanup later in its own repository/workspace.

### F1. Create `base-docs` cleanup TODO

- [x] Create `../base-docs/HUBDOCS-CLEANUP-TODO.md`.
- [x] Include removal-only safety boundaries and owner-only reinstall/check steps.
- [ ] Remove old Hubdocs entries from generated MCP configs:
      `.cursor/mcp.json`, `.claude.json`, `.gemini/settings.json`,
      `.kiro/settings/mcp.json`, `.kilocode/mcp.json`, and `opencode.jsonc`.
- [ ] Remove stale Hubdocs permissions and generated absolute paths while
      preserving every unrelated MCP entry and setting.
- [ ] Replace the full `.cursor/skills/hubdocs/SKILL.md` copy with a thin local
      adapter: local SSOT, handbook link, architecture relationships, and
      optional-use guidance only.
- [ ] Remove sibling-package assumptions such as `../hubdocs` from `AGENTS.md`,
      architecture skill text, glossary wording, and the Hubdocs handbook.
- [ ] Keep optional `hubdocs_*` guidance in architecture skills and keep
      `platform/toolchain/HUBDOCS.md` as the consumer usage guide.
- [ ] Do not hand-edit `.agents`; create a separate regeneration TODO.

### F2. Create `artifactgraph` cleanup TODO

- [x] Create `../artifactgraph/HUBDOCS-CLEANUP-TODO.md`.
- [x] Include removal-only MCP cleanup if a repository-local Hubdocs entry exists.
- [ ] Update `.cursor/skills/platform-ai/SKILL.md` so ArtifactGraph does not
      claim ownership of or act as the copy source for Hubdocs Cursor DNA.
- [ ] Keep shared tooling conventions as references only; do not copy
      ArtifactGraph/platform-mark hooks or extracts into Hubdocs.

### F3. Create platform-map drift TODO

- [x] Include platform-map drift cleanup in
      `../artifactgraph/HUBDOCS-CLEANUP-TODO.md`.
- [x] Audit `platform-repos.example.json` files that omit Hubdocs while claiming
      to represent the full platform cluster.
- [x] Keep Hubdocs in live `platform-repos.json` maps and the `mcp` group as
      optional development tooling; this topology is not a runtime dependency.
- [ ] Either include Hubdocs in full-cluster examples or label examples as
      intentionally product-only.
- [ ] Align `base-docs/platform/toolchain/PROJECT-MAPS.md` with the chosen map
      policy.
- [ ] Execute map-governance cleanup as a separate change from standalone
      runtime consolidation.

### F4. Confirm repositories requiring no cleanup

- [x] Record that `base-tests`, portal, and code repositories need no Hubdocs
      runtime cleanup unless a fresh audit finds MCP config, `HUBDOCS_ROOT`,
      `docs-root.path`, package dependency, or copied Hubdocs harness content.
- [x] Do not remove Hubdocs from their live workspace maps solely because the
      package is standalone.

---

## Out of scope

- Merging ArtifactGraph into Hubdocs.
- Moving docs-hub Markdown or `docs-index.json` into this package.
- Scanning an entire workspace to auto-find target repositories.
- Making Hubdocs mandatory for architecture skills.
- Replacing the existing arc42/C4 convention with arbitrary schemas.
- Syncing `.agents` in this pass.
- Modifying unrelated existing changes in `platform-repos.json`.

---

## Execution order

```text
A1 → A2 → A3 → A4 → A5
       └────────→ B1 → B2 → B3
                  └──────→ C1 → C2 → C3 → C4
                                      └──────→ D1 → D2
                                               └────→ E1 → E2 → E3
                                                               └────→ F1 → F2 → F3 → F4
```

Complete root decoupling and standalone tests before thinning consumer skills.
Epic F creates handoff TODOs; consumer changes run in their own repositories.

---

## Definition of done

- [x] No runtime/install fallback to `base-docs` or any named target repo.
- [x] Local wiring allows multiple independent hubs without collisions.
- [x] Published package contains no base-cluster workspace topology.
- [x] Hubdocs skill/rule/hooks have one package-side SSOT.
- [ ] Consumer hubs contain only local adapters and optional tool guidance.
- [x] Hub Markdown and indexes remain owned by each target project.
- [x] A fresh external docs hub works without any `base-*` repositories present.
- [x] Root-level cleanup TODOs exist in `base-docs` and `artifactgraph`, including
      removal-only MCP steps and owner-only reinstall/check boundaries.
