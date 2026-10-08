import { expect, test } from '@playwright/test'
import {
  DASHBOARD_STORAGE_KEY,
  defaultPreferences,
  restorePreferences,
} from '../src/features/dashboard'

test('dashboard preferences recover from invalid storage', () => {
  expect(restorePreferences(null)).toEqual(defaultPreferences)
  expect(restorePreferences('{broken')).toEqual(defaultPreferences)
  expect(
    restorePreferences(JSON.stringify({ organizationId: 'unknown' })),
  ).toEqual(defaultPreferences)
})

test('dashboard preferences retain valid persisted values', () => {
  const restored = restorePreferences(
    JSON.stringify({
      organizationId: 'northwind',
      onboardingDismissed: true,
      notificationsRead: true,
      theme: 'dark',
      uploads: [],
    }),
  )
  expect(restored.organizationId).toBe('northwind')
  expect(restored.onboardingDismissed).toBe(true)
  expect(restored.theme).toBe('dark')
  expect(restorePreferences(JSON.stringify({ theme: 'sepia' })).theme).toBe(
    'light',
  )
  expect(DASHBOARD_STORAGE_KEY).toBe('drills-dashboard-v1')
})

test('dashboard preferences discard malformed training runs', () => {
  const restored = restorePreferences(
    JSON.stringify({
      organizationId: 'acme',
      trainingRuns: [{ id: 'incomplete-run', projectId: 'retail' }],
    }),
  )

  expect(restored.trainingRuns).toEqual([])
})
