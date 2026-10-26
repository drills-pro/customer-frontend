import { createRouter } from '@tanstack/react-router';
import { createQueryClient } from '@/shared/api/query';
import { manager } from '@/shared/auth/manager';
import { ErrorScreen } from '@/shared/ui/ErrorScreen';
import { callbackRoute, loginRoute, signupRoute } from '@/modules/auth';
import { datasetsRoute } from '@/modules/datasets';
import { membersRoute, inviteRoute } from '@/modules/members';
import { newProjectRoute, projectListRoute, projectsLayoutRoute } from '@/modules/projects';
import { appRoute, homeRoute, newRoute, overviewRoute, settingsRoute, workspaceRoute } from '@/modules/workspaces';
import { rootRoute } from '@/root-route';
import { showcaseHomeRoute, showcasePageRoute, showcaseRoute } from '@/showcase/routes';

const routeTree = rootRoute.addChildren([
  loginRoute,
  signupRoute,
  callbackRoute,
  appRoute.addChildren([
    homeRoute,
    newRoute,
    inviteRoute,
    workspaceRoute.addChildren([
      overviewRoute,
      projectsLayoutRoute.addChildren([projectListRoute, newProjectRoute, datasetsRoute]),
      membersRoute,
      settingsRoute,
    ]),
    showcaseRoute.addChildren([showcaseHomeRoute, showcasePageRoute]),
  ]),
]);

/** Any 401 drops the local session and sends the user to sign in, then back to where they were. */
export const queryClient = createQueryClient(() => {
  void manager.removeUser();
  const { pathname, searchStr } = router.state.location;
  void router.navigate({ to: '/login', search: { return_to: pathname + searchStr } });
});

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultErrorComponent: ErrorScreen,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
