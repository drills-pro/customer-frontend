import { DASHBOARD_STORAGE_KEY, defaultPreferences } from '@/features/dashboard/data';
import type { DashboardPreferences } from '@/features/dashboard/data';
import { restorePreferences } from './restore';

export type LoadPreferencesResult = {
  preferences: DashboardPreferences;
  available: boolean;
};

/**
 * Reads persisted preferences. Privacy settings can make `localStorage`
 * access itself throw a `SecurityError`, so the read is guarded and falls
 * back to the defaults with `available: false` instead of breaking hydration.
 */
export function loadPreferences(): LoadPreferencesResult {
  try {
    const raw = window.localStorage.getItem(DASHBOARD_STORAGE_KEY);
    return { preferences: restorePreferences(raw), available: true };
  } catch {
    return { preferences: defaultPreferences, available: false };
  }
}

/**
 * Writes preferences, returning whether the write succeeded. A quota error or
 * blocked storage leaves the in-memory state untouched and usable.
 */
export function savePreferences(value: DashboardPreferences): boolean {
  try {
    window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
