# W-AD-AUTH-001 — Admin login (screen)

Code-tier screen under **CMP-01**. IDs confirmed for pilot (not `proposed:`).

Bundle SSOT: [`auth.login.bundle.yaml`](./auth.login.bundle.yaml)

```yaml
ids:
  component: CMP-01
  screens: [W-AD-AUTH-001]
  apis:
    - id: API-AD-AUTH-001
      ownedBy: CMP-01
```

| Field | Value |
|-------|-------|
| Surface | `W` (Web) |
| Area | `AD` (Admin) |
| Feature | `AUTH` |
| Seq | `001` |

See API: [`API-AD-AUTH-001`](../API-AD-AUTH-001/). Journey: [`FLOW-login`](/architecture/06-runtime/journeys/FLOW-login).
