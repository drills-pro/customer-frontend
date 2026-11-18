import { createRoute } from '@tanstack/react-router';
import { TrashPage } from '@/modules/trash/pages/TrashPage';
import { workspaceRoute } from '@/modules/workspaces';
import { textCrumb } from '@/shared/ui/crumbs';

export const trashRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: 'trash',
  staticData: { crumb: textCrumb('trash.title') },
  component: TrashPage,
});
