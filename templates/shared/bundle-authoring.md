# portal-feature-bundle/v1 — authoring rules (PHASE 1)

Hub: `docs/templates/feature.bundle.yaml` · split: `pnpm spec:split`

## Top-level

| Key | Purpose |
|-----|---------|
| `spec` | Design v1 — actors, requirements, `ui.routes`, `api`, `acceptance` |
| `gen` | Dev-grill / portal:gen — `codegen`, `tags`, `ui.filters/columns/...` |
| `legacy` | Legacy facts + evidence pointers |
| `design` | Portal UI intent — `zones[]`, `behavior`, `actions[]` |
| `review` | BA prose only — **không** split sang `ir/*` |

## spec (design v1) — có

- `actors`, `entities`, `relationships`, `requirements`
- `ui.routes`, `ui.toolbar` (intent, không gen columns)
- `api` query/response contract
- `acceptance`

## spec — không (thuộc `gen` hoặc `design`)

- `codegen`, `tags`
- `ui.filters`, `ui.columns`, `ui.composition`, `ui.testIds`
- Prose layout blob — dùng `design.zones[]` + `review.layoutNotes`

## design.zones (structured)

```yaml
zones:
  - id: search
    label: Khu vực tìm kiếm
  - id: toolbar
    label: Thanh thao tác
    position: { after: search }
    container: { bordered: false }
```

## design.behavior (CRUD table trong md render)

```yaml
behavior:
  create: { enabled: true, surface: page }
  delete: { enabled: true, mode: confirm_dialog }
```

## Agent output (/spec, legacy-spec)

YAML only per schema. No explanation. No markdown.

## ir/spec.yaml

`pnpm spec:split` merge `spec` + `gen` → `ir/spec.yaml` cho portal:gen. Dev-grill sửa `ir/spec.yaml` → `pnpm spec:merge` tách lại `gen`.
