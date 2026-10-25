import type { ReactNode } from 'react';
import { Box, Card, Flex, HStack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { ProjectSummary } from '@/modules/projects/api';
import { CopyId } from '@/modules/projects/components/CopyId';
import { ProjectMark } from '@/modules/projects/components/ProjectMark';
import { StatusBadge } from '@/modules/projects/components/StatusBadge';

/** One project in the grid; `menu` is its actions. */
export function ProjectCard({ project, created, menu }: { project: ProjectSummary; created: string; menu: ReactNode }) {
  const { t } = useTranslation();
  return (
    <Card.Root variant="outline" overflow="hidden" _hover={{ borderColor: 'fg' }}>
      <Flex align="flex-start" gap="3" px="5" pt="5">
        <ProjectMark taskType={project.task_type} />
        <Box flex="1" minW="0">
          <Card.Title as="h2" textStyle="body" fontWeight="semibold" truncate>
            {project.name}
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
      <Flex mt="4" align="center" justify="space-between" gap="3" borderTopWidth="1px" borderColor="border" px="5" py="3">
        <Box minW="0" flex="1">
          <CopyId id={project.id} />
        </Box>
        <Text textStyle="body-sm" color="fg.muted" whiteSpace="nowrap">
          {t('projects.createdOn', { date: created })}
        </Text>
      </Flex>
    </Card.Root>
  );
}
