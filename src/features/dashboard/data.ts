/**
 * Compatibility surface for the dashboard feature.
 *
 * The contents moved into `domain/`, `data/`, `selectors/`, and `persistence/`;
 * this file keeps the old import path working. Prefer `@/features/dashboard`.
 */
import type { DashboardPreferences } from './domain/types'

export * from './domain/types'
export * from './domain/project'
export * from './data/projects'
export * from './data/operations'
export * from './data/datasets'
export * from './selectors/projects'

export const DASHBOARD_STORAGE_KEY = 'drills-dashboard-v1'

export const defaultPreferences: DashboardPreferences = {
  organizationId: 'acme',
  onboardingDismissed: false,
  notificationsRead: false,
  uploads: [],
  datasets: [],
  trainingRuns: [],
  createdProjects: [],
}
