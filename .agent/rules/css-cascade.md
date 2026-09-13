# CSS Cascade And Tailwind Conflicts

Read this before changing any `className`, any `cva` block, or `src/styles.css`.

This project has burned a lot of time on styling bugs whose cause was invisible
in the JSX. Every rule below encodes one of them. They are not style
preferences — breaking them produces styling that silently does nothing, or that
cannot be overridden.

## Rule 1 — All CSS in `src/styles.css` must be inside an `@layer`

`@import 'tailwindcss'` puts every utility inside `@layer utilities`. **Unlayered
CSS outranks every layered rule regardless of specificity.** So one unlayered
`input { ... }` beats `bg-transparent`, `rounded-lg` and `px-2.5` on every input
in the app, and no amount of class-writing can win.

```css
/* WRONG — unlayered, beats every utility */
input {
  border-radius: 6px;
  background: white;
}

/* RIGHT */
@layer base {
  input {
    border-radius: 6px;
    background: white;
  }
}
```

`src/styles.css` is currently fully layered (`@theme` / `@layer base` /
`@layer components`). Keep it that way. If you add a bare selector after the
last `@layer` block, you reintroduce the whole class of bug.

Detect: build and check that nothing but `:root`, `*`, Tailwind's `@property`
registrations and Tailwind's own keyframes appears after the utilities layer
closes.

## Rule 2 — Never use `!important` (`class!`) to win a styling argument

`cn` is clsx + tailwind-merge, and **it does not merge `!`-suffixed classes at
all**:

```js
cn('ring-2! ring-0') // => "ring-2! ring-0"   both kept, the `!` always wins
cn('ring-2 ring-0') // => "ring-0"           merged correctly
```

So a `!` permanently overrides the design system for that element, survives every
future `className` a caller passes, and is invisible in review. It also spreads
by copy-paste: one component with `!` becomes twelve call sites with `!`.

**If a plain utility is losing, the cause is almost never specificity — it is
Rule 1 or Rule 3.** Diagnose before reaching for `!`.

The handful of `!` classes that remain in `src/components/ui/` are upstream
shadcn (`command.tsx`, `sidebar.tsx`) fighting a sibling variant, not the
cascade. Do not add more.

Enforced for focus styling by `scripts/check-focus-styles.sh` (`pnpm lint`).

## Rule 3 — Two conflict systems run at once, and neither shows in the className

1. **tailwind-merge** resolves classes in the _same_ utility group under the
   _same_ modifiers — last one wins, by string order.
2. **CSS specificity** resolves everything else — and a `data-*`/`group-*`
   variant is a whole extra selector.

```
data-[size=default]:h-8    ->  .cls[data-size=default]     (0,2,0)
h-9                        ->  .h-9                        (0,1,0)   LOSES
```

These are _different_ groups to tailwind-merge (different modifiers), so it
keeps both — then CSS picks the `data-` one. This is real: four call sites wrote
`<SelectTrigger className="h-9">` and rendered at 32px for months.

**Never override a `data-*`-driven property with a plain utility. Use the prop.**

```tsx
<SelectTrigger className="h-9" />   // dead code
<SelectTrigger size="lg" />         // correct
```

When you add a variant to a primitive, prefer the mechanism that keeps the
declaration overridable:

- A **plain class map** (`inputSizes[size]`) stays at (0,1,0), so callers can
  still override with a utility. Use this by default.
- A **`data-[size=*]` class** is (0,2,0) and beats caller utilities. Use it only
  when the primitive already does (`SelectTrigger`), for consistency.
- A **CSS custom property** (`[--card-inset:--spacing(5)]`) keeps the _consuming_
  declaration at (0,1,0) while still varying by size. Use this when the base has
  `has-[...]` escape hatches that must keep winning — a `data-[size]:h-9` at
  (0,2,0) would beat `has-[>textarea]:h-auto` at (0,1,1) and break every
  textarea group. `Card` and `InputGroup` both use this.

## Rule 4 — `ring`, `inset-ring` and `shadow` are three separate box-shadow slots

Tailwind v4 composes one `box-shadow` from `--tw-inset-shadow`,
`--tw-inset-ring-shadow`, `--tw-ring-offset-shadow`, `--tw-ring-shadow`,
`--tw-shadow`. Two utilities writing the **same** slot replace each other; they
do not stack.

Consequence: **never add `focus-visible:ring-*` to an element whose base uses
`ring-*` as its border.** The focus ring would replace the hairline instead of
adding to it. Affected: `Card`, `Dialog`, `AlertDialog`, `SelectContent`,
`DropdownMenuContent`, `Sidebar` (floating), `Avatar`.

If an element needs both a persistent outline and a focus ring, put them in
different slots — that is why `Button`'s `option` variant uses
`aria-pressed:inset-ring-1` for selection and leaves `ring` to focus. Both are
visible at once; a `ring`-based selection indicator would vanish on focus.

## Rule 5 — `cva` emission order decides whether a reset works

`cva` concatenates: **base → variants (in key order) → compoundVariants → class**.

A reset placed in a `variant` string is emitted _before_ the `size` string, so
`size`'s padding wins:

```tsx
// WRONG — size's px-2.5 survives; tailwind-merge does not drop p-0 for px-2.5
variant: {
  link: 'p-0 h-auto text-primary ...'
}

// RIGHT — emitted after size, so p-0 removes px-2.5 and h-auto removes h-8
compoundVariants: [{ variant: 'link', class: 'h-auto border-none p-0' }]
```

Any variant that needs to _cancel_ a size (`link`, `option`) belongs in
`compoundVariants`.

## Rule 6 — No `dark:` variants

There is no dark mode in this app: no `@custom-variant dark`, no `.dark`
selector, `:root` sets `color-scheme: light`, and no theme provider is mounted
(`next-themes` is imported only by `sonner.tsx`). A `dark:` utility therefore
compiles into a bare `@media (prefers-color-scheme: dark)` and fires against
**light** tokens on an OS-dark machine — it is wrong, not merely unused.

Delete `dark:` classes when you touch a component. Do not add new ones.

## Rule 7 — `data-*` attributes on primitives can leak into ancestors

`ItemGroup` carries **unscoped** `has-data-[size=sm]:gap-2.5` and
`has-data-[size=xs]:gap-2` (`src/components/ui/item.tsx:15`), so a `data-size`
on _any_ descendant retunes the group's gap.

When adding a size prop, prefer a plain class map over stamping `data-size`
(see Rule 3). If a `data-size` is genuinely needed, check for unscoped
`has-data-[...]` selectors in any component that might wrap it, or namespace the
attribute (`data-input-group-size`).

## Rule 8 — Theme tokens, not re-hardcoded palette

`--primary` **is** `#4f46e5` (indigo-600) and `--input` **is** `#cbd5e1`
(slate-300). Writing `bg-indigo-600 text-white` on a `<Button>` reimplements
`variant="default"` and silently opts out of theming.

Use the variant. Reach for a raw palette class only for something the token set
genuinely does not cover, and prefer adding a variant if it appears more than
twice.
