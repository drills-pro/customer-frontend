import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { ErrorScreen } from '@/shared/ui/ErrorScreen';
import { NotFound } from '@/shared/ui/NotFound';
import { Splash } from '@/shared/ui/Splash';

export interface RouterContext {
  queryClient: QueryClient;
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  notFoundComponent: () => <NotFound page />,
  pendingComponent: Splash,
  errorComponent: ErrorScreen,
});
