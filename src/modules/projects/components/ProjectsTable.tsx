import type { ReactNode } from 'react';
import { HStack, Link as ChakraLink, Table } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { ProjectListItem, ProjectSummary } from '@/modules/projects/api';
import { COUNT_COLUMNS, countText, type ProjectColumn, type useProjectColumns } from '@/modules/projects/columns';
import { ProjectColumnsMenu } from '@/modules/projects/components/ProjectColumnsMenu';
import { CopyId } from '@/modules/projects/components/CopyId';
import { ProjectMark } from '@/modules/projects/components/ProjectMark';
import { StatusBadge } from '@/modules/projects/components/StatusBadge';
import { useWorkspace } from '@/modules/workspaces';

/** The list view: one row per project, without the columns the header's Columns menu hides. `created` formats a date; `menu` renders a
 * project's actions. */
export function ProjectsTable({
  projects,
  columns,
  created,
  menu,
}: {
  projects: ProjectListItem[];
  columns: ReturnType<typeof useProjectColumns>;
  created: (iso: string) => string;
  menu: (project: ProjectSummary) => ReactNode;
}) {
  const { t } = useTranslation();
  const { slug } = useWorkspace();
  const show = (c: ProjectColumn) => !columns.hidden.includes(c);
  const header = (c: ProjectColumn) =>
    show(c) && (
      <Table.ColumnHeader key={c} data-testid={`projects-table-col-${c}`}>
        {t(`projects.column.${c}`)}
      </Table.ColumnHeader>
    );
  return (
    <Table.ScrollArea borderRadius="l3" borderWidth="1px" borderColor="border" bg="surface-raised">
      <Table.Root minW="3xl" variant="data">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{t('projects.column.name')}</Table.ColumnHeader>
            {header('task')}
            {header('status')}
            {COUNT_COLUMNS.map(header)}
            {header('created')}
            {header('id')}
            <Table.ColumnHeader w="12" aria-label={t('projects.column.actions')}>
              <ProjectColumnsMenu hidden={columns.hidden} isDefault={columns.isDefault} onToggle={columns.toggle} onReset={columns.reset} />
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {projects.map((p) => (
            <Table.Row key={p.id}>
              <Table.Cell>
                <HStack gap="3">
                  <ProjectMark taskType={p.task_type} />
                  <ChakraLink asChild fontWeight="semibold" maxW="72" truncate data-testid="project-link">
                    <Link to="/w/$slug/projects/$projectId" params={{ slug, projectId: p.id }}>
                      {p.name}
                    </Link>
                  </ChakraLink>
                </HStack>
              </Table.Cell>
              {show('task') && <Table.Cell>{t(`projects.taskType.${p.task_type}.label`)}</Table.Cell>}
              {show('status') && (
                <Table.Cell>
                  <StatusBadge status={p.status} />
                </Table.Cell>
              )}
              {COUNT_COLUMNS.map(
                (c) =>
                  show(c) && (
                    <Table.Cell key={c} data-testid={`projects-count-${c}`}>
                      {countText(p[c])}
                    </Table.Cell>
                  ),
              )}
              {show('created') && <Table.Cell>{created(p.created_at)}</Table.Cell>}
              {show('id') && (
                <Table.Cell maxW="40">
                  <CopyId id={p.id} />
                </Table.Cell>
              )}
              <Table.Cell>{menu(p)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
