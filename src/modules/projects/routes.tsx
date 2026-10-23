import { createRoute } from '@tanstack/react-router';
import { NewProjectPage } from '@/modules/projects/pages/NewProjectPage';
import { ProjectsPage } from '@/modules/projects/pages/ProjectsPage';
import { workspaceRoute } from '@/modules/workspaces';

export const projectsRoute = createRoute({ getParentRoute: () => workspaceRoute, path: 'projects', component: ProjectsPage });
export const newProjectRoute = createRoute({ getParentRoute: () => workspaceRoute, path: 'projects/new', component: NewProjectPage });
