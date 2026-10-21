# @drillspro/app

Customer SPA for drills.pro (React 19, Vite, Chakra UI v3). Talks to `core-backend` (`../core-backend`, FastAPI) and
signs in through Zitadel; deployed by Flux from `../k8s` (`apps/frontend-user`). No router or state library: four
routes, one context.

## Commands

```bash
pnpm install          # pnpm via mise/corepack; node_modules from another pnpm major needs a reinstall
pnpm dev              # http://localhost:5173, needs .env.local (cp .env.example .env.local)
pnpm check            # prettier check + oxlint + project rules + typecheck + build; the pre-commit hook runs this
pnpm lint:fix         # oxlint autofixes
pnpm format           # prettier --write (print width 140, single quotes)
pnpm tokens           # tokens/tokens.json -> src/theme/tokens.generated.ts (never edit the generated file)
pnpm typegen          # after adding a token or recipe
pnpm lint:i18n        # en.json and th.json must have the same keys and {{placeholders}}; runs in pnpm check
```

There are no tests. Verify UI in a browser: signed-out `/` must land on `/login`, and a stored OIDC session must render
the dashboard. Check size, spacing and focus from computed styles, not from the props.

## Layout

- `src/app/`: the product. `auth.tsx` (OIDC), `api.ts` (`/v1/*` with Bearer), `router.ts`, `AuthPages.tsx`, `Dashboard.tsx`, `main.tsx`.
- `src/i18n.ts`, `src/locales/{en,th}.json`, `src/components/language-switcher.tsx`: react-i18next. `en` is bundled; other languages load lazily.
- `src/theme/`, `src/tenant/`, `src/brand/`, `src/components/`, `src/provider.tsx`: the design system. `DrillsProvider` wraps the app.
- `src/demo/`: the component showcase embedded in the dashboard, plus the theme list (`tenants.ts`).

## Rules

- Use Chakra tokens and recipe variants (`bg="surface-raised"`, `<Button variant="solid">`), never raw hex or blurred shadows.
  Status always has a glyph and a word. Display type (Pixelify Sans) is for `display` and `h1` only.
- No native form controls or links: use Chakra (`SimpleSelect` for selects). `pnpm lint:project` (`scripts/check-project.sh`) enforces it, plus: no raw hex outside tokens, env only in `config.ts`, fetch only in `api.ts`, no `!important` or inline `style`, no secrets in `VITE_*`. It runs in `pnpm check`; `lint-ok` on a line marks an exception.
- User-facing text in `src/app/` goes through `t()` with a nested key in both `src/locales/en.json` and `th.json` (`src/demo/` stays English). Language: saved `drills-lang`, then the browser; unsupported falls back to `en`. Add a language in `LANGS` and a JSON file.
- When asked for a specific look (a hover color, a bounce, a radius), first check whether the theme already covers it, and say if the request
  clashes with the overall theme. Put the change where every user of the pattern gets it: a token in `tokens/tokens.json`, a recipe variant or
  `src/theme/` entry (skill `theming`), then use it by name. A one-off style prop on a single component is the last resort, and the reply says why.
- Motion is two bounces (from epiceasing.com, kind bounce, bezier out), each with its own length, set in the theme: `bounce-relaxed` (250ms, deep rebounds:
  the default for every transition, small feedback) and `bounce-gentle` (550ms, shallow rebounds: large surfaces and entrances, because a big element with
  deep rebounds looks bad). Pair them: `animationTimingFunction="bounce-gentle"` with `animationDuration="bounce-gentle"`. No raw cubic-bezier, no
  per-component easing. Pick the shape by what the element does: no suffix to arrive or respond (default), `-in` to leave, `-in-out` to move between two
  visible places (`bounce-gentle-in`, `bounce-relaxed-in-out`). Step changes and tabs use in-out; every `Tabs.List` renders a `<Tabs.Indicator />`. Cards, alerts and toasts already enter by themselves; charts spread `chartMotion` (from `src/theme/motion.ts`) onto every recharts series.
- Icons come from `lucide-react` (`import { Dices } from 'lucide-react'`), never emoji or another icon library; icon-only buttons need an `aria-label`.
- User-facing text never names internal systems or the tech stack (Zitadel, core-api, Postgres, endpoints, env vars) and never shows a raw server
  error: map status codes to translated messages. `pnpm lint:project` scans `src/locales` for it.
- Chakra UI work: use the `chakra-ui-builder` and `chakra-ui-refactor` skills (installed in `.agents/skills`, pinned by `skills-lock.json`).
- Auth is Zitadel hosted login, code + PKCE. Do not build password or signup forms; signup is `prompt=create`.
- `VITE_*` values are public and inlined at build time. Never put a secret in them.
- Cross-repo: a new env var, port or route needs the matching change in `../k8s` and the workflow's build args
  (skill `deploy-k8s`). Do not edit or push `../k8s` unless asked; a push there deploys to production.

## Commits

The `.githooks/pre-commit` hook (no Husky; `pnpm install` sets `core.hooksPath`) runs `pnpm check`. Fix failures; do not `--no-verify`.

Conventional style (`feat(scope):`, `fix(scope):`), imperative, say why. No Claude co-author trailer. Stage files by name.
