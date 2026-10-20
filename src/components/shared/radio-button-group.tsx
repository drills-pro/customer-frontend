import * as React from 'react'
import { Button, Group } from '@chakra-ui/react'
import type { ButtonProps, GroupProps } from '@chakra-ui/react'

type RadioButtonGroupState = {
  value: string
  onChange: (value: string) => void
}

const RadioButtonGroupContext =
  React.createContext<RadioButtonGroupState | null>(null)

const MOVES: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
}

/**
 * One choice from a row of buttons: a `radiogroup` of buttons with
 * `role="radio"`. Arrow keys move focus between them, Home/End jump to the
 * ends, and click, Enter or Space chooses. Chakra has no toggle group, and its
 * SegmentGroup puts the radio role on a visually hidden input.
 */
export function RadioButtonGroup({
  value,
  onChange,
  'aria-label': label,
  children,
  ...props
}: RadioButtonGroupState & { 'aria-label': string } & GroupProps) {
  const state = React.useMemo(() => ({ value, onChange }), [value, onChange])

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const radios = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        '[role="radio"]:not(:disabled)',
      ),
    ]
    const current = radios.indexOf(document.activeElement as HTMLElement)
    if (current < 0) return
    let next: number | undefined
    if (event.key in MOVES) {
      next = (current + MOVES[event.key] + radios.length) % radios.length
    } else if (event.key === 'Home') {
      next = 0
    } else if (event.key === 'End') {
      next = radios.length - 1
    }
    if (next === undefined) return
    event.preventDefault()
    radios[next].focus()
  }

  return (
    <RadioButtonGroupContext.Provider value={state}>
      <Group
        role="radiogroup"
        aria-label={label}
        onKeyDown={onKeyDown}
        {...props}
      >
        {children}
      </Group>
    </RadioButtonGroupContext.Provider>
  )
}

/**
 * A choice in a RadioButtonGroup. Only the chosen one is in the tab order,
 * as in a native radio group.
 */
export function RadioButton({
  value,
  ...props
}: { value: string } & Omit<ButtonProps, 'value'>) {
  const group = React.useContext(RadioButtonGroupContext)
  if (!group) throw new Error('RadioButton must be inside a RadioButtonGroup')
  const checked = group.value === value

  return (
    <Button
      type="button"
      role="radio"
      aria-checked={checked}
      data-state={checked ? 'on' : 'off'}
      tabIndex={checked ? 0 : -1}
      variant="outline"
      onClick={() => group.onChange(value)}
      _checked={{ bg: 'selected-bg', borderColor: 'selected-edge' }}
      {...props}
    />
  )
}
