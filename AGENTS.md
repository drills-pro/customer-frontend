<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task:

- Run `npx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `npx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

## Project Rules

`.agent/rules/` holds rules for this package. **Read the relevant ones before
editing, not after a review comment.** They encode bugs this codebase has
already shipped, with the symptom and the detection command for each.

| Rule                                                      | Read it when                                                   |
| --------------------------------------------------------- | -------------------------------------------------------------- |
| [`css-cascade.md`](.agent/rules/css-cascade.md)           | Touching any `className`, any `cva` block, or `src/styles.css` |
| [`shadcn-component.md`](.agent/rules/shadcn-component.md) | Building or restyling any UI element                           |
| [`ui-verification.md`](.agent/rules/ui-verification.md)   | Before reporting a styling or component change as done         |

### The short version

1. **Reuse a variant before writing classes.** `Button`, `Badge`, `Card`,
   `Input`, `SelectTrigger`, `InputGroup` and `Tabs` all carry variants for the
   patterns people keep hand-rolling. Check the primitive first.
2. **Never `!important`.** `cn` cannot merge `!` classes, so one `!` overrides
   the design system forever and is invisible in review. If a plain utility is
   losing, the cause is CSS layering or a `data-*` specificity win — diagnose it.
3. **Reading the `className` does not tell you what renders.** Verify size,
   spacing and focus by reading computed styles out of the browser.
4. **`pnpm test` has pre-existing failures.** Capture the baseline before you
   start and report the delta, not a pass count.

### Stylesheet history

`src/styles.css` was ~2800 lines of unlayered CSS from a previous
implementation, shadowing the shadcn layer and beating every Tailwind utility.
It is now ~280 lines and fully layered. The `!important` classes scattered
through the components existed only to fight it, and are gone. Do not
reintroduce either — `css-cascade.md` Rules 1 and 2 explain how.
