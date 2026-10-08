import type { DashboardPreferences, Organization } from '../domain/types'
import { organizations } from '../data/organizations'

type OrgPreferences = Pick<
  DashboardPreferences,
  'createdOrganizations' | 'organizationEdits'
>

function initialOf(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?'
}

/** Seeded organizations with saved edits applied, then those made here. */
export function allOrganizations(preferences: OrgPreferences): Organization[] {
  return [
    ...organizations.map((org) => {
      const edits = preferences.organizationEdits[org.id] as
        Partial<Organization> | undefined
      return edits
        ? { ...org, ...edits, initial: initialOf(edits.name ?? org.name) }
        : org
    }),
    ...preferences.createdOrganizations,
  ]
}

export function findOrganization(
  orgId: string,
  preferences: OrgPreferences,
): Organization | undefined {
  return allOrganizations(preferences).find((org) => org.id === orgId)
}

export function isSeedOrganization(orgId: string) {
  return organizations.some((org) => org.id === orgId)
}

export function withInitial<T extends { name: string }>(org: T) {
  return { ...org, initial: initialOf(org.name) }
}
