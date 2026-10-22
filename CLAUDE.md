# @drillspro/app

Customer SPA for drills.pro (React 19, Vite, Chakra UI v3, TanStack Router with code-based routes, TanStack Query). Talks
straight to `core-backend` (`../core-backend`, FastAPI, CORS `*`, Bearer auth) at `VITE_API_URL` (default api.drills.pro) and
signs in through Zitadel; deployed by Flux from `../k8s` (`apps/frontend-user`). A plain SPA: no BFF, no TanStack Start.

## Commands

```bash
pnpm install          # pnpm via mise/corepack; node_modules from another pnpm major needs a reinstall
pnpm dev              # http://localhost:5173, needs .env.local (cp .env.example .env.local)
pnpm test:e2e          # Playwright specs in e2e/ (API mocked, own dev server on :5199); not part of check
pnpm check            # prettier check + oxlint + project rules + typecheck + build; the pre-commit hook runs this
pnpm lint:fix         # oxlint autofixes
pnpm format           # prettier --write (print width 140, single quotes)
pnpm api:gen          # src/shared/api/schema.d.ts from <VITE_API_URL>/openapi.json (default api.drills.pro; API_SPEC_URL overrides with a URL or file path); commit the result
pnpm api:gen:local    # the same against a local core-api (http://localhost:8090)
pnpm dev:local        # pnpm dev against the local stack: loads .env.stack.local (local Zitadel issuer, project id, client id, VITE_API_URL=http://localhost:8090); plain `pnpm dev` uses .env.local, default production
pnpm tokens           # tokens/tokens.json -> src/theme/tokens.generated.ts (never edit the generated file)
pnpm typegen          # after adding a token or recipe
pnpm lint:i18n        # en.json and th.json must have the same keys and {{placeholders}}; runs in pnpm check
```

Tests are Playwright end-to-end specs in `e2e/` (chromium only). Run `pnpm test:e2e`; the first time, `pnpm exec playwright install chromium`.
It starts its own dev server on port 5199 with `VITE_API_URL=http://api.e2e.test`, so no backend runs: `e2e/mock-api.ts` answers the API with
`page.route`, and `e2e/fixtures.ts` signs the test in by writing an OIDC user to sessionStorage in an init script. A spec takes `{ page, api }`; `api`
is a fresh in-memory state that the test may change before its first `goto`. `pnpm test:e2e` is not part of `pnpm check` (slower, needs a browser).

Tests never read UI text, because the app is bilingual and copy changes: select and assert with `data-testid` (`page.getByTestId(...)`), the URL, and
`data-*`/`aria-*` attributes. Test ids are kebab-case `<area>-<thing>` (`shell-nav-members`, `invite-link`, `settings-delete-confirm`); add one to the
component when a test needs it. `StateScreen` exposes `data-testid="state-screen"` and `data-pose` (idle, ship, oops) to tell screens apart.
`pnpm lint:project` fails on `getByText`, `getByLabel`, `getByPlaceholder`, `getByTitle`, `toHaveText`, `toContainText` and `getByRole` with a name in `e2e/`.

For anything the specs do not cover, verify UI in a browser. Check size, spacing and focus from computed styles, not from the props.

## Layout

Feature modules under `src/modules/`, shared plumbing under `src/shared/`. Import across folders with the `@/` alias (`@/shared/ui/Splash`); `../` imports
are banned (`pnpm lint:project`), `./x` stays for the same folder. Dependencies point one way: `shared` imports no module; `auth` imports shared only;
`workspaces` imports auth and shared; `members` imports workspaces, auth and shared. `src/router.tsx`, `src/root-route.tsx` and `src/main.tsx` may import
any module. Another module is imported only through its `index.ts` (`@/modules/workspaces`), never by deep path; inside its own module a file may use deep
`@/modules/<name>/...` paths.

- `src/modules/auth/`: `context.tsx` (`AuthProvider`, `useAuth`), `routes.tsx` (`/login`, `/signup`, `/auth/callback`), `pages/AuthPages.tsx`.
- `src/modules/workspaces/`: `api.ts` (`me` and workspace queries and mutations), `context.tsx` (`useWorkspace`, `useCan`), `routes.tsx` (the sign-in guarded
  `app` route, `/`, `/new`, `/w/$slug` with overview and settings), `pages/`, `components/` (`AppShell`, `WorkspaceSwitcher`, `UserMenu`).
- `src/modules/members/`: `api.ts` (members and invitations), `routes.tsx` (`/w/$slug/members`, `/invite/$token`), `pages/`, `components/`.
- Routes live in each module's `routes.tsx` (path, guards, loaders, `component: SomePage`) and are assembled into the tree in `src/router.tsx`; `src/root-route.tsx` is the root.
- `src/shared/api/`: `client.ts` (openapi-fetch typed by `schema.d.ts`, Bearer middleware, `ApiError`, `unwrap`), `query.ts` (QueryClient, global 401 handler),
  `errors.ts` (status to locale key). `src/shared/auth/manager.ts`: the OIDC `UserManager` (no React), so route guards and the API client can read the token.
  `src/shared/ui/`: `StateScreen` (one Bit plus text), `Splash`, `NotFound`, `ErrorScreen`.
- `src/config.ts`: the only place that reads env.
- `src/i18n.ts`, `src/locales/{en,th}.json`, `src/components/language-switcher.tsx`: react-i18next. `en` is bundled; other languages load lazily.
- `src/theme/`, `src/tenant/`, `src/brand/`, `src/components/`, `src/provider.tsx`: the design system. `DrillsProvider` wraps the app.
- `src/showcase/`: the component gallery at `/showcase` (lazy, `routes.tsx`), the theme list (`tenants.ts`) and `preview-theme.tsx` (the tenant preview switched in it).

Data rules: `/v1/me` is the workspace list and carries each workspace's `capabilities`; gate UI with `useCan('tenant.admin')`, not roles (the API still decides).
The URL carries the workspace slug (`/v1/me` returns it on every workspace); the API is still called by id (`workspace.id`). An old `/w/<uuid>` link redirects to the slug. Mutations that change a workspace invalidate `['me']`. Per-call `mutate(..., { onSuccess })` does
not run once the page unmounts, so use `mutateAsync` when a refetch can swap the page away. Invitations are links (no mail service yet): the token is shown once.

## Rules

- Use Chakra tokens and recipe variants (`bg="surface-raised"`, `<Button variant="solid">`), never raw hex or blurred shadows.
  Status always has a glyph and a word. Display type (Pixelify Sans) is for `display` and `h1` only.
- No native form controls or links: use Chakra (`SimpleSelect` for selects). `pnpm lint:project` (`scripts/check-project.sh`) enforces it, plus: no raw hex outside tokens, env only in `src/config.ts`, fetch only in `src/shared/api/client.ts`, no `!important` or inline `style`, no secrets in `VITE_*`. It runs in `pnpm check`; `lint-ok` on a line marks an exception.
- User-facing text in `src/modules/` and `src/shared/` goes through `t()` with a nested key in both `src/locales/en.json` and `th.json` (`src/showcase/` stays English). Language: saved `drills-lang`, then the browser; unsupported falls back to `en`. Add a language in `LANGS` and a JSON file.
- When asked for a specific look (a hover color, a bounce, a radius), first check whether the theme already covers it, and say if the request
  clashes with the overall theme. Put the change where every user of the pattern gets it: a token in `tokens/tokens.json`, a recipe variant or
  `src/theme/` entry (skill `theming`), then use it by name. A one-off style prop on a single component is the last resort, and the reply says why.
- Motion is two bounces (from epiceasing.com, kind bounce, bezier out), each with its own length, set in the theme: `bounce-relaxed` (250ms, deep rebounds:
  the default for every transition, small feedback) and `bounce-gentle` (550ms, shallow rebounds: large surfaces and entrances, because a big element with
  deep rebounds looks bad). Pair them: `animationTimingFunction="bounce-gentle"` with `animationDuration="bounce-gentle"`. No raw cubic-bezier, no
  per-component easing. Pick the shape by what the element does: no suffix to arrive or respond (default), `-in` to leave, `-in-out` to move between two
  visible places (`bounce-gentle-in`, `bounce-relaxed-in-out`). Step changes and tabs use in-out; every `Tabs.List` renders a `<Tabs.Indicator />`. Cards, alerts and toasts already enter by themselves; charts spread `chartMotion` (from `src/theme/motion.ts`) onto every recharts series.
- Bit appears at most once per screen, never in the shell, and never in a delete or security flow: `idle` for empty states, 404 and restore, `ship` for success,
  `oops` for failures, the `BitAnimated` morph only on `Splash`. Sizes 128, 192 or 256; alt text names the state ("Invitation failed"), not the character.
- Icons come from `lucide-react` (`import { Dices } from 'lucide-react'`), never emoji or another icon library; icon-only buttons need an `aria-label`.
- User-facing text never names internal systems or the tech stack (Zitadel, core-api, Postgres, endpoints, env vars) and never shows a raw server
  error: map status codes to translated messages. `pnpm lint:project` scans `src/locales` for it.
- Never write the em dash (U+2014) in code, comments, locale strings, docs or commit messages. Use a simple hyphen (-) instead.
- Chakra UI work: use the `chakra-ui-builder` and `chakra-ui-refactor` skills (installed in `.agents/skills`, pinned by `skills-lock.json`).
  Never remake a component Chakra already ships (Menu, Drawer, Dialog, Breadcrumb, Avatar, Clipboard, Tabs, Steps, Field, Table, Skeleton, EmptyState,
  ...): compose the Chakra parts, and read the skill's `references/component-decision-tree.md` when unsure which one fits. Before adding a file to
  `src/components/`, check that neither Chakra nor an existing file there already covers it.
- Auth is Zitadel hosted login, code + PKCE. Do not build password or signup forms; signup is `prompt=create`.
- `VITE_*` values are public and inlined at build time. Never put a secret in them.
- Cross-repo: a new env var, port or route needs the matching change in `../k8s` and the workflow's build args
  (skill `deploy-k8s`). Do not edit or push `../k8s` unless asked; a push there deploys to production.

## Commits

The `.githooks/pre-commit` hook (no Husky; `pnpm install` sets `core.hooksPath`) runs `pnpm check`. Fix failures; do not `--no-verify`.

Conventional style (`feat(scope):`, `fix(scope):`), imperative, say why. No Claude co-author trailer. Stage files by name.
