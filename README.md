# @drillspro/app

The drills.pro customer app: login, signup and a dashboard (your profile from `GET /v1/me`, three themes, a component showcase), on a Chakra UI v3 theme. Sign-in is Zitadel's hosted login; the API is `core-backend`; it deploys through `k8s` (`apps/frontend-user`).

## The app (`src/app`)

Routes: `/login`, `/signup`, `/auth/callback` and a dashboard (profile from `GET /v1/me`, theme switcher, component showcase).

Auth is Zitadel's hosted login (OIDC code + PKCE via `oidc-client-ts`); signup is the same redirect with `prompt=create`. The access token goes to core-api as a Bearer header, which is what `core/auth.py` verifies (shared pool, ADR-021; the BFF cookie session is not built).

One-time Zitadel setup: in the project shared with core-api, add a **User Agent / SPA** application, auth method **PKCE**, **auth token type JWT** (core-api decodes it), redirect URIs `<origin>/auth/callback`, post-logout `<origin>/login` (`http://localhost:5173` and `https://app.drills.pro`). Put its client id in `VITE_ZITADEL_CLIENT_ID` (`.env.example`). core-api's CORS is `*`, so no proxy is needed.

```sh
cp .env.example .env.local   # set the client id
pnpm dev
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

---

## DRILLS

A responsive, interactive ML workspace built with React, TanStack Start, and Tailwind CSS. The UI follows the supplied DRILLS HTML design.

Every page gets its data from an API. **Organizations, invitations, projects, the catalog, search and the dashboard come from the real backend**, `core-api`. Everything else (datasets, training, models, deployments, account, billing) calls the API this frontend wants, and an **in-app mock** answers it until core-api serves it. The full list of endpoints is in [docs/api-contract.md](docs/api-contract.md).

### Run locally

```bash
pnpm install
pnpm dev
```

Open the URL printed by Vite (normally `http://localhost:3000`). The app needs `core-api` and a tenant id (below); without them it shows "Could not load your workspace". To run with no backend at all, set `VITE_API_MOCK=all`.

#### Connecting to core-api

```bash
cp .env.example .env   # then set VITE_DEV_TENANT_ID
```

| Variable                 | Purpose                                                                                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_MOCK`          | How much the in-app mock answers. Unset: what core-api doesn't serve yet. `all`: everything, with no backend. `false`: nothing, so every page needs core-api to serve [the contract](docs/api-contract.md). |
| `VITE_API_MOCK_DELAY_MS` | How long a mocked answer takes, so loading states are visible. Defaults to `200`.                                                                                                                           |
| `VITE_API_URL`           | core-api base URL. Defaults to `http://localhost:8090`, where the monorepo's compose stack publishes it.                                                                                                    |
| `VITE_DEV_TENANT_ID`     | Your home organization: a tenant UUID from core-api's `tenants` table, which you own. Required unless `VITE_API_MOCK=all`.                                                                                  |
| `VITE_DEV_USER_ID`       | Recorded as the actor on what you create. Defaults to `dev-user`.                                                                                                                                           |
| `VITE_DEV_USER_EMAIL`    | Your address. Invitations sent to it are yours to accept. Optional.                                                                                                                                         |
| `VITE_DEV_USER_NAME`     | The name in the greeting. Defaults to `Alex`.                                                                                                                                                               |

**Auth is mocked.** There is no login page yet: requests carry core-api's dev headers (`X-Tenant-Id`, `X-User-Id`, `X-User-Email`), which it only honours under `AUTH_MODE=dev` (the compose default). A backend in the default `zitadel` mode answers 401. They also carry `X-Organization-Id`, the organization in the switcher. `src/api/session.ts` is the one file real auth replaces.

The dashboard page makes one request, `GET /v1/dashboard`, and refreshes it every 15 seconds while a training is in flight. Values core-api does not record yet are static placeholders, all in `src/features/dashboard/placeholders.ts`: metric trends and sparklines, deployment p95 and error rate, and training progress, current epoch and ETA. Cards on the dashboard do not link into project pages, because those pages show the mock's workspace, whose ids differ.

Upload Dataset creates a real dataset in the project you pick: a ZIP of `<label>/<file>` folders for an image-classification project, or a CSV for a tabular one.

### The mock API

`src/api/client.ts` offers every request to `src/api/mock/` first. A path with a handler is answered there as a real `Response`, so parsing and error handling run exactly as they do against core-api (a missing record is a 404 with `{ detail }`). A path without a handler goes to the network. The endpoint functions in `src/features/<area>/api/endpoints.ts` do not know which of the two will answer.

- **Wire format.** The mock answers in core-api's style: snake_case, ISO timestamps, raw numbers. Each feature's `mappers.ts` turns that into the types the components render.
- **State.** The mock's database is its seed plus what you created or changed, saved in `localStorage` under `drills-mock-api-v1`. Seeds are never stored, so a seeded run is still mid-flight on every fresh load. A stored record that fails validation is dropped on its own. If storage is blocked or full the mock keeps working in memory.
- **Reset.** Remove `drills-mock-api-v1` from `localStorage` to get the seed workspace back.
- **Retiring a mock.** When core-api serves an endpoint with the shape in `api/types.ts`, register its handler with `retiredRoute(...)` instead of `route(...)` in `src/api/mock/handlers/`. The app then sends it to core-api; the mock still answers it under `VITE_API_MOCK=all` (the e2e suite) and keeps recording its contract fixture. `{ live: true }` on an endpoint function forces the network in every mode, where the mock answers the same path for another call; the dashboard's dataset upload uses it.
- **Live parents, mocked children.** Organizations and projects from core-api are copied into the mock's store as they arrive (`src/api/mock/mirror.ts`), so the still-mocked datasets, runs, models, deployments and billing work under them. What you create there lives only in the mock, so core-api's counts on the project leave it out.

### What you can do

1. **Create a project** at `/projects/new`: basics, task type, and start method (upload, template, or clone). A template seeds the project with a sample dataset.
2. **Add a dataset** from a project's Datasets tab, from local files or a bucket path. Only file names and sizes are sent; the mock does not read the files.
3. **Explore a dataset**: preview, statistics, quality findings and versions.
4. **Train**: Dataset, Model, Configure, Compute, Review. A new run finishes in about 30 seconds; its progress, epoch and ETA come from the API and refresh every second. You can filter its logs, stop it, or clone it.
5. **Manage models and deployments**: promote or archive a model version, deploy a model, pause, resume, redeploy, rescale or delete a deployment, rotate its key.
6. **Manage organizations, projects and your account**: create, edit, leave, delete or transfer an organization; invite and manage members; archive, transfer or delete a project; edit your profile, sessions, notification settings and API keys.

Changes persist across reloads. The organization selector changes the workspace. Resource URLs include project and resource ids; direct links restore the correct project and organization.

#### Not implemented

These show a "not available" message because they need a system the mock cannot stand in for: photo upload, two-factor setup, plan and payment changes, invoice and dataset and model downloads, log export, and signing out. A few navigation shortcuts are also stubs: All Screens, Help, and the pipeline stages on the project overview. Charts, costs, resource usage, logs and quality findings are illustrative, not computed from real workloads.

### Browser storage

Two keys, both per browser:

- `drills-dashboard-v1` holds your interface choices: current organization, theme, and whether the onboarding card is dismissed. Each field is validated on load and falls back to its default on its own.
- `drills-mock-api-v1` holds the mock API's database, described above.

If browser storage is blocked or full, the app stays usable for the current session and shows one non-blocking notice. Nothing persists in that case.

Authentication and billing are out of scope. `pnpm lint` fails on any `dark:` variant.

### Validation

```bash
pnpm typecheck
pnpm lint          # eslint plus the cascade guard (focus styles, !important, dark:)
pnpm check         # prettier
pnpm build
pnpm exec playwright install chromium  # once, if needed
pnpm test
```

Playwright starts an isolated development server on port 3100, with mock auth, `VITE_API_MOCK=all` and an API origin nothing listens on, so no backend is needed. The dashboard's core-api calls are answered with `page.route` (`tests/fixtures/api.ts`); everything else is answered by the in-app mock, with no delay. `tests/mock-api.spec.ts` exercises the mock server itself in Node, and `tests/fixtures/mock-db.ts` seeds or reads its stored state. To test an existing server, set `DRILLS_BASE_URL` to its URL and start it with the same variables as `playwright.config.ts`. Tests cover the full workflow, persistence, unavailable storage, organization isolation, filtering, metadata uploads, cloning, missing records, and keyboard/mobile navigation. Failure traces and screenshots are written to `test-results/`.

### Structure

```text
src/
├── api/
│   ├── client.ts          how a request is made (base URL, headers, errors, mock hook)
│   ├── session.ts         who is calling (mock auth)
│   └── mock/              the in-app mock API
│       ├── index.ts       turns a request into a Response, or declines it
│       ├── router.ts      the route table
│       ├── db.ts          collections: seed plus a persisted delta
│       ├── store.ts       every collection, with its validation schema
│       ├── seed/          seed data, in wire format
│       └── handlers/      one file of routes per area
├── components/
│   ├── breadcrumbs/       route-aware breadcrumb system
│   ├── shared/            cross-route pieces, incl. loading and error states
│   └── ui/                shadcn/Radix primitives and variants
├── features/<area>/       account, catalog, datasets, deployments, models,
│   │                      organizations, projects, training
│   ├── api/               endpoints.ts (the calls) and types.ts (wire shapes)
│   ├── mappers.ts         wire shapes to the types the components render
│   └── queries.ts         React Query hooks: what components call
├── features/dashboard/
│   ├── domain/types.ts    the types the components render
│   ├── persistence/       stored interface preferences
│   ├── api/, queries.ts   the dashboard page's core-api call
│   ├── format.ts          dashboard rows to card text
│   ├── placeholders.ts    static values core-api does not record yet
│   ├── context.ts         app and project React contexts
│   └── navigation.ts      shared project section list
├── hooks/                 viewport and intersection hooks
├── lib/                   formatting and validation helpers
├── routes/                TanStack file routes with route-local -components/
├── router.tsx             router construction
├── routeTree.gen.ts       generated; regenerate with `pnpm generate-routes`
└── styles.css             layered design-system styles
```

`src/features/dashboard/data.ts` re-exports the UI types on the import path most of the app uses.
