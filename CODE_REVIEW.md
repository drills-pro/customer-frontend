# Customer Frontend Code Review

Review date: 2026-09-13  
Scope: the current working tree, including staged and unstaged changes  
Focus: structure, code cleanliness, functionality, accessibility, and verification

## Executive summary

The project has a solid base: strict TypeScript is enabled, TanStack file routing is used consistently, route-specific components are mostly co-located, the shared UI layer is substantial, and the production build succeeds. The main weaknesses are not compiler problems; they are gaps between the application's persisted state, the UI that reads it, the documentation, and the tests.

The two highest-priority issues are:

1. A newly created training run is persisted, but the dashboard and command search continue to read a separate static `trainings` array. The run also never advances beyond its initial hard-coded progress.
2. `localStorage` reads and writes are not protected. A blocked read or quota-exceeded write can break app hydration or a user action even though the README says the app remains usable.

No source code was changed as part of this review. This file is the only review artifact added.

## Status (addressed 2026-09-13)

Every finding below has been acted on in the working tree. What changed, by finding:

| Finding                                        | Status | Where                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persisted runs disconnected from the dashboard | Fixed  | Seeds promoted to full `TrainingRun` records; one selector in `src/features/dashboard/selectors/training-runs.ts` feeds the home metric, live card, search, and run detail. Progress, step, epoch, and ETA derive from `startedAt` via `runProgressAt`, ticked by `src/hooks/use-now.ts`; runs reach `Completed`. |
| Browser-storage failures break the app         | Fixed  | `persistence/storage.ts` guards each read and write; `persistenceAvailable` is on the layout context and drives one non-blocking notice. Covered by `tests/storage-failure.spec.ts`.                                                                                                                              |
| Playwright gate out of sync                    | Fixed  | The six stale assertions were updated; the suite is green and has grown to 47 tests.                                                                                                                                                                                                                              |
| Nested `<main>` landmarks                      | Fixed  | `SidebarInset` is a `div`; route-level `<main id="dashboard-main">` is the only main landmark.                                                                                                                                                                                                                    |
| Interaction primitives bypassed                | Fixed  | Dataset sections use `Tabs`/`TabsList variant="chip"`; the project section nav uses the line-tab classes without `!important`; the grid/list control is a single-selection `ToggleGroup`.                                                                                                                         |
| Styling violates the cascade rules             | Fixed  | No application-level important utilities and no `dark:` variants remain. `scripts/check-focus-styles.sh` now fails on either, verified against injected violations.                                                                                                                                               |
| Sidebar cookie written but never read          | Fixed  | The write is removed and the session-only contract documented; the duplicate Escape listener and the `Math.random()` skeleton width are gone. Covered by a refresh test.                                                                                                                                          |
| Shallow validation in a data monolith          | Fixed  | `persistence/` holds `zod` schemas with bounded numerics, migrations as separate functions, and a restore that drops only the entries that fail.                                                                                                                                                                  |
| Documentation describes a different app        | Fixed  | README rewritten from the current route tree, including what is not implemented.                                                                                                                                                                                                                                  |
| "Recently updated" sorting is a no-op          | Fixed  | `Project.updatedAt` added, sorted descending, with a migration for previously persisted projects.                                                                                                                                                                                                                 |
| Large modules and route components             | Fixed  | `data.ts` 1,508 → 26 lines (a compatibility re-export) over `domain/`, `data/`, `selectors/`, `persistence/`; `route.tsx` 498 → 130; `projects_/new.tsx` 615 → 145. `sidebar.tsx` deliberately left aligned with upstream.                                                                                        |
| Dependency and configuration cleanup           | Fixed  | `zod` now used; `clsx`, `tailwind-merge`, and `src/lib/utils.ts` removed; `Kbd` used in the header; TanStack versions pinned; pnpm settings moved to `pnpm-workspace.yaml`.                                                                                                                                       |

## Verification snapshot

| Check                       | Result            | Notes                                                                                                                       |
| --------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`            | Pass              | Strict TypeScript compilation succeeds.                                                                                     |
| `pnpm lint`                 | Pass with warning | One `no-shadow` warning in `src/features/dashboard/data.ts:774`. The focus-style guard passes.                              |
| `pnpm build`                | Pass              | Client and SSR production bundles build successfully.                                                                       |
| `pnpm check`                | Fail              | Prettier reports 9 files, including 4 source files, `src/styles.css`, and project documentation/rules.                      |
| `pnpm test --reporter=line` | Fail              | 37 passed and 6 failed in about 2.4 minutes. Most failures are stale assertions after recent UI changes; details are below. |

The first sandboxed test attempt could not bind port 3100 (`EPERM`). The full result above came from rerunning Playwright with permission to start its local server.

## Current structure

```text
src/
├── components/
│   ├── breadcrumbs/       shared route-aware breadcrumb system
│   ├── dashboard/         cross-route project presentation helpers
│   └── ui/                shadcn/Radix primitives and variants
├── features/dashboard/
│   ├── context.ts         app and project React contexts
│   ├── data.ts            types, seed data, factories, and persistence parsing
│   ├── templates.ts       project templates and template dataset creation
│   └── training.ts        model catalogs and training calculations/logs
├── hooks/                 viewport and intersection hooks
├── routes/                TanStack file routes with route-local components
├── router.tsx             router construction
├── routeTree.gen.ts       generated route tree
└── styles.css             layered design-system styles
```

The route-local `-components` approach is a good fit for this app. The main structural pressure is in `features/dashboard/data.ts` (1,508 lines), which currently owns too many unrelated responsibilities.

## Findings

### High: persisted training runs are disconnected from the dashboard

Evidence:

- A new run is written to `preferences.trainingRuns` in `src/routes/_app/projects_/$projectId/training_/-components/training-wizard/index.tsx:112-160`.
- The home metric reads only the static `trainings` array in `src/routes/_app/index.tsx:30-34`.
- `LiveTrainingsCard` also reads only the static array in `src/routes/_app/-components/dashboard/live-trainings-card.tsx:5-13`.
- Command search builds its run entries from the same static array in `src/routes/_app/route.tsx:151-187`.
- New runs start at a hard-coded `progress: 40` and no timer or time-derived transition updates that value (`training-wizard/index.tsx:137`).

Impact: after completing the application's main creation flow, the new run is visible on its direct detail URL but not in the dashboard count, live-training card, or search. Reloading preserves the frozen run, so the documented “finishes in about 30 seconds” behavior does not occur.

Recommendation: define one selector that merges seeded and persisted runs into a single view model, and use it everywhere. Derive simulated status/progress from `startedAt` or run a centralized scheduler. Keep seed data immutable, then persist only user-created entities and state overrides.

### High: browser-storage failures can break the app

Evidence:

- Hydration directly calls `window.localStorage.getItem` in `src/routes/_app/route.tsx:114-119`.
- Every preference change directly calls `window.localStorage.setItem` in `src/routes/_app/route.tsx:121-127`.
- Neither operation has a `try/catch` or a fallback state.
- README line 26 claims that blocked/full storage keeps the app usable and displays a notice, but no such handling or notice exists.

Impact: privacy settings can make `getItem` throw a `SecurityError`; storage exhaustion can make `setItem` throw a quota error. Either happens in an effect and can leave the application broken after hydration or after a user action.

Recommendation: put storage access behind a small adapter such as `loadPreferences()` and `savePreferences()`. Catch read and write errors independently, keep the in-memory state usable, expose a `persistenceAvailable` flag, and show one non-blocking notification. Add browser tests that override both `getItem` and `setItem` to throw.

### Medium: the Playwright gate is out of sync with the current UI

Current result: 37 passed, 6 failed.

Failure groups:

- Three assertions still query “New Project” as a button. It is now correctly rendered as a link to `/projects/new` in `src/routes/_app/index.tsx:61-66` and `src/routes/_app/projects.tsx:84-90`.
- Two dataset tests expect the old combined metadata string. The header now renders version/status and dataset details separately.
- One training test expects the selected `ResNet-50` summary to be a heading, but the redesigned selected-model card renders it as `ItemTitle` text.

These failures mostly indicate stale tests rather than broken user behavior. They still matter because a permanently red suite stops distinguishing real regressions from expected redesign work, and two role mismatches wait for the full 60-second test timeout.

Recommendation: update role expectations to match the intended semantics, then rerun all 43 tests. Prefer stable accessible queries and behavior assertions over exact concatenated presentation strings. Keep a green baseline before further component work.

### Medium: pages render nested `<main>` landmarks

`SidebarInset` renders a `<main>` in `src/components/ui/sidebar.tsx:324-334`, while each route also renders its own `<main id="dashboard-main">`; for example, `src/routes/_app/index.tsx:38-40` and `src/routes/_app/projects.tsx:72-74`.

Impact: the rendered document has a main landmark inside another main landmark. This is invalid landmark structure and makes screen-reader navigation less predictable.

Recommendation: choose one owner. The least disruptive choice is to make `SidebarInset` a `div` and keep route-level `main` elements because the skip link already targets them. Alternatively, keep `SidebarInset` as the single `main` and change route wrappers to `div`/`section`, moving `dashboard-main` to the inset.

### Medium: existing interaction primitives are bypassed

The codebase already has `TabsList` variants for both chip and line tabs, plus `ToggleGroup` for segmented controls. Current code still hand-rolls these interactions:

- Dataset detail uses `Button` plus manual `role="tab"`/`aria-selected` in `src/routes/_app/projects_/$projectId/datasets_/$datasetId.tsx:114-137`.
- Project navigation hand-rolls the line-tab appearance in `src/routes/_app/projects_/$projectId/_nav/route.tsx:96-126`.
- Project view selection uses two buttons in `src/routes/_app/-components/projects-list/project-filters.tsx:129-155`.

The manual dataset tabs do not provide the complete Radix tab behavior: managed focus, arrow-key navigation, tab/panel association, and consistent activation. They also duplicate state styling already available through `TabsList variant="chip"`. The view selector duplicates `ToggleGroup` behavior already used elsewhere.

Recommendation: migrate dataset sections to `Tabs`, `TabsList variant="chip"`, `TabsTrigger`, and `TabsContent`; use the line variant for section navigation where actual in-page tabs are intended; and use a single-selection `ToggleGroup` for the grid/list control.

### Medium: project styling violates the repository's own cascade rules

The project rules prohibit application-level `!important` utilities and say there is no supported dark mode. The current tree contains:

- Application-level important utilities in `projects-table.tsx:43`, `_nav/route.tsx:111-119`, and `datasets_/$datasetId.tsx:130`.
- 30 `dark:` occurrences across 13 UI files even though the root forces a light theme and no theme provider is mounted.

Impact: important utilities become difficult to override and conceal cascade problems. Dark variants can activate from OS preference while using light-only tokens, producing inconsistent controls.

Recommendation: remove application-level important utilities by using existing component variants and correct state selectors. Audit the 13 UI files and remove unsupported `dark:` rules. Extend the existing guard script beyond focus styles so these rules fail quickly in CI.

### Medium: the sidebar writes a preference cookie but never reads it

In the active component, `SidebarProvider` writes `sidebar_state` on every toggle (`src/components/ui/sidebar.tsx:76-88`), but that cookie is not read anywhere in the repository and the provider is always mounted with its default open state.

Impact: the comment says the cookie keeps sidebar state, but a refresh opens the sidebar again. This creates dead persistence code and a misleading API contract.

Related cleanup:

- Mobile Escape handling is implemented both by `SheetContent` and a document-level capture listener (`sidebar.tsx:169-183` and `:202-221`). Prefer Radix's built-in dismissal/focus restoration unless a verified bug requires the extra listener.
- `SidebarMenuSkeleton` initializes width with `Math.random()` (`sidebar.tsx:603-613`). If it is server-rendered later, server and client output can differ during hydration. It is currently unused.
- Many exported sidebar subcomponents are unused. Since this is a generated-style primitive, leaving the full upstream API is reasonable, but application-specific behavior should remain outside it.

Recommendation: either read the cookie on the server and pass `defaultOpen`, or remove cookie persistence and document that the state is session-only. Add a refresh test for the chosen behavior.

### Medium: persistence validation is shallow and centralized in a data monolith

`restorePreferences` is a useful defensive boundary, but several checks validate only a few fields and then cast the object to a complete domain type:

- Upload activities require only a string `id` (`data.ts:1463-1466`).
- Datasets require only `id`, `projectId`, and `name` (`data.ts:1468-1494`).
- Training runs check field types but do not bound most numeric values such as progress, epochs, step counts, or timestamps (`data.ts:1378-1446`).
- `zod` is installed but unused.

Impact: syntactically valid JSON with partial or extreme values can cross the persistence boundary and cause missing UI text, invalid progress values, or inconsistent derived calculations.

Recommendation: move types and schemas into a `domain`/`persistence` layer and validate the complete stored shape. Zod is already available, or lightweight explicit validators can be retained if bundle size matters. Treat migration and validation as separate functions and test both with boundary values.

### Medium: documentation describes a different version of the app

The README has several stale statements:

- It documents storage key `drills-demo-v1`; the code uses `drills-dashboard-v1`.
- It references `src/features/drills/data.ts`, `store.tsx`, and `src/features/drills/`, none of which exists.
- Its Prettier command includes the nonexistent `src/features/drills` path.
- It describes model prediction, deployment, scaling, settings, automatic training completion, and reset-demo-data behavior that are not implemented in the current routes. Those navigation items currently show “not available” toasts.

Impact: onboarding and acceptance criteria are unreliable; a contributor following the documented structure will look in the wrong modules.

Recommendation: rewrite the workflow, persistence, validation, and structure sections from the current route tree. Clearly label simulated/read-only areas and planned functionality.

### Low: “Recently updated” sorting is a no-op

`src/routes/_app/projects.tsx:67-69` sorts by name only when `filters.sort === 'name'`; for the default `recent` option the comparator always returns `0`.

Impact: the control implies an ordering operation that is not implemented. It happens to preserve seed order and prepended new projects, but it does not actually compare update times.

Recommendation: store a machine-readable `updatedAt` timestamp and format the display value separately. Sort by `updatedAt` descending for the recent option.

### Low: large modules and route components slow maintenance

Largest hand-written files include:

- `src/features/dashboard/data.ts` — 1,508 lines
- `src/routes/_app/projects_/new.tsx` — 615 lines
- `src/routes/_app/route.tsx` — 498 lines
- `src/features/dashboard/training.ts` — 419 lines
- `src/routes/_app/projects_/$projectId/_nav/datasets.tsx` — 342 lines
- `src/routes/_app/projects_/$projectId/training_/-components/training-wizard/index.tsx` — 339 lines

`sidebar.tsx` is also large at 722 lines, but it is a primitive family and should generally remain aligned with upstream shadcn rather than being split only to reduce line count.

Recommendation:

- Split `data.ts` into domain types, seed fixtures, factories/selectors, and persistence/migrations.
- Split `AppLayout` into `AppSidebar`, `AppHeader`, `WorkspaceSearch`, and a small preferences provider.
- Split the new-project page into step components and a `useNewProjectDraft` state hook, following the existing training-wizard structure.
- Keep route files responsible for route params/search, data selection, and composition—not all presentational markup.

### Low: dependency and configuration cleanup

- `zod` is unused; either use it for persistence schemas or remove it.
- `clsx` and `tailwind-merge` have no direct imports; the app imports `cn` from the `cn` package. Confirm whether they are required direct dependencies.
- `src/lib/utils.ts` only re-exports `cn` and is unused.
- `src/components/ui/kbd.tsx` is unused while `src/routes/_app/route.tsx:373` hand-rolls `<kbd>`.
- Package versions for TanStack React Router, TanStack Start, and the TanStack ESLint config use `latest`. The lockfile stabilizes current installs, but intentional version ranges are clearer and safer during dependency refreshes.
- pnpm warns on every command that `package.json#pnpm.onlyBuiltDependencies` is no longer read. Move supported pnpm settings to the workspace configuration and reconcile them with the existing `allowBuilds` entries.

## What is working well

- TypeScript uses `strict`, `noUnusedLocals`, `noUnusedParameters`, and `noUncheckedSideEffectImports`.
- The production client and SSR builds are healthy.
- File-route params and search values are validated or narrowed at route boundaries.
- Missing project, dataset, and training-run states have explicit recovery UI.
- Route-specific components are co-located, and barrel files are small.
- Shared Button, Card, Badge, Input, Select, Tabs, ToggleGroup, and other primitives provide a good design-system base.
- The CSS is layered and the repository includes written rules for previously shipped cascade/focus bugs.
- The test suite covers keyboard shortcuts, organization switching, persistence migration, mobile overflow, filtering, downloads, and multi-step workflows.
- Most interactive controls have accessible names, and charts opt into Recharts' accessibility layer.

## Recommended implementation order

1. Restore a trustworthy test baseline by updating the six stale Playwright assertions.
2. Add safe storage adapters and failure tests.
3. Introduce shared selectors for seeded plus persisted entities; connect created runs to the dashboard/search and implement the documented run transition behavior.
4. Fix landmark structure and migrate hand-rolled tabs/toggles to the existing primitives.
5. Remove application-level important classes and unsupported dark variants.
6. Split `data.ts` and the two largest app-level components along responsibility boundaries.
7. Refresh the README and clean unused dependencies/configuration.

## Suggested target feature layout

```text
src/features/dashboard/
├── domain/
│   ├── types.ts
│   ├── project.ts
│   ├── dataset.ts
│   └── training.ts
├── data/
│   ├── organizations.ts
│   ├── projects.ts
│   ├── datasets.ts
│   └── operations.ts
├── persistence/
│   ├── schema.ts
│   ├── migrations.ts
│   └── storage.ts
├── selectors/
│   ├── projects.ts
│   ├── datasets.ts
│   └── training-runs.ts
├── context.tsx
└── templates.ts
```

This is a direction, not a requirement to reorganize everything in one change. The safest approach is to extract one responsibility at a time while keeping the existing exports stable and the test suite green.
