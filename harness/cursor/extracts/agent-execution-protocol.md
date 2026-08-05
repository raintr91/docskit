# Agent execution protocol (Docskit)

Universal contract for skill runs. Host overlays (e.g. Antigravity `AGENTS.md`,
Cursor `agent-compliance.mdc`) restate the critical subset; this extract is the
full wording.

## Path SSOT

Function / module product paths (no `modules/` segment):

```text
product/surfaces/<surface>/CMP-*/<slug>/
product/surfaces/<surface>/CMP-*/          # module docs
```

## Pre-flight

1. First tool call for a skill run MUST read that skill's `SKILL.md` from disk.
2. Do not rely on memory of a prior thread.

## Harness task SSOT (`.harness/`)

| File | Role |
|------|------|
| `.harness/tasks/<skill-or-target>-todo.md` | Live TODO — explode **Workflow** + optional **Accelerators** branches |
| `.harness/tasks/<skill-or-target>-plan.md` | Plan before authoring durable YAML/MD |
| `.harness/tasks/<skill-or-target>-proposal.md` | Grill proposals awaiting member confirm |
| `.harness/progress.md` | Session handoff (when used) |
| `.harness/feature_list.json` | Scope list (when used) |

Rules:

- Create/update the TODO file before other durable product writes.
- One Workflow / Accelerator step → one unchecked item; mark `[x]` only with
  physical evidence (path, diff, CLI). Never batch-check.
- Accelerators are optional: TODO items must be `if available / else fallback`.

## Durable output

Durable work products (bundles, plans, TODOs, proposals) MUST be written to disk
immediately. Chat-only completion is not done. Prior step files are inputs to
later steps.

**Exception — grill hard gate:** do not overwrite product SSOT with a proposal
until the member explicitly confirms. Keep proposals under `.harness/tasks/`.

## Plan before authoring

Before writing or patching product YAML/Markdown, write the plan file quoting
each Verification Checklist line with a concrete execution plan for that line.

## Data origin (zero business hallucination)

Fill business fields / flows / validations only from:

1. The user prompt, or
2. ArtifactGraph registry evidence (when available).

Gaps → leave empty or tag `#missing_info` for grill. Do not invent business data.

Allowed without inventing business facts: structural pattern tags clearly implied
by the prompt (e.g. list + delete → `#pattern: CRUD`, `#pattern: delete-flow`)
and reuse of existing common/DSL already on disk.

## DSL / common registry (human-dictated)

Humans own common/DSL standards. Agent may create or update common/DSL SSOT only
when:

1. User invoked `/common` or `/common-spec`, or
2. User explicitly confirmed a grill proposal to promote/update common.

Normal `/spec` (and siblings) only **consume** existing common — never invent or
overwrite common SSOT unprompted.

## Grill resolution for `#missing_info`

1. Re-check ArtifactGraph if available (another member may have filled the gap).
2. Micro-scope: only the missing block/field.
3. Propose one or more options; mark Recommended.
4. Stop and ask the member. Write product SSOT only after explicit confirmation.
