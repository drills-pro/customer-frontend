import { useParams } from '@tanstack/react-router';
import { useProject } from '@/modules/projects/api';
import { useWorkspace } from '@/modules/workspaces';
import { CrumbName } from '@/shared/ui/crumbs';

/** The project's name in the breadcrumb; the layout below loads the same query. */
export function ProjectCrumb() {
  const { id: workspaceId } = useWorkspace();
  const { projectId } = useParams({ from: '/app/w/$slug/projects/$projectId' });
  const { data, isPending } = useProject(workspaceId, projectId);
  return <CrumbName name={data?.name} pending={isPending} />;
}
