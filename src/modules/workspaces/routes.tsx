import { Suspense, useEffect } from 'react';
import { Skeleton } from '@chakra-ui/react';
import { createRoute, notFound, Outlet, redirect, useParams } from '@tanstack/react-router';
import { rootRoute } from '@/root-route';
import { getToken } from '@/shared/auth/manager';
import { textCrumb } from '@/shared/ui/crumbs';
import { NotFound } from '@/shared/ui/NotFound';
import { Splash } from '@/shared/ui/Splash';
import { meQuery, useMe } from '@/modules/workspaces/api';
import { AppShell } from '@/modules/workspaces/components/AppShell';
import { useWorkspace, WorkspaceProvider } from '@/modules/workspaces/context';
import { NewWorkspacePage } from '@/modules/workspaces/pages/NewWorkspacePage';
import { OverviewPage } from '@/modules/workspaces/pages/OverviewPage';
import { RestorePage } from '@/modules/workspaces/pages/RestorePage';
import { SettingsPage } from '@/modules/workspaces/pages/SettingsPage';

export const LAST_WORKSPACE = 'drills-workspace';
const lastWorkspace = () => {
  try {
    return localStorage.getItem(LAST_WORKSPACE);
  } catch {
    return null;
  }
};

/** Everything behind sign-in. Loads /v1/me once so the switcher and the guards below have it. */
export const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  beforeLoad: async ({ location }) => {
    if (!(await getToken())) throw redirect({ to: '/login', search: { return_to: location.pathname + location.searchStr } });
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(meQuery),
  pendingComponent: Splash,
  component: Outlet,
});

/** "/" only decides where to go: the last active workspace used, else the first active one, else a pending-deletion one (to restore it), else the wizard. */
export const homeRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  loader: async ({ context }) => {
    const { tenants } = await context.queryClient.ensureQueryData(meQuery);
    const target =
      tenants.find((t) => t.slug === lastWorkspace() && t.status === 'active') ?? tenants.find((t) => t.status === 'active') ?? tenants[0];
    throw redirect(target ? { to: '/w/$slug', params: { slug: target.slug }, replace: true } : { to: '/new', replace: true });
  },
});

export const newRoute = createRoute({ getParentRoute: () => appRoute, path: 'new', component: NewWorkspacePage });

function WorkspaceLayout() {
  const { slug } = useParams({ from: '/app/w/$slug' });
  const workspace = useMe().tenants.find((t) => t.slug === slug);
  useEffect(() => {
    if (!workspace) return;
    try {
      localStorage.setItem(LAST_WORKSPACE, workspace.slug);
    } catch {
      /* private mode */
    }
  }, [workspace]);

  if (!workspace) return <NotFound page />;
  // A workspace waiting for deletion accepts only "restore", so it gets that screen instead of the shell.
  if (workspace.status === 'pending_delete')
    return (
      <WorkspaceProvider value={workspace}>
        <RestorePage />
      </WorkspaceProvider>
    );
  return (
    <WorkspaceProvider value={workspace}>
      <AppShell>
        <Suspense fallback={<Skeleton h="64" />}>
          <Outlet />
        </Suspense>
      </AppShell>
    </WorkspaceProvider>
  );
}

function WorkspaceCrumb() {
  return useWorkspace().name;
}

/** The slug must be one of the user's workspaces (from /v1/me), else 404. An old link with the tenant id is redirected to the slug. */
export const workspaceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'w/$slug',
  loader: async ({ context, params, location }) => {
    const { tenants } = await context.queryClient.ensureQueryData(meQuery);
    if (tenants.some((t) => t.slug === params.slug)) return;
    const byId = tenants.find((t) => t.id === params.slug);
    if (!byId) throw notFound();
    throw redirect({ to: location.pathname.replace(`/w/${params.slug}`, `/w/${byId.slug}`), replace: true });
  },
  notFoundComponent: () => <NotFound page />,
  staticData: { crumb: WorkspaceCrumb },
  component: WorkspaceLayout,
});

export const overviewRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/',
  staticData: { crumb: textCrumb('nav.overview') },
  component: OverviewPage,
});
export const settingsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: 'settings',
  staticData: { crumb: textCrumb('shell.settings') },
  component: SettingsPage,
});
