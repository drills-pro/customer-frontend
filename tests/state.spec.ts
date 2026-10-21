import { expect, test } from '@playwright/test';
import { DASHBOARD_STORAGE_KEY, defaultPreferences, restorePreferences } from '../src/features/dashboard';

test('dashboard preferences recover from invalid storage', () => {
  expect(restorePreferences(null)).toEqual(defaultPreferences);
  expect(restorePreferences('{broken')).toEqual(defaultPreferences);
  expect(restorePreferences('[]')).toEqual(defaultPreferences);
  expect(restorePreferences(JSON.stringify({ organizationId: 42 }))).toEqual(defaultPreferences);
});

test('dashboard preferences retain valid persisted values', () => {
  const restored = restorePreferences(
    JSON.stringify({
      organizationId: 'northwind',
      onboardingDismissed: true,
      theme: 'dark',
    }),
  );
  expect(restored).toEqual({
    organizationId: 'northwind',
    onboardingDismissed: true,
    theme: 'dark',
  });
  expect(restorePreferences(JSON.stringify({ theme: 'sepia' })).theme).toBe('light');
  expect(DASHBOARD_STORAGE_KEY).toBe('drills-dashboard-v1');
});

test('one invalid field does not cost the others, and old fields are ignored', () => {
  const restored = restorePreferences(
    JSON.stringify({
      organizationId: 'northwind',
      onboardingDismissed: 'yes',
      theme: 'dark',
      // Written by versions that kept workspace records in the browser.
      trainingRuns: [{ id: 'incomplete-run', projectId: 'retail' }],
      createdProjects: [],
    }),
  );
  expect(restored).toEqual({
    organizationId: 'northwind',
    onboardingDismissed: false,
    theme: 'dark',
  });
});
