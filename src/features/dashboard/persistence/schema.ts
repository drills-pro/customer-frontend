import { z } from 'zod';

import { themePreferences } from '../domain/types';

/**
 * Everything the app itself keeps in browser storage: the user's choices about
 * the interface. Workspace records are not here; they belong to the API.
 */
export const preferencesSchema = z.object({
  organizationId: z.string(),
  onboardingDismissed: z.boolean(),
  theme: z.enum(themePreferences),
});
