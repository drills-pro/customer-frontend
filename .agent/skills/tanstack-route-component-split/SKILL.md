---
name: tanstack-route-component-split
description: Refactor oversized TanStack Router React route files by extracting route-local components while preserving routes, behavior, data flow, styling, and tests. Use when a user asks to split dashboard cards, panels, forms, tabs, or other page sections into local components. Do not use for route-tree redesigns or generic shared design-system extraction.
---

# TanStack Route Component Split

Split a large TanStack Router React route into maintainable, route-local
components without changing what the page does.

## Preserve the Contract

- Treat this as a behavior-preserving refactor unless the user explicitly
  requests behavior changes.
- Keep the route path, route registration, loaders, validation, route-level
  error handling, and page layout stable.
- Preserve rendered content, interactions, accessibility semantics, responsive
  classes, empty states, loading/error states, and side effects.
- Future plans for independent APIs do not authorize adding API calls now.
- Preserve unrelated and uncommitted work already in the repository.

## Choose Boundaries

Inspect the route and nearby data/context modules before editing. Extract
sections that represent an independent domain or responsibility, such as a
card, panel, form, tab body, or table.

- Move section-specific rendering, UI-only state, filtering, handlers, and
  helpers with the section.
- Keep page composition and genuinely route-wide coordination in the route
  file.
- Keep existing route loader data flowing through narrow typed props when the
  route owns the fetch.
- Let a component use an existing context or colocated query hook when that
  already matches the application's data-ownership model.
- Do not introduce duplicated fetching, speculative abstractions, or new
  shared APIs merely to prepare for possible future work.
- Extract a shared local helper only when multiple extracted components need
  the same UI or behavior.

## Place Local Components Safely

Read the repository instructions and TanStack Router generator configuration
before choosing a directory.

- Use the configured `routeFileIgnorePrefix` for colocated non-route files.
  TanStack Router commonly defaults to `-`, making a directory such as
  `src/routes/example/-components/` appropriate.
- Never assume `_components` is private: underscore-prefixed segments
  represent pathless routes in TanStack Router.
- If the project changes the ignore prefix, follow that configuration.
- If ignored colocated files are unsupported, place the components in the
  nearest feature directory outside the routes tree.
- Do not add `createFileRoute` exports to local component files.
- Do not hand-edit generated route trees.

Use descriptive component filenames based on responsibility, for example:

```text
src/routes/dashboard/
├── index.tsx
└── -components/
    ├── recent-activity-card.tsx
    ├── live-trainings-card.tsx
    └── dashboard-card-ui.tsx
```

## Refactor

1. Inventory each candidate section's imports, state, data sources, callbacks,
   and shared helpers.
2. Create one local component per agreed responsibility.
3. Move the complete section implementation, retaining the existing markup and
   styling.
4. Replace the original JSX with component composition in the same order and
   layout containers.
5. Remove stale imports, state, calculations, and helpers from the route.
6. Format only touched files unless broader formatting was requested.

## Verify

- Run the relevant formatter check, typecheck, and lint.
- Run a production build so the TanStack plugin processes the route tree.
- Compare the generated route tree before and after; ignored local components
  must not appear as routes.
- Run focused tests for the extracted sections and their parent page,
  including interaction, empty-state, organization/tenant changes, and
  responsive behavior when applicable.
- If existing unrelated checks fail, identify them separately and do not
  change unrelated behavior just to make stale tests pass.

The refactor is complete when the route reads primarily as page orchestration,
every extracted section behaves as before, and the generated routes are
unchanged.
