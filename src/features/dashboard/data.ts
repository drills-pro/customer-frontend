/**
 * The UI's types and stored-preference defaults, on the import path most of
 * the app already uses. The records themselves come from the API; see
 * `src/features/<area>/` for the calls and `src/api/mock/` for the mock.
 */
import type { DashboardPreferences } from './domain/types'

export * from './domain/types'

export const DASHBOARD_STORAGE_KEY = 'drills-dashboard-v1'

export const defaultPreferences: DashboardPreferences = {
  // Empty until the user picks one; the shell then uses the first organization.
  organizationId: '',
  onboardingDismissed: false,
  theme: 'light',
}
