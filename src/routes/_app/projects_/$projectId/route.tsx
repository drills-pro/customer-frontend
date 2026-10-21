import { createFileRoute, Outlet } from '@tanstack/react-router';
import * as React from 'react';

import { isNotFound } from '@/api/errors';
import { PageError, PageLoading } from '@/components/shared/query-states';
import { ProjectDetailContext, useDashboardLayout } from '@/features/dashboard/context';
import { useProject } from '@/features/projects/queries';
import { ProjectNotFound } from './-components/project-overview';

export const Route = createFileRoute('/_app/projects_/$projectId')({
  component: ProjectDetailRoute,
  staticData: {
    breadcrumb: ({ organizations, entities: { project } }) => {
      const organization = organizations.find((item) => item.id === project?.orgId);
      if (!project || !organization) return null;
      const overview = {
        to: '/projects/$projectId/overview',
        params: { projectId: project.id },
      };
      return {
        items: [
          { id: organization.id, label: organization.name, link: { to: '/' } },
          { id: project.id, label: project.name, link: overview },
        ],
        data: { organization, project },
      };
    },
  },
});

function ProjectDetailRoute() {
  const { projectId } = Route.useParams();
  const { preferences, updatePreferences, organizations } = useDashboardLayout();
  const { data, error, refetch } = useProject(projectId);
  const organization = organizations.find((item) => item.id === data?.project.orgId);

  // Opening a project by link makes its organization the current one.
  const projectOrgId = organization?.id;
  React.useEffect(() => {
    if (projectOrgId && preferences.organizationId !== projectOrgId) {
      updatePreferences({ organizationId: projectOrgId });
    }
  }, [preferences.organizationId, projectOrgId, updatePreferences]);

  if (error) {
    return isNotFound(error) ? (
      <ProjectNotFound projectId={projectId} />
    ) : (
      <PageError title="Could not load this project" error={error} onRetry={() => void refetch()} />
    );
  }
  if (!data) return <PageLoading />;
  // A project in an organization the user is not in reads as missing.
  if (!organization) return <ProjectNotFound projectId={projectId} />;

  return (
    <ProjectDetailContext.Provider value={{ ...data, organization }}>
      <Outlet />
    </ProjectDetailContext.Provider>
  );
}
