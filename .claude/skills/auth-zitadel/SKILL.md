---
name: auth-zitadel
description: Use when touching login, signup, tokens, the OIDC client in src/app/auth.tsx, or when /v1/me returns 401 or empty profile.
---

# Zitadel auth contract

Flow: `signIn`/`signUp` (`src/app/auth.tsx`) redirect to `VITE_ZITADEL_ISSUER` (default `https://auth.drills.pro`), code + PKCE,
back to `/auth/callback`; the access token goes to core-api as `Authorization: Bearer`.

Zitadel app (same project as core-api, `zitadel.project_id` in `../core-backend/core-api/config/prod.yaml`): User Agent/SPA, PKCE,
auth token type **JWT**, redirect `<origin>/auth/callback`, post-logout `<origin>/login`, for `https://app.drills.pro` and
`http://localhost:5173`. Self-registration must be on for signup.

Why each piece exists:

- Scope `urn:zitadel:iam:org:project:id:<projectId>:aud` puts the project in `aud`; core-api (`core/auth.py`) rejects tokens without it.
- Opaque tokens fail core-api's JWT decode. 401 with "invalid token" means the app's token type or the audience scope.
- `/v1/me` fills email/name from Zitadel userinfo when the token lacks them; `tenants: []` is a valid new user (`POST /v1/tenants` needs a verified email).
- A 401 in `Profile` calls `expire()`, which sends the user to `/login`. No silent renew by design.

Debug: decode the stored token (`sessionStorage`, key `oidc.user:<issuer>:<client_id>`) and check `iss`, `aud`, `exp`.
