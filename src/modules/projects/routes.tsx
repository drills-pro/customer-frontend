import { createRoute, type AnyRoute } from '@tanstack/react-router';
import { ProjectCrumb } from '@/modules/projects/components/ProjectCrumb';
import { NewProjectPage } from '@/modules/projects/pages/NewProjectPage';
import { ProjectLayout } from '@/modules/projects/pages/ProjectLayout';
import { ProjectOverviewPage } from '@/modules/projects/pages/ProjectOverviewPage';
import { ProjectsPage } from '@/modules/projects/pages/ProjectsPage';
import { workspaceRoute } from '@/modules/workspaces';
import { textCrumb } from '@/shared/ui/crumbs';

/** Parent of every /w/$slug/projects page; renders only its child (the default Outlet). */
export const projectsLayoutRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: 'projects',
  staticData: { crumb: textCrumb('projects.title') },
});
export const projectListRoute = createRoute({ getParentRoute: () => projectsLayoutRoute, path: '/', component: ProjectsPage });
export const newProjectRoute = createRoute({
  getParentRoute: () => projectsLayoutRoute,
  path: 'new',
  staticData: { crumb: textCrumb('newProject.title') },
  component: NewProjectPage,
});
/** One project: its header and section tabs around the section's page. */
export const projectRoute = createRoute({
  getParentRoute: () => projectsLayoutRoute,
  path: '$projectId',
  staticData: { crumb: ProjectCrumb },
  component: ProjectLayout,
});
export const projectOverviewRoute = createRoute({ getParentRoute: () => projectRoute, path: '/', component: ProjectOverviewPage });

/** The /projects subtree. Modules that hang pages under a project (datasets) pass their routes in, since projects cannot import them. */
export const projectsRoute = <T extends AnyRoute[]>(...more: T) =>
  projectsLayoutRoute.addChildren([projectListRoute, newProjectRoute, projectRoute.addChildren([projectOverviewRoute, ...more])]);
