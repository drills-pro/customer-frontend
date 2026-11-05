import type { ReactNode } from 'react';
import { Card, DataList } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { VISIBILITY_INTERNAL, type ProjectDetail } from '@/modules/projects/api';
import { CopyId } from '@/modules/projects/components/CopyId';
import { StatusBadge } from '@/modules/projects/components/StatusBadge';

/** The project's facts: when it started, what it trains for, who can open it and its ID. */
export function ProjectInfoCard({ project }: { project: ProjectDetail }) {
  const { t, i18n } = useTranslation();
  const created = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' }).format(new Date(project.created_at));
  const rows: [string, ReactNode][] = [
    ['created', created],
    ['task', t(`projects.taskType.${project.task_type}.label`)],
    ['status', <StatusBadge key="status" status={project.status} />],
    ['visibility', t(`newProject.visibility.${project.visibility}`)],
  ];
  // Default access only applies to the workspace's members, so a private project has none.
  if (project.visibility === VISIBILITY_INTERNAL) rows.push(['access', t(`projects.overview.info.accessLevel.${project.default_access}`)]);
  rows.push(['id', <CopyId key="id" id={project.id} />]);

  return (
    <Card.Root variant="outline" data-testid="project-info">
      <Card.Header>
        <Card.Title as="h2" textStyle="body" fontWeight="semibold">
          {t('projects.overview.info.title')}
        </Card.Title>
      </Card.Header>
      <Card.Body>
        <DataList.Root orientation="horizontal" divideY="1px">
          {rows.map(([key, value]) => (
            <DataList.Item key={key} pt="4" _first={{ pt: '0' }}>
              <DataList.ItemLabel>{t(`projects.overview.info.${key}`)}</DataList.ItemLabel>
              <DataList.ItemValue minW="0">{value}</DataList.ItemValue>
            </DataList.Item>
          ))}
        </DataList.Root>
      </Card.Body>
    </Card.Root>
  );
}
