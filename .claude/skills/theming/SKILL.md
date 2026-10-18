---
name: theming
description: Use when adding or changing a theme (tenant colors), design tokens, or component recipes.
---

# Themes and tokens

- Themes are tenant templates: five colors per mode (`background, primary, secondary, warning, font-color`) in `src/demo/tenants.ts`;
  `deriveTheme()` (`src/tenant/derive.ts`) derives the rest and checks 36 contrast pairs per mode. A failing template is rejected and falls
  back to drills.pro (the dev console names the failing pairs; `derived.suggest.primary` gives a passing primary).
- Add a theme: add an entry to `TENANTS`; the dashboard selector and localStorage (`drills-theme`) pick it up. Check light and dark.
- Tenants cannot change `danger`, `focus`, `info` or `class-*` colors.
- Tokens come from `tokens/tokens.json`: edit it, run `pnpm tokens` then `pnpm typegen`. Never hand-edit `tokens.generated.ts`.
- Recipe overrides live in `src/theme/recipes/`; only the differences from Chakra's defaults.
