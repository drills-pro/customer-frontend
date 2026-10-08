import { Check } from 'lucide-react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { orgColors } from '@/features/dashboard/data'
import type { Organization } from '@/features/dashboard/data'

export const ORG_NAME_MAX = 64
export const ORG_DESCRIPTION_MAX = 240

export function orgNameError(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return 'Organization name is required.'
  if (trimmed.length < 2) return 'Use at least 2 characters.'
  if (trimmed.length > ORG_NAME_MAX)
    return `Keep the name under ${ORG_NAME_MAX} characters.`
  return undefined
}

export function orgSlugError(
  slug: string,
  organizations: Organization[],
  ownId?: string,
) {
  if (slug.length < 2) return 'Use at least 2 characters.'
  if (!/^[a-z0-9-]+$/.test(slug))
    return 'Use lowercase letters, numbers and hyphens only.'
  if (slug.length > 40) return 'Keep the URL under 40 characters.'
  if (organizations.some((org) => org.slug === slug && org.id !== ownId))
    return 'That URL is already taken.'
  return undefined
}

/** Normalizes typed input as the user edits the URL handle. */
export function cleanSlugInput(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .slice(0, 40)
}

export function ColorSwatches({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (color: string) => void
  label: string
}) {
  return (
    <ToggleGroup
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(next) => next && onChange(next)}
      className="flex-wrap"
    >
      {orgColors.map((color) => (
        <ToggleGroupItem
          key={color}
          value={color}
          aria-label={`Color ${color}`}
          className="size-8 min-w-8 rounded-full p-0 text-white ring-offset-2 ring-offset-card hover:opacity-90 data-[state=on]:ring-2 data-[state=on]:ring-foreground"
          style={{ backgroundColor: color }}
        >
          {value === color && <Check className="size-4" />}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
