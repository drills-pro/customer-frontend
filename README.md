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

A responsive, interactive mock ML workspace built with React, TanStack Start, and Tailwind CSS. The UI follows the supplied DRILLS HTML design. There is no backend: every entity is either seeded fixture data or something you created, saved in `localStorage`.

### Run locally

```bash
pnpm install
pnpm dev
```

Open the URL printed by Vite (normally `http://localhost:3000`). No backend, credentials, or environment variables are required.

### What you can actually do

1. **Create a project** — `/projects/new`. Three steps: basics, task type, and start method (upload, template, or clone). Choosing a template seeds the project with a sample dataset.
2. **Add a dataset** — from a project's Datasets tab, using local files, a simulated S3 bucket path, or sample data. Processing takes about four seconds.
3. **Explore a dataset** — preview, statistics, quality findings, and versions, with per-class filtering and downloadable JSON manifests and reports.
4. **Create a training run** — Dataset → Model → Configure → Compute → Review. A new run finishes in about 30 seconds.
5. **Watch a run** — progress, step, epoch, and ETA are derived from the run's start time, so they keep advancing and survive a refresh. You can filter its logs, stop it, or clone its configuration into a new run.

The organization selector changes the workspace. Resource URLs include project and resource IDs; direct links restore the correct project and organization.

#### Not implemented

These appear in the navigation but show a "not available in this dashboard demo" toast: All Screens, Models, Deployments, Settings, per-project actions beyond open/clone, model prediction, endpoint scaling, and resetting demo data. Charts, costs, resource usage, logs, and quality findings are illustrative, not computed from real workloads.

### Mock data and persistence

State is validated and saved to `localStorage` under `drills-dashboard-v1`. Each browser has its own workspace.

- Seed data is immutable. Only entities you create — projects, datasets, training runs, activity — are persisted, alongside explicit overrides such as stopping a seeded run.
- Stored data is migrated and then validated against `zod` schemas (`src/features/dashboard/persistence/`). A record that fails validation is dropped on its own; the rest of the workspace survives. Unparseable storage falls back to the seed workspace.
- If browser storage is blocked or full, the app stays usable for the current session and shows one non-blocking notice. Nothing persists in that case.
- Uploaded file contents are not retained — only names and metadata. Downloads provide sample manifests, configurations, and reports, not trained model binaries.

Authentication, organization management, billing, personal settings, and dark mode are out of scope. The app ships a light theme only; `pnpm lint` fails on any `dark:` variant.

### Validation

```bash
pnpm typecheck
pnpm lint          # eslint plus the cascade guard (focus styles, !important, dark:)
pnpm check         # prettier
pnpm build
pnpm exec playwright install chromium  # once, if needed
pnpm test
```

Playwright starts an isolated development server on port 3100. To test an existing server, set `DRILLS_BASE_URL` to its URL. Tests cover the full workflow, persistence and migration, unavailable storage, organization isolation, filtering, metadata uploads, cloning, missing records, and keyboard/mobile navigation. Failure traces and screenshots are written to `test-results/`.

### Structure

```text
src/
├── components/
│   ├── breadcrumbs/       route-aware breadcrumb system
│   ├── dashboard/         cross-route project presentation helpers
│   └── ui/                shadcn/Radix primitives and variants
├── features/dashboard/
│   ├── domain/            entity types and project factories
│   ├── data/              immutable seed fixtures
│   ├── persistence/       zod schemas, migrations, and safe storage access
│   ├── selectors/         derived views over seed plus persisted state
│   ├── context.ts         app and project React contexts
│   ├── navigation.ts      shared project section list
│   ├── templates.ts       project templates
│   ├── training.ts        model catalogs and training calculations
│   └── index.ts           the feature's public surface — import from here
├── hooks/                 viewport, intersection, and clock hooks
├── routes/                TanStack file routes with route-local -components/
├── router.tsx             router construction
├── routeTree.gen.ts       generated; regenerate with `pnpm generate-routes`
└── styles.css             layered design-system styles
```

`src/features/dashboard/data.ts` remains as a compatibility re-export of the modules above.
