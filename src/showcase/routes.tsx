import { lazy, Suspense } from 'react';
import { Skeleton } from '@chakra-ui/react';
import { createRoute, redirect, useParams } from '@tanstack/react-router';
import { appRoute } from '@/modules/workspaces';

// The gallery pulls in every demo page (and recharts): load it on first visit only.
const Showcase = lazy(() => import('./Showcase').then((m) => ({ default: m.Showcase })));

function ShowcasePage() {
  const { page } = useParams({ from: '/app/showcase/$page' });
  return (
    <Suspense fallback={<Skeleton h="100vh" />}>
      <Showcase page={page} />
    </Suspense>
  );
}

export const showcaseRoute = createRoute({ getParentRoute: () => appRoute, path: 'showcase' });
export const showcaseHomeRoute = createRoute({
  getParentRoute: () => showcaseRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/showcase/$page', params: { page: 'overview' }, replace: true });
  },
});
export const showcasePageRoute = createRoute({ getParentRoute: () => showcaseRoute, path: '$page', component: ShowcasePage });
