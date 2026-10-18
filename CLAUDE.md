# @drillspro/app

Customer SPA for drills.pro (React 19, Vite, Chakra UI v3). Talks to `core-backend` (`../core-backend`, FastAPI) and
signs in through Zitadel; deployed by Flux from `../k8s` (`apps/frontend-user`). No router or state library: four
routes, one context.

## Commands

```bash
pnpm install          # pnpm via mise/corepack; node_modules from another pnpm major needs a reinstall
pnpm dev              # http://localhost:5173, needs .env.local (cp .env.example .env.local)
pnpm typecheck && pnpm build
pnpm tokens           # tokens/tokens.json -> src/theme/tokens.generated.ts (never edit the generated file)
pnpm typegen          # after adding a token or recipe
```

There are no tests. Verify UI in a browser: signed-out `/` must land on `/login`, and a stored OIDC session must render
the dashboard. Check size, spacing and focus from computed styles, not from the props.

## Layout

- `src/app/`: the product. `auth.tsx` (OIDC), `api.ts` (`/v1/*` with Bearer), `router.ts`, `AuthPages.tsx`, `Dashboard.tsx`, `main.tsx`.
- `src/theme/`, `src/tenant/`, `src/brand/`, `src/components/`, `src/provider.tsx`: the design system. `DrillsProvider` wraps the app.
- `src/demo/`: the component showcase embedded in the dashboard, plus the theme list (`tenants.ts`).

## Rules

- Use Chakra tokens and recipe variants (`bg="surface-raised"`, `<Button variant="solid">`), never raw hex or blurred shadows.
  Status always has a glyph and a word. Display type (Pixelify Sans) is for `display` and `h1` only.
- Auth is Zitadel hosted login, code + PKCE. Do not build password or signup forms; signup is `prompt=create`.
- `VITE_*` values are public and inlined at build time. Never put a secret in them.
- Cross-repo: a new env var, port or route needs the matching change in `../k8s` and the workflow's build args
  (skill `deploy-k8s`). Do not edit or push `../k8s` unless asked; a push there deploys to production.

## Commits

Conventional style (`feat(scope):`, `fix(scope):`), imperative, say why. No Claude co-author trailer. Stage files by name.
