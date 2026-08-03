# Antigravity Workspace Rules — Docskit Harness Compliance

> [!CRITICAL] MANDATORY AGENT BEHAVIOR
> When executing any command or skill (e.g. `/spec`, `/bqa-grill-docs`, `/dev-grill-docs`, `/api`, `/overview`, etc.):
>
> 1. **EXCLUSIVE SKILL ISOLATION**: You MUST execute EXCLUSIVELY the target skill requested by the user. Strictly DO NOT auto-trigger, merge, or combine rules/triggers from sibling skills (e.g., NEVER merge `/bqa-grill-docs` into `/dev-grill-docs`).
> 2. **NO FAKE / HALLUCINATED REPORTS**: Do NOT output hallucinated Markdown reports (such as BQA 3-Pillars reports, FastAPI/Pydantic snippets, or unrequested i18n checks) when a skill explicitly requires editing YAML/bundle files.
> 3. **EVIDENCE-BASED VERIFICATION**: Before completing any task, you MUST verify your output against the "Verification Checklist" in the active skill's `SKILL.md` by providing CONCRETE EVIDENCE (modified file paths, actual line diffs, or CLI command outputs). Do NOT blindly check boxes without performing the actual work.
