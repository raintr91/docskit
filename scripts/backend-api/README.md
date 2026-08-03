# Backend API scripts — `scripts/backend-api/`

Tooling scripts cho **BE repo** có `docs/features/` + `docs/openapi/`.

Chạy từ **repo root** bằng các `package.json` scripts (inject tự động bởi `docskit harness --type=be`):

```bash
pnpm docs:render    # 01-backend-spec.yaml → generated/backend-spec.md
pnpm openapi:render # merge 02-openapi.yaml → docs/openapi/api.yaml + redocly lint
pnpm openapi:bundle # openapi:render + redocly bundle → docs/public/openapi/openapi.yaml
pnpm openapi:build  # copy API UI assets → docs/public/api-ui/
pnpm openapi:dev    # openapi:bundle + openapi:build + docs:dev
```

## Scripts

| Script | Entry point | Mô tả |
|--------|------------|--------|
| `render-backend-spec.mjs` | `pnpm docs:render` | `product/surfaces/**/01-backend-spec.yaml` → `generated/backend-spec.md` |
| `render-openapi.mjs` | `pnpm openapi:render` | `docs/openapi/base.yaml` + `product/surfaces/**/02-openapi.yaml` → `docs/openapi/api.yaml` + redocly lint |
| `build-openapi-ui.mjs` | `pnpm openapi:build` | Copy API UI static assets → `docs/public/api-ui/` |

## Sử dụng (repo consuming)

Sau khi `docskit init` hoặc `docskit harness`, các scripts sau được tự động thêm vào `package.json`:

```json
{
  "scripts": {
    "docs:render":    "docskit render",
    "openapi:render": "node node_modules/@platform/docskit/scripts/backend-api/render-openapi.mjs",
    "openapi:bundle": "pnpm openapi:render && redocly bundle docs/openapi/api.yaml -o docs/public/openapi/openapi.yaml",
    "openapi:build":  "node node_modules/@platform/docskit/scripts/backend-api/build-openapi-ui.mjs",
    "openapi:dev":    "pnpm openapi:bundle && pnpm openapi:build && pnpm docs:dev"
  }
}
```

## Dependencies cần có trong consuming repo

```json
{
  "devDependencies": {
    "@redocly/cli": "^2.34.0",
    "swagger-ui-dist": "^5.32.6",
    "yaml": "^2.9.0"
  }
}
```

## Input/Output structure

```
docs/
├── features/
│   ├── {group}/{slug}/
│   │   ├── 01-backend-spec.yaml      ← input (docs:render + openapi:render)
│   │   ├── 02-openapi.yaml           ← input (openapi:render)
│   │   ├── 03-mock-data.yaml
│   │   └── generated/
│   │       └── backend-spec.md       ← output (docs:render)
│   └── common/
│       └── *.yaml                    ← input (docs:render)
├── openapi/
│   ├── base.yaml                     ← input base for openapi:render
│   └── api.yaml                      ← output (openapi:render)
└── public/
    ├── openapi/
    │   └── openapi.yaml              ← output (openapi:bundle)
    └── swagger/
        └── index.html                ← output (swagger:build)
```
