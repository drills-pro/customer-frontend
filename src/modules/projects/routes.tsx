import { createRoute } from '@tanstack/react-router';
import { NewProjectPage } from '@/modules/projects/pages/NewProjectPage';
import { ProjectsPage } from '@/modules/projects/pages/ProjectsPage';
import { workspaceRoute } from '@/modules/workspaces';

/** Parent of every /w/$slug/projects page; renders only its child (the default Outlet). */
export const projectsLayoutRoute = createRoute({ getParentRoute: () => workspaceRoute, path: 'projects' });
export const projectListRoute = createRoute({ getParentRoute: () => projectsLayoutRoute, path: '/', component: ProjectsPage });
export const newProjectRoute = createRoute({ getParentRoute: () => projectsLayoutRoute, path: 'new', component: NewProjectPage });
