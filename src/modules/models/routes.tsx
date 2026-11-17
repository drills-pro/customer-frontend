import { createRoute } from '@tanstack/react-router';
import { projectRoute } from '@/modules/projects';
import { textCrumb } from '@/shared/ui/crumbs';
import { ModelsPage } from '@/modules/models/pages/ModelsPage';

/** The project's model registry, one page under its project tabs. */
export const modelsRoute = createRoute({
  getParentRoute: () => projectRoute,
  path: 'models',
  staticData: { crumb: textCrumb('models.title') },
  component: ModelsPage,
});

export const modelRoutes = [modelsRoute] as const;
