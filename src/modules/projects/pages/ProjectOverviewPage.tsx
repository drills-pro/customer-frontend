import { SimpleGrid, Stack } from '@chakra-ui/react';
import { useParams } from '@tanstack/react-router';
import { useProjectDetail } from '@/modules/projects/api';
import { PipelineCard } from '@/modules/projects/components/PipelineCard';
import { ProjectInfoCard } from '@/modules/projects/components/ProjectInfoCard';
import { TeamCard } from '@/modules/projects/components/TeamCard';
import { useWorkspace } from '@/modules/workspaces';

/** The project's front page: how far its pipeline has come, its facts and its team. */
export function ProjectOverviewPage() {
  const { id: workspaceId } = useWorkspace();
  const { projectId } = useParams({ from: '/app/w/$slug/projects/$projectId/' });
  const project = useProjectDetail(workspaceId, projectId);

  return (
    <Stack gap="6">
      <PipelineCard projectId={projectId} />
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6" alignItems="start">
        <ProjectInfoCard project={project} />
        <TeamCard project={project} />
      </SimpleGrid>
    </Stack>
  );
}
