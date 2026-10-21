import { defaultPreferences } from '@/features/dashboard/data';
import type { DashboardPreferences } from '@/features/dashboard/data';
import { preferencesSchema } from './schema';

/**
 * Turns the raw stored string into preferences. Each field is restored on its
 * own, so a missing or invalid one falls back to its default rather than
 * discarding the others. Fields written by older versions are ignored.
 */
export function restorePreferences(value: string | null): DashboardPreferences {
  if (!value) return defaultPreferences;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return defaultPreferences;
    }
    const saved = parsed as Record<string, unknown>;
    const restored = { ...defaultPreferences };
    for (const key of Object.keys(preferencesSchema.shape) as Array<keyof DashboardPreferences>) {
      const result = preferencesSchema.shape[key].safeParse(saved[key]);
      if (result.success) Object.assign(restored, { [key]: result.data });
    }
    return restored;
  } catch {
    return defaultPreferences;
  }
}
