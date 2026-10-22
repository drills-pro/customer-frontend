import { test as base, expect } from '@playwright/test';
import { installApi, newState, type ApiState } from './mock-api';

/** The OIDC session the app keeps in sessionStorage after a sign-in (client id comes from the webServer env). */
const SESSION_KEY = 'oidc.user:https://auth.drills.pro:e2e-client';

export const test = base.extend<{ api: ApiState; signedIn: boolean }>({
  signedIn: [true, { option: true }],
  // A fresh fake backend per test; change it before the first goto.
  api: [
    async ({ page }, run) => {
      const state = newState();
      await installApi(page, state);
      await run(state);
    },
    { auto: true },
  ],
  page: async ({ page, signedIn }, run) => {
    await page.addInitScript(
      ([key, signed]) => {
        localStorage.setItem('drills-lang', 'en');
        if (!signed) return;
        const user = {
          access_token: 'fake',
          token_type: 'Bearer',
          scope: 'openid',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          profile: { sub: 'me', iss: 'x', aud: 'x', exp: 9999999999, iat: 1, email: 'dev@example.com', name: 'Dev User' },
        };
        sessionStorage.setItem(key, JSON.stringify(user));
      },
      [SESSION_KEY, signedIn] as const,
    );
    await run(page);
  },
});

export { expect };
