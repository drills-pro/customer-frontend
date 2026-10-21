import { Box, Button, SimpleGrid, Text } from '@chakra-ui/react';
import { FolderKanban } from 'lucide-react';

import { EmptyNotice } from '@/components/shared/empty-notice';
import { SectionAction, SectionCard } from '@/components/shared/section-card';
import { toDashboardProject } from '@/features/dashboard/format';
import { useDashboardSummary } from '@/features/dashboard/queries';
import { unavailable } from '@/lib/unavailable';
import { CardError, CardLoading } from './card-states';

export function YourProjectsCard() {
  const { data, error, isPending, refetch } = useDashboardSummary();
  const orgProjects = (data?.projects ?? []).map((project) => toDashboardProject(project));

  return (
    <SectionCard title="Your projects" action={<SectionAction onClick={() => unavailable('All projects')}>View all</SectionAction>}>
      {isPending ? (
        <CardLoading rows={2} />
      ) : error ? (
        <CardError title="Could not load projects" error={error} onRetry={() => void refetch()} />
      ) : orgProjects.length ? (
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3" p="4">
          {orgProjects.slice(0, 4).map((project) => (
            <Button
              key={project.id}
              type="button"
              variant="outline"
              onClick={() => unavailable(project.name)}
              h="auto"
              w="full"
              justifyContent="flex-start"
              alignItems="flex-start"
              gap="3"
              p="3"
              textAlign="start"
              whiteSpace="normal"
              fontWeight="normal"
              boxShadow="none"
              _hover={{ borderColor: 'brand-text', bg: 'brand.subtle' }}
            >
              <Box
                boxSize="6"
                flexShrink={0}
                rounded="l1"
                // The project's own color, from the API.
                bg={project.color}
              />
              <Box minW="0">
                <Text fontWeight="medium">{project.name}</Text>
                <Text textStyle="body-sm" color="fg.muted">
                  {project.task} · {project.models} models
                </Text>
                <Text textStyle="body-sm" color="fg.muted">
                  Updated {project.updated}
                </Text>
              </Box>
            </Button>
          ))}
        </SimpleGrid>
      ) : (
        <EmptyNotice
          icon={<FolderKanban />}
          title="Create your first project"
          description="New projects in this workspace will appear here."
          minH="36"
        />
      )}
    </SectionCard>
  );
}
