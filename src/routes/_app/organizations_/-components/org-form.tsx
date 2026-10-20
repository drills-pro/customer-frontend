import { Check } from 'lucide-react'

import {
  RadioButton,
  RadioButtonGroup,
} from '@/components/shared/radio-button-group'
import type { Organization } from '@/features/dashboard/domain/types'
import { orgColors } from '@/features/organizations/constants'

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
    <RadioButtonGroup
      aria-label={label}
      value={value}
      onChange={onChange}
      flexWrap="wrap"
      gap="2"
    >
      {orgColors.map((color) => (
        <RadioButton
          key={color}
          value={color}
          aria-label={`Color ${color}`}
          boxSize="8"
          minW="8"
          p="0"
          rounded="full"
          borderWidth="0"
          boxShadow="none"
          color="white"
          // The organization palette's own colors.
          bg={color}
          _hover={{ opacity: 0.9 }}
          _checked={{
            bg: color,
            outline: '2px solid',
            outlineColor: 'fg',
            outlineOffset: '2px',
          }}
        >
          {value === color && <Check size={16} />}
        </RadioButton>
      ))}
    </RadioButtonGroup>
  )
}
