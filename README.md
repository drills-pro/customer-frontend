# @drillspro/app

The drills.pro customer app: login, signup, and workspaces (switcher, create, members and invitations, settings), on a Chakra UI v3 theme, with a component showcase at `/showcase`. Sign-in is Zitadel's hosted login; the API is `core-backend`; it deploys through `k8s` (`apps/frontend-user`).

## The app

A plain SPA: TanStack Router (code-based routes in each `src/modules/<name>/routes.tsx`, assembled in `src/router.tsx`), TanStack Query, and a typed client for `core-api` generated from its OpenAPI spec (`pnpm api:gen`). Routes: `/login`, `/signup`, `/auth/callback`; behind sign-in `/`, `/new`, `/invite/$token`, `/w/$slug` (overview, `members`, `settings`) and `/showcase`. See `CLAUDE.md` for the layout.

Auth is Zitadel's hosted login (OIDC code + PKCE via `oidc-client-ts`); signup is the same redirect with `prompt=create`. The access token goes to core-api as a Bearer header, which is what `core/auth.py` verifies (shared pool, ADR-021; the BFF cookie session is not built).

One-time Zitadel setup: in the project shared with core-api, add a **User Agent / SPA** application, auth method **PKCE**, **auth token type JWT** (core-api decodes it), redirect URIs `<origin>/auth/callback`, post-logout `<origin>/login` (`http://localhost:5173` and `https://app.drills.pro`). Put its client id in `VITE_ZITADEL_CLIENT_ID` (`.env.example`). core-api's CORS is `*`, so no proxy is needed.

```sh
cp .env.example .env.local   # set the client id
pnpm dev
pnpm api:gen    # refresh src/shared/api/schema.d.ts from <VITE_API_URL>/openapi.json (pnpm api:gen:local for a local core-api)
pnpm tokens    # tokens/tokens.json -> src/theme/tokens.generated.ts
pnpm typegen   # strict prop types for the custom tokens
```

Deploy: `Dockerfile` + `nginx.conf` serve `dist/` on :3000 with SPA fallback, matching the `frontend-user` Deployment in `k8s`. `VITE_*` are build args.

## What maps to what

| Design system                                                              | Chakra                                                                                                                                                                                             |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Template `background`, `primary`, `secondary`, `warning`, `font-color`     | `colors.background` and so on; also `colorPalette="primary"` / `"secondary"`                                                                                                                       |
| Roles `surface`, `ink`, `brand-text`, `control-border`, `selected-bg`, ... | Same names: `bg="surface-raised"`, `color="ink-muted"`, `borderColor="control-border"`                                                                                                             |
| Palettes                                                                   | `brand`, `lens`, `night`, `danger`, `warning`, `success`, `info`, plus Chakra's `orange`, `teal`, `red`, `gray` remapped so stock snippets stay on brand. `html` defaults to `colorPalette: brand` |
| Chakra slots                                                               | `bg`, `bg.subtle`, `bg.panel`, `fg`, `fg.muted`, `border`, `border.emphasized`, `fg.error`, ... point at the roles                                                                                 |
| `sprite-*`, `favicon-1x`                                                   | `sizes` tokens                                                                                                                                                                                     |
| `shadow-raised`, `-pressed`, `-pop`                                        | `shadow="raised"`, `"pressed"`, `"pop"`; Chakra's `xs` to `2xl` are remapped, so no blurred shadow exists                                                                                          |
| `radius-sm`, `-md`, `-lg`                                                  | Chakra `l1`, `l2`, `l3` (2, 4, 8px)                                                                                                                                                                |
| `pixel-step`, `pixel-timing`                                               | `durations.pixel`, `easings.pixel`                                                                                                                                                                 |
| Focus                                                                      | 3px `focus` ring, 2px offset on every focusable recipe                                                                                                                                             |

Recipe overrides (only the differences from Chakra's defaults): button, input, textarea, checkmark, radiomark, badge, link, code, checkbox, checkboxCard, radioGroup, radioCard, switch, tabs, segmentGroup, nativeSelect, select, combobox, menu, popover, dialog, drawer, tooltip, card, field, alert, toast, table, progress.

## Tenants

A tenant stores five colors per mode:

```json
{
  "tenant": "acme",
  "light": { "background": "#FFFFFF", "primary": "#2563EB", "secondary": "#0EA5E9", "warning": "#F59E0B", "font-color": "#111827" },
  "dark": { "background": "#0B1220", "primary": "#3B82F6", "secondary": "#22D3EE", "warning": "#FBBF24", "font-color": "#E5E7EB" }
}
```

`deriveTheme()` derives the other 30 colors and checks 36 contrast pairs per mode. `<DrillsProvider tenant>` writes the result as `--chakra-colors-*` on `<html>`; every palette and alias re-resolves from there, and Bit and the app icon take `primary` as their accent. A template that fails any check is rejected (falls back to drills.pro) unless `strict={false}`; `derived.suggest.primary` names the nearest passing primary. For server rendering, `tenantCss(template)` returns the same values as static CSS keyed on `[data-tenant]`.

Tenants cannot change `danger`, `focus`, `info` or the `class-*` label colors.

## Known limits

- Radio uses a round control, not the stepped pixel circle from the design system's Radio card; Chakra's radiomark draws its dot with a pseudo element that a clip-path would also cut.
- Tenant overrides apply to the whole document. A scoped preview of another tenant inside the page (for example a settings form) needs its own iframe.
- In the dark theme the ink `outline` around orange fills blends into the ground by design; the orange fill carries the shape there.
