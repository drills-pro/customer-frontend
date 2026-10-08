import {
  defaultPreferences,
  isSeedOrganization,
  themePreferences,
} from '@/features/dashboard/data'
import type { DashboardPreferences } from '@/features/dashboard/data'
import {
  migrateCreatedProject,
  migrateDataset,
  migrateTrainingRun,
} from './migrations'
import {
  activitySchema,
  createdProjectSchema,
  datasetSchema,
  organizationProfileSchema,
  organizationSchema,
  parseEntry,
  trainingRunSchema,
} from './schema'

/**
 * Reads one collection: migrate each entry to the current shape, validate it,
 * and drop only the entries that fail. A single corrupt record must not cost
 * the user the rest of their workspace.
 */
function restoreList<T>(
  value: unknown,
  migrate: (entry: unknown) => unknown,
  schema: Parameters<typeof parseEntry<T>>[0],
): T[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => parseEntry(schema, migrate(entry)))
    .filter((entry): entry is T => entry !== undefined)
}

const identity = (entry: unknown) => entry

/** Keeps only edits to seeded organizations that still validate. */
function restoreEdits(
  value: unknown,
): DashboardPreferences['organizationEdits'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const edits: DashboardPreferences['organizationEdits'] = {}
  for (const [orgId, entry] of Object.entries(value)) {
    const profile = parseEntry(organizationProfileSchema, entry)
    if (profile && isSeedOrganization(orgId)) edits[orgId] = profile
  }
  return edits
}

/**
 * Turns the raw stored string into preferences. Each field is restored
 * independently so a missing or invalid one falls back to its default rather
 * than discarding the whole document.
 */
export function restorePreferences(value: string | null): DashboardPreferences {
  if (!value) return defaultPreferences
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return defaultPreferences
    }
    const saved = parsed as Record<string, unknown>

    const createdOrganizations = restoreList(
      saved.createdOrganizations,
      identity,
      organizationSchema,
    ).filter(
      (org, index, list) =>
        !isSeedOrganization(org.id) &&
        list.findIndex((item) => item.id === org.id) === index,
    )
    const organizationId =
      typeof saved.organizationId === 'string' &&
      (isSeedOrganization(saved.organizationId) ||
        createdOrganizations.some((org) => org.id === saved.organizationId))
        ? saved.organizationId
        : defaultPreferences.organizationId

    return {
      organizationId,
      onboardingDismissed: saved.onboardingDismissed === true,
      notificationsRead: saved.notificationsRead === true,
      theme:
        themePreferences.find((theme) => theme === saved.theme) ??
        defaultPreferences.theme,
      uploads: restoreList(saved.uploads, identity, activitySchema),
      datasets: restoreList(saved.datasets, migrateDataset, datasetSchema),
      trainingRuns: restoreList(
        saved.trainingRuns,
        migrateTrainingRun,
        trainingRunSchema,
      ),
      createdProjects: restoreList(
        saved.createdProjects,
        migrateCreatedProject,
        createdProjectSchema,
      ),
      createdOrganizations,
      organizationEdits: restoreEdits(saved.organizationEdits),
      declinedInvitations: Array.isArray(saved.declinedInvitations)
        ? saved.declinedInvitations.filter(
            (id): id is string => typeof id === 'string',
          )
        : [],
    }
  } catch {
    return defaultPreferences
  }
}
