import type { ReactNode } from 'react';
import { Box, Card, Flex, HStack, Link as ChakraLink, SimpleGrid, Stat, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { ProjectListItem } from '@/modules/projects/api';
import { COUNT_COLUMNS, countText } from '@/modules/projects/columns';
import { ProjectMark } from '@/modules/projects/components/ProjectMark';
import { StatusBadge } from '@/modules/projects/components/StatusBadge';
import { useWorkspace } from '@/modules/workspaces';

/** One project in the grid: its status, how many datasets, models and deployments it has. `menu` is its actions. */
export function ProjectCard({ project, created, menu }: { project: ProjectListItem; created: string; menu: ReactNode }) {
  const { t } = useTranslation();
  const { slug } = useWorkspace();
  return (
    <Card.Root variant="outline" overflow="hidden" _hover={{ borderColor: 'fg' }}>
      <Flex align="flex-start" gap="3" px="5" pt="5">
        <ProjectMark taskType={project.task_type} />
        <Box flex="1" minW="0">
          <Card.Title as="h2" textStyle="body" fontWeight="semibold" truncate>
            <ChakraLink asChild data-testid="project-link">
              <Link to="/w/$slug/projects/$projectId" params={{ slug, projectId: project.id }}>
                {project.name}
              </Link>
            </ChakraLink>
          </Card.Title>
          <Text textStyle="body-sm" color="fg.muted">
            {t(`projects.taskType.${project.task_type}.label`)}
          </Text>
        </Box>
        {menu}
      </Flex>
      <HStack px="5" pt="4">
        <StatusBadge status={project.status} />
      </HStack>
      <SimpleGrid columns={3} gap="3" mx="5" mt="4" py="4" borderTopWidth="1px" borderColor="border">
        {COUNT_COLUMNS.map((c) => (
          <Stat.Root key={c} gap="0.5">
            <Stat.ValueText textStyle="h3" data-testid={`project-card-count-${c}`}>
              {countText(project[c])}
            </Stat.ValueText>
            <Stat.Label>{t(`projects.column.${c}`)}</Stat.Label>
          </Stat.Root>
        ))}
      </SimpleGrid>
      <Flex mt="auto" mx="5" align="center" gap="3" borderTopWidth="1px" borderColor="border" py="3">
        <Text textStyle="body-sm" color="fg.muted" truncate>
          {t('projects.createdOn', { date: created })}
        </Text>
      </Flex>
    </Card.Root>
  );
}
