const env = import.meta.env; // lint-ok

/** Build-time settings. Defaults are production; local overrides live in .env.local (see .env.example). */
export const cfg = {
  issuer: (env.VITE_ZITADEL_ISSUER ?? 'https://auth.drills.pro') as string,
  /** The Zitadel SPA application (code + PKCE, no secret, JWT access tokens). Required. */
  clientId: (env.VITE_ZITADEL_CLIENT_ID ?? '') as string,
  /** Project the API checks in `aud` (core-api config zitadel.project_id). */
  projectId: (env.VITE_ZITADEL_PROJECT_ID ?? '395337035725930916') as string,
  apiUrl: (env.VITE_API_URL ?? 'https://api.drills.pro') as string,
};
