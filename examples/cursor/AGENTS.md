# Antigravity Workspace Rules — Docskit Harness Compliance

> [!CRITICAL] MANDATORY AGENT BEHAVIOR
> When executing any command or skill (e.g. `/spec`, `/bqa-grill-docs`, `/dev-grill-docs`, `/api`, `/overview`, `/grill`, etc.):
>
> 1. **PRE-FLIGHT READ:** The first action MUST be a file-read tool (`view_file` / equivalent) on the target skill's `SKILL.md`. Never rely on memory from this or prior threads.
> 2. **HARNESS TODO (`.harness/tasks/`):** Before other durable product writes, create or update `.harness/tasks/<skill-or-target>-todo.md` by exploding **every** Workflow step and optional Accelerator branch into unchecked items. Mark `[x]` only after that step has physical evidence. Never batch-check. Accelerators = `if available / else fallback` items only.
> 3. **PLAN BEFORE AUTHORING:** Before writing or patching product YAML/Markdown, write `.harness/tasks/<skill-or-target>-plan.md` that quotes each Verification Checklist line and plans that line. Then execute step-by-step — no bundled skips.
> 4. **PHYSICAL DURABLE OUTPUT:** Durable results (bundles, plans, TODOs, proposals) MUST be written to disk immediately. Chat-only "done" is not done. Prior step files are inputs to later steps.
> 5. **DATA ORIGIN:** Business fields, flows, and validations may come only from (a) the user prompt or (b) ArtifactGraph registry evidence. Gaps → leave empty or tag `#missing_info` for grill. Do not invent business data. Structural pattern tags clearly implied by the prompt remain allowed; inventing new common/DSL is not.
> 6. **DSL / COMMON REGISTRY:** Humans own common/DSL. Agent may create or update common SSOT only when the user invoked `/common` or `/common-spec`, or after explicit user confirmation on a grill proposal. Normal `/spec` only consumes existing common — never invents or overwrites it.
> 7. **EXCLUSIVE SKILL ISOLATION:** Execute EXCLUSIVELY the target skill. Do NOT merge sibling skills (e.g. never merge `/bqa-grill-docs` into `/dev-grill-docs`).
> 8. **NO FAKE / HALLUCINATED REPORTS:** Do NOT output hallucinated Markdown reports when a skill requires editing YAML/bundle files.
> 9. **EVIDENCE-BASED VERIFICATION:** Map the skill Verification Checklist to `.harness/tasks/*-todo.md` with concrete evidence (paths, diffs, CLI output). Do not check boxes without the work.

## Path SSOT

```text
product/surfaces/<surface>/CMP-*/<slug>/
```

No `modules/` segment.

## Grill hard gate (`#missing_info` / proposals)

1. Re-check ArtifactGraph if available.
2. Micro-scope only the missing block/field.
3. Propose option(s); mark Recommended.
4. **STOP** — ask the member. Write product SSOT only after explicit confirmation. Keep unconfirmed proposals in `.harness/tasks/<skill-or-target>-proposal.md`.

## Full protocol

See `extracts/agent-execution-protocol.md` (installed under the active agent dir).
