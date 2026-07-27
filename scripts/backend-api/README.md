# Backend API scripts — `scripts/backend-api/`

Tooling scripts cho **BE repo** có `docs/features/` + `docs/openapi/`.

Chạy từ **repo root** bằng các `package.json` scripts (inject tự động bởi `docskit harness --type=be`):

```bash
pnpm docs:render      # 01-backend-spec.yaml → generated/backend-spec.md
pnpm openapi:render   # merge 02-openapi.yaml → docs/openapi/api.yaml + redocly lint
pnpm openapi:lint     # alias cho openapi:render
pnpm openapi:bundle   # openapi:render + redocly bundle → docs/public/openapi/openapi.yaml
pnpm swagger:build    # copy Swagger UI assets → docs/public/swagger/
pnpm swagger:dev      # openapi:bundle + swagger:build + docs:dev
```

## Scripts

| Script | Entry point | Mô tả |
|--------|------------|--------|
| `render-backend-spec.mjs` | `pnpm docs:render` | `docs/features/**/01-backend-spec.yaml` + `features/common/*.yaml` → `generated/*.md` |
| `render-openapi.mjs` | `pnpm openapi:render` | `docs/openapi/base.yaml` + `docs/features/**/02-openapi.yaml` → `docs/openapi/api.yaml` + redocly lint |
| `build-swagger-ui.mjs` | `pnpm swagger:build` | Copy Swagger UI static assets → `docs/public/swagger/` |

## Sử dụng (repo consuming)

Sau khi `docskit harness --type=be`, các scripts sau được tự động thêm vào `package.json`:

```json
{
  "scripts": {
    "docs:render":    "node node_modules/@platform/docskit/scripts/backend-api/render-backend-spec.mjs",
    "openapi:render": "node node_modules/@platform/docskit/scripts/backend-api/render-openapi.mjs",
    "openapi:lint":   "pnpm openapi:render",
    "openapi:bundle": "pnpm openapi:render && redocly bundle docs/openapi/api.yaml -o docs/public/openapi/openapi.yaml",
    "swagger:build":  "node node_modules/@platform/docskit/scripts/backend-api/build-swagger-ui.mjs",
    "swagger:dev":    "pnpm openapi:bundle && pnpm swagger:build && pnpm docs:dev"
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
