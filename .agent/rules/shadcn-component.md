# Shadcn Component Usage

## Rule

Always use the project's existing **shadcn components** for UI elements when a corresponding shadcn component exists.

Do not replace an available shadcn component with a raw/native HTML implementation.

## Required Behavior

Before implementing a UI element:

1. Check whether the project already contains a corresponding shadcn component.
2. If it exists, use that component.
3. Follow the existing shadcn API and usage patterns in the project.
4. Reuse existing component variants before creating custom styles or wrappers.
5. Only use a native HTML element when there is no appropriate shadcn component.

## Examples

### Button

Do not use:

```svelte
<button onclick={handleClick}>
    Save
</button>
```

Use:

```svelte
<Button onclick={handleClick}>
    Save
</Button>
```

### Input

Do not use:

```svelte
<input
    type="text"
    bind:value={name}
/>
```

Use:

```svelte
<Input
    type="text"
    bind:value={name}
/>
```

### Select

Do not build a custom select with:

```svelte
<select bind:value={role}>
    ...
</select>
```

Use the project's shadcn `Select` components.

### Dialog

Do not manually implement modal behavior with `<div>` elements.

Use the project's shadcn `Dialog` components.

## Native HTML

Native semantic elements are still allowed when they are structural or when shadcn does not provide an equivalent component.

Examples:

```svelte
<div>
<section>
<main>
<header>
<footer>
<nav>
<p>
<span>
<h1>
<ul>
<li>
```

The restriction applies primarily to interactive UI controls and components that already have a shadcn equivalent.

## Existing Components First

Before adding a new shadcn component or building a new abstraction:

1. Search the project's existing components.
2. Reuse an existing component if possible.
3. Check how that component is used elsewhere in the project.
4. Follow the same import and composition pattern.

Do not create duplicate implementations of existing UI components.

## Styling

Do not recreate shadcn components using Tailwind classes on native elements just to achieve a different appearance.

Prefer:

1. Existing component variants.
2. Component props.
3. `class` customization.
4. Extending the existing component when genuinely necessary.

## Enforcement

When modifying existing code, if the affected code contains a native interactive element that has an existing shadcn equivalent, prefer converting it to the project's shadcn component when doing so is within the scope of the change.

Before finishing a UI task, verify that no new native interactive component was introduced where an existing shadcn component should have been used.

## Focus Styling

This project uses **one** focus treatment across every primitive: a ring, with
no border-colour change.

```
outline-hidden focus-visible:ring-2 focus-visible:ring-ring
```

Validity is a separate channel — the **border** carries it, the ring only tints
while focused:

```
aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive
```

Enforced by `scripts/check-focus-styles.sh` (wired into `pnpm lint`).

### Rules

1. Never add `focus-visible:border-*`. A coloured border plus a ring is the
   "double ring" this layer was cleaned up to remove.
2. Never use `!important` (`class!`) to win a focus argument — see
   `css-cascade.md` Rule 2 for why it can never be overridden afterwards.
3. **One element owns the ring.** In a composite (`InputGroup` + `InputGroupInput`,
   `CommandInput`, `FieldLabel` + `Checkbox`/`Radio`/`Switch`) the outermost
   element that draws the visible box carries the ring and detects inner focus
   with `has-[…]`. Inner elements stand down with `ring-0 focus-visible:ring-0`
   — cancellation is by width-zero, never by importance.
4. Never add `focus-visible:ring-*` to an element whose base uses `ring-*` as
   its border — see `css-cascade.md` Rule 4 for the affected components and the
   `inset-ring` workaround.
5. No `ring-offset-*`. The gap paints in a fixed colour and this app has two
   surfaces (page `#f8fafc`, card `#ffffff`), so either choice is wrong on one.

## Sizing And Spacing Variants

Prefer these over hand-written utilities:

- `Input`, `SelectTrigger`, `InputGroup`: `size="sm" | "default" | "lg"`
  (28 / 32 / 36px). `InputGroup`'s size also drives its inner control, so never
  write a height on both.
- `Card`: `size="default" | "sm" | "lg" | "flush"`. `flush` gives zero outer
  padding with a padded sectioned header (`<CardHeader className="border-b">`);
  `lg` is the 20px-padded card. For an off-size bordered header set the var,
  not a `py-*`: `<CardHeader className="border-b [--card-section:--spacing(3)]">`.
- `Button`: `variant="link"` already includes `h-auto p-0 border-none`;
  `variant="option"` is the selectable option card, driven off `aria-pressed`.
- `Badge`: tonal `success | warning | info | neutral | error | accent`, plus
  `BadgeDot` for the leading status dot.

## Do Not Hand-Roll A Primitive That Exists

The most common defect in this codebase is a component rebuilt out of
`<Button>` + classes while the real primitive sits unused. It costs more than
duplication: **it loses the ARIA role**, so tests and screen readers stop seeing
the control.

### Known outstanding cases — fix these rather than copying them

- **Tab bars built from `<Button>`.** `ui/tabs.tsx` ships
  `TabsList variant="chip"` (rounded-full, indigo-600 active) and
  `variant="line"` (border-b-2, indigo-600 active), which match the hand-rolled
  bars at `datasets_/$datasetId.tsx:145` and `_nav/route.tsx:125,133`
  pixel-for-pixel. Because those are buttons, they expose `role="button"` and
  `tests/dataset-detail.spec.ts` times out on `getByRole('tab', ...)`. Converting
  them to `Tabs`/`TabsList`/`TabsTrigger` is the fix, and it turns a red test
  green.
- **Segmented view toggle built from two `<Button>`s** at
  `projects-list/project-filters.tsx:126-152`, while the identical grid/table
  toggle at `_nav/datasets.tsx` correctly uses
  `<ToggleGroup type="single" variant="outline" size="lg" spacing={0}>`.
- **`ui/kbd.tsx` is imported nowhere**, while `route.tsx:370` renders a raw
  `<kbd>` with hand-written classes.

### Before building any UI element

1. `ls src/components/ui/` — is there a primitive for this?
2. Open it and read its `cva` block. Does a **variant** already produce the look
   you were about to hand-write? (`Button`: `option`, `link`; `Badge`: the six
   tonal variants + `BadgeDot`; `Card`: `flush`/`lg`; `TabsList`: `chip`/`line`.)
3. Only then write `className`, and only for **layout** — width, flex direction,
   alignment, gap, margin. Colour, height, padding, borders, focus and state
   styling belong in the primitive.

If you find yourself writing the same class string a third time, add a variant
instead and migrate the other two call sites.

### Consolidating duplicates non-breakingly

When several modules have grown their own copy of a component, keep each
module's exported name and prop type and change only the bodies — that way no
import moves and no page's colours shift. The three `StatusBadge` modules
(`dashboard/`, `dataset-list/`, `training-run-detail/`) were collapsed this way:
each keeps its own `status → tone` map and renders
`<Badge variant={tone[status]}><BadgeDot />{status}</Badge>`. A single shared
component would have touched ten locations, including three barrel re-exports,
to save ~15 lines.
