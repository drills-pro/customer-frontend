import { createRoute, redirect } from '@tanstack/react-router';
import { getToken } from '@/shared/auth/manager';
import { CallbackPage, LoginPage, SignupPage } from '@/modules/auth/pages/AuthPages';
import { rootRoute } from '@/root-route';

/** Only in-app paths may be returned to. */
const validateSearch = (s: Record<string, unknown>): { return_to?: string } => ({
  return_to: typeof s.return_to === 'string' && s.return_to.startsWith('/') ? s.return_to : undefined,
});

/** A signed-in visitor has no business on login or signup. */
const signedOutOnly = async ({ search }: { search: { return_to?: string } }) => {
  if (await getToken()) throw redirect({ to: (search.return_to ?? '/') as '/' }); // ponytail: return_to is a validated in-app path, but not a typed route
};

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch,
  beforeLoad: signedOutOnly,
  component: LoginPage,
});
export const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  validateSearch,
  beforeLoad: signedOutOnly,
  component: SignupPage,
});
export const callbackRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/callback', component: CallbackPage });
