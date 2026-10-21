# Verifying UI Changes

Read this before reporting a styling or component change as done.

The premise: **reading the props does not tell you what renders.** Recipe
variants, size variants, compound variants and style props all meet at the
element, and a prop that is not a token is passed through as raw CSS
(`lineHeight="6"` is six times the font size). A Playwright test asserting
`36px` once went red against a `32px` element without anyone noticing.

So: verify by measuring, not by reading.

## Establish the baseline before you touch anything

`pnpm test` has **pre-existing failures**. If you don't capture them first, you
cannot tell your regression from the existing state, and you will either panic
about someone else's bug or ship your own.

```sh
pnpm test --reporter=line 2>&1 | grep -E '^\s+\[chromium\]' | sort > /tmp/baseline.txt
```

Diff against it at the end with `comm -13 /tmp/baseline.txt /tmp/after.txt`.
Report the delta ("11 failed → 10 failed, zero new"), never a bare pass count.

## Measure computed styles, not classes

For any change to size, spacing, borders, focus or colour, read the values back
out of the browser. This is the only way to catch a class that lost a
specificity argument.

```js
// scratch script; run from the project root so `@playwright/test` resolves
import { chromium } from '@playwright/test'
const b = await chromium.launch()
const p = await b.newPage()
await p.goto('http://localhost:3000/<route>')
const el = p.getByRole('textbox', { name: '<accessible name>' })
console.log(
  await el.evaluate((n) => {
    const s = getComputedStyle(n)
    return {
      height: s.height,
      padding: s.padding,
      borderWidth: s.borderWidth,
      boxShadow: s.boxShadow,
      outline: s.outlineStyle,
    }
  }),
)
await b.close()
```

What to look for:

- **Height mismatch between a shell and its control.** An `InputGroup` at 36px
  wrapping a 32px `<input>` is the signature of a height set on the wrapper only.
- **`boxShadow` with a `0px 0px 0px 0px` entry** — that slot is set but inert
  (width zero). That is how an inner control correctly stands down from a
  composite's focus ring; it is _not_ a missing ring.
- **Exactly one non-zero ring entry** on the element that owns the box, and an
  `outline` of `none`. Two visible rings, or a ring plus an outline, is the
  "double ring" regression.

Put scratch scripts in the scratchpad or delete them; never leave `.mjs` probes
in the repo.

## Screenshot the component, not just the page

Clip to the component with a small margin so the focus ring is actually visible
at a reviewable size, and capture both states:

```js
const box = await shell.boundingBox()
const clip = {
  x: box.x - 16,
  y: box.y - 16,
  width: box.width + 32,
  height: box.height + 32,
}
await p.screenshot({ path: 'rest.png', clip })
await el.focus()
await p.waitForTimeout(250)
await p.screenshot({ path: 'focus.png', clip })
```

Use `deviceScaleFactor: 3` for a component crop — a 2px ring is not judgeable at
1x. Then actually look at the image.

## Run the full gate

```sh
pnpm typecheck            # variant unions; run `pnpm typegen` after a recipe change
pnpm lint:project         # native controls, raw hex, inline style, !important
pnpm build
pnpm test
```

`pnpm check` runs the format check, project lint, i18n parity, typecheck and
build together; the pre-commit hook runs it.

## When a guard script fires, fix the cause

`scripts/check-project.sh` flags escape hatches around the design system. Fix
the token, recipe or component instead. A value that is data rather than
styling (a colour stored with a record) gets a `lint-ok` comment on its line.
