import type { ReactNode } from 'react';
import { HStack, Link as ChakraLink, Table } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { ProjectSummary } from '@/modules/projects/api';
import { CopyId } from '@/modules/projects/components/CopyId';
import { ProjectMark } from '@/modules/projects/components/ProjectMark';
import { StatusBadge } from '@/modules/projects/components/StatusBadge';
import { useWorkspace } from '@/modules/workspaces';

/** The list view: one row per project. `created` formats a date; `menu` renders a project's actions. */
export function ProjectsTable({
  projects,
  created,
  menu,
}: {
  projects: ProjectSummary[];
  created: (iso: string) => string;
  menu: (project: ProjectSummary) => ReactNode;
}) {
  const { t } = useTranslation();
  const { slug } = useWorkspace();
  return (
    <Table.ScrollArea borderRadius="l3" borderWidth="1px" borderColor="border" bg="surface-raised">
      <Table.Root minW="3xl" variant="data">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{t('projects.column.name')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('projects.column.task')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('projects.column.status')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('projects.column.created')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('projects.column.id')}</Table.ColumnHeader>
            <Table.ColumnHeader w="12" aria-label={t('projects.column.actions')} />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {projects.map((p) => (
            <Table.Row key={p.id}>
              <Table.Cell>
                <HStack gap="3">
                  <ProjectMark taskType={p.task_type} />
                  <ChakraLink asChild fontWeight="semibold" maxW="72" truncate data-testid="project-datasets-link">
                    <Link to="/w/$slug/projects/$projectId/datasets" params={{ slug, projectId: p.id }}>
                      {p.name}
                    </Link>
                  </ChakraLink>
                </HStack>
              </Table.Cell>
              <Table.Cell>{t(`projects.taskType.${p.task_type}.label`)}</Table.Cell>
              <Table.Cell>
                <StatusBadge status={p.status} />
              </Table.Cell>
              <Table.Cell>{created(p.created_at)}</Table.Cell>
              <Table.Cell maxW="56">
                <CopyId id={p.id} />
              </Table.Cell>
              <Table.Cell>{menu(p)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
