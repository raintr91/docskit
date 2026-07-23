/*
 * Structurizr DSL — pilot skeleton (Phase B).
 * SSOT for prose/IDs remains MD under architecture/ + product/ (see MODEL.md).
 * IDs mirror docs hub: CTX-admin, CTR-admin-*, CMP-01.
 */
workspace "base-docs platform" "arc42 × C4 pilot model" {

    !identifiers hierarchical

    model {
        op = person "Admin operator" "Uses Admin web to manage platform/tenant data"

        admin = softwareSystem "CTX-admin" "Admin product boundary" {
            tags "CTX"

            web = container "CTR-admin-web" "Admin SPA / FE" "Nuxt/Next" {
                tags "CTR"
                authUi = component "CMP-01 Auth UI" "Login screen W-AD-AUTH-001" "Vue/React" {
                    tags "CMP"
                }
            }

            api = container "CTR-admin-api" "Admin HTTP API" "Nest/FastAPI" {
                tags "CTR"
                authApi = component "CMP-01 Auth API" "Login API-AD-AUTH-001" "HTTP" {
                    tags "CMP"
                }
            }
        }

        idp = softwareSystem "IdP / session" "External identity / session issuer" {
            tags "External"
        }

        op -> web "Uses"
        web -> api "HTTPS JSON"
        api -> idp "Authenticates"
        authUi -> authApi "POST login"
    }

    views {
        systemLandscape "LND-base" {
            include *
            autoLayout lr
        }

        systemContext admin "CTX-admin" {
            include *
            autoLayout lr
        }

        container admin "CTR-admin" {
            include *
            autoLayout tb
        }

        component web "CMP-01-web" {
            include *
            autoLayout lr
        }

        component api "CMP-01-api" {
            include *
            autoLayout lr
        }

        dynamic admin "FLOW-login" {
            op -> web "Open login W-AD-AUTH-001"
            web -> api "POST login API-AD-AUTH-001"
            api -> idp "Validate credentials"
            api -> web "session / token"
            web -> op "Authenticated shell"
            autoLayout
        }

        themes default
    }

}
