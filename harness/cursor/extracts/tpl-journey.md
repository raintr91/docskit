# Journey template — FLOW-*

Output: `architecture/06-runtime/journeys/FLOW-{slug}.md` (or section under catalog).  
Skill: `/journey` · Bundle: `architecture-core`

## Sections

`# FLOW-* — title` · optional `domain:` · prose · `## Steps` · `## Diagram` (`sequenceDiagram`) · `## Gaps?` · `## Related`

## Criteria (tick ≥1)

- [ ] Cross ≥ 2 systems
- [ ] Hard / regress-prone
- [ ] Slow onboard
- [ ] Core domain

## Example

```markdown
# FLOW-login — Operator login

domain: admin

Operator login via Admin Web against Admin API.

## Steps

1. Op opens login `W-AD-AUTH-001` on `CTR-admin-web`
2. Web `POST` login `API-AD-AUTH-001` on `CTR-admin-api`
3. API returns session/token; web shows authenticated shell

## Diagram

\`\`\`mermaid
sequenceDiagram
  actor Op as Admin operator
  participant W as CTR-admin-web
  participant A as CTR-admin-api
  Op->>W: Open login (W-AD-AUTH-001)
  W->>A: POST login (API-AD-AUTH-001)
  A-->>W: session / token
  W-->>Op: Authenticated shell
\`\`\`

## Related

- CMP: CMP-01
- Alias: DYN-login (deprecated)
```

No schemas / UI DSL here.
