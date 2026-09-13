import { defaultPreferences, organizations } from '@/features/dashboard/data'
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

    return {
      organizationId: organizations.some(
        (org) => org.id === saved.organizationId,
      )
        ? (saved.organizationId as string)
        : defaultPreferences.organizationId,
      onboardingDismissed: saved.onboardingDismissed === true,
      notificationsRead: saved.notificationsRead === true,
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
    }
  } catch {
    return defaultPreferences
  }
}
