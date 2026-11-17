import { createRoute } from '@tanstack/react-router';
import { projectRoute } from '@/modules/projects';
import { textCrumb } from '@/shared/ui/crumbs';
import { DeploymentPage } from '@/modules/deployments/pages/DeploymentPage';
import { DeploymentsPage } from '@/modules/deployments/pages/DeploymentsPage';

/** Parent of every /w/$slug/projects/$projectId/deployments page, so "Deployments" sits in the breadcrumb above each; renders only its child. */
export const deploymentsLayoutRoute = createRoute({
  getParentRoute: () => projectRoute,
  path: 'deployments',
  staticData: { crumb: textCrumb('deployments.title') },
});
export const deploymentListRoute = createRoute({ getParentRoute: () => deploymentsLayoutRoute, path: '/', component: DeploymentsPage });
export const deploymentRoute = createRoute({
  getParentRoute: () => deploymentsLayoutRoute,
  path: '$deploymentId',
  staticData: { crumb: textCrumb('deployments.detail.title') },
  component: DeploymentPage,
});

/** The whole subtree, for the router to mount under the project route. */
export const deploymentsRoutes = [deploymentsLayoutRoute.addChildren([deploymentListRoute, deploymentRoute])] as const;
