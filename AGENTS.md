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

The UI is Chakra UI v3 with the drills.pro theme (`src/theme/`); `CLAUDE.md`
has the design-system rules and `pnpm lint:project` enforces them (no native
form controls, no raw hex, no inline `style`, no `!important`). Read
[`ui-verification.md`](.agent/rules/ui-verification.md) before reporting a
styling or component change as done.

### The short version

1. **Reuse before you style.** Recipe variants first (`Button variant="option"`,
   `Table.Root variant="data"`), then the shared pieces in
   `src/components/shared/`: `SectionCard`, `EmptyNotice`, `ToneBadge`,
   `AppDialog`, `DangerCard`, `FormFooter`, `SectionTabs`, `RecordNotFound`,
   `RadioButtonGroup`, `SwitchButton`, `Prose`. A pattern used three times
   belongs in a recipe or a shared component, not copied props.
2. **Choices and toggles are buttons.** Chakra's SegmentGroup, RadioGroup and
   Switch put the role on a visually hidden input that clicks and role queries
   cannot reach. Use `RadioButtonGroup` and `SwitchButton`.
3. **A select inside a dialog gets `portalled={false}`.** The modal marks
   everything outside it `aria-hidden`, including a portalled list.
4. **Charts need `responsive`** on the Recharts chart: `Chart.Root` has no
   `ResponsiveContainer` of its own.
5. **Spacing and size props take tokens.** `lineHeight="6"` is six times the
   font size, not Tailwind's `leading-6`; `minH="15"` is not a size. Use a
   token or a value with a unit.
6. **Verify by measuring.** Read computed styles out of the browser.
7. **`pnpm test` may have pre-existing failures** (one dashboard test depends on
   the date). Capture the baseline before you start and report the delta.
