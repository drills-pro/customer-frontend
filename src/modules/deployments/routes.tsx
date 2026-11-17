import { createRoute } from '@tanstack/react-router';
import { projectRoute } from '@/modules/projects';
import { textCrumb } from '@/shared/ui/crumbs';
import { DeploymentPage } from '@/modules/deployments/pages/DeploymentPage';
import { DeploymentsPage } from '@/modules/deployments/pages/DeploymentsPage';

/** Parent of the project's deployment pages; renders only its child. */
export const deploymentsLayoutRoute = createRoute({
  getParentRoute: () => projectRoute,
  path: 'deployments',
  staticData: { crumb: textCrumb('deployments.title') },
});
export const deploymentsListRoute = createRoute({ getParentRoute: () => deploymentsLayoutRoute, path: '/', component: DeploymentsPage });
export const deploymentRoute = createRoute({
  getParentRoute: () => deploymentsLayoutRoute,
  path: '$deploymentId',
  staticData: { crumb: textCrumb('deployments.detail.title') },
  component: DeploymentPage,
});

export const deploymentRoutes = [deploymentsLayoutRoute.addChildren([deploymentsListRoute, deploymentRoute])] as const;
