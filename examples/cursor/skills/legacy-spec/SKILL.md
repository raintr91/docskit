---
name: legacy-spec
extractBundle: legacy-spec
description: /legacy-spec — legacy-dynamics on base-docs + Code bundles.
disable-model-invocation: true
---

# /legacy-spec — Legacy dynamics IR (archaeology 1 lần / module)

**Extracts:** `extractBundle: legacy-spec`

**SSOT docs hub:** `product/legacy-dynamics/` · how-to `platform/toolchain/legacy-dynamics.md`
Template: `product/legacy-dynamics/_template/_legacy.dynamics.yaml`

## Load policy

| Load | Do not load |
|------|-------------|
| Legacy source (minimal); `bundlekit/legacy/project-config.md` progressive | Writing under FE `docs/` |
| Write `product/legacy-dynamics/{module}/_legacy.dynamics.yaml` + Code `*.bundle.yaml` | Full `platform-repos.json` dump |
| `legacy/evidence.md` — pointer only | Full repo scan |

## Workflow

1. Compact inventory: routes → controller → service → view.
2. Write/update **`product/legacy-dynamics/{module}/_legacy.dynamics.yaml`** (`portal-legacy-dynamics/v1`).
3. Per function: Code under `Surfaces/.../Modules/CMP-*/Functions/[Screen | API]` (`*.bundle.yaml`, `specOrigin: legacy`).
4. Parity + context-orphan per `legacy/parity.md`.
5. **Không** `gen` / codegen tags on archaeology turn.
6. Validate: `legacy_dynamics_validate` / `bundlekit legacy-validate -- <file>` (fallback `pnpm legacy-dynamics:validate`).
7. Handoff → `/bqa-grill-docs`.

## Accelerators (optional)

```text
if codegraph-<legacyKey> MCP available for the resolved checkout:
  symbol/call evidence for archaeology
else if checkout exists without .codegraph/:
  report: cd <root> && codegraph init
  then targeted Grep/Read (local fallback)
else: targeted Grep/Read (local fallback)

if ArtifactGraph available: parity/orphan slices (local-only; never a shared index)
else: model review from scoped legacy evidence (model fallback)

if Hubdocs available: map module → CMP/CTR docs (HUBDOCS_ROOT)
else: path conventions (deterministic fallback)
```

Never use the CodeGraph index of the currently open docs hub as a substitute
for another repository's index. Route per
`.cursor/rules/cross-repo-index.mdc` (Platform DNA SSOT).
Missing optionals never block `/legacy-spec`. After the existing fallback
completes, emit exactly one `bundlekit.missing-optional` event per `runId` +
optional against
`.cursor/schemas/bundlekit/missing-optional-event.schema.json`. Deduplicate
retries and report only actual `fileReads` / `contextBytes`.

**Gaps — missing legacy root:** if archaeology needs a checkout and
`legacy-repos.local.json` has no usable `root`, stop and handoff
`/configure-repo-maps` (member describes the legacy path in natural language).
Do not instruct copy/paste of JSON.

Hub: docs-hub `platform/toolchain/legacy-dynamics.md` (when present).
