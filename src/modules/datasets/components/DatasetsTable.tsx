import { Badge, HStack, Link as ChakraLink, Table, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useImports, useVersions, type DatasetSummary } from '@/modules/datasets/api';
import { DatasetMenu } from '@/modules/datasets/components/DatasetMenu';
import { ImportStatusBadge } from '@/modules/datasets/components/ImportStatusBadge';
import { taskLabel } from '@/modules/datasets/format';

/** The newest import's status; one small request per row, shared with the dataset page's own lists. */
function LatestImport({ projectId, datasetId }: { projectId: string; datasetId: string }) {
  const { t } = useTranslation();
  const { imports, isPending } = useImports(projectId, datasetId, 1);
  const latest = imports?.[0];
  if (isPending) return null;
  return latest ? <ImportStatusBadge status={latest.status} /> : <Text color="fg.muted">{t('datasets.none')}</Text>;
}

/** The published version's number, found in the version list the dataset page uses too. */
function Published({ projectId, dataset }: { projectId: string; dataset: DatasetSummary }) {
  const { t } = useTranslation();
  const { versions } = useVersions(projectId, dataset.id);
  if (!dataset.published_version_id) return <Text color="fg.muted">{t('datasets.notPublished')}</Text>;
  const number = versions?.find((v) => v.id === dataset.published_version_id)?.number;
  return (
    <Badge colorPalette="success" variant="subtle">
      {number === undefined ? t('datasets.published') : t('datasets.versionNumber', { number })}
    </Badge>
  );
}

/** One row per dataset: name (the way in), task, published version, latest import, and its menu. */
export function DatasetsTable({
  projectId,
  slug,
  datasets,
  denied,
}: {
  projectId: string;
  slug: string;
  datasets: DatasetSummary[];
  denied: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Table.ScrollArea borderRadius="l3" borderWidth="1px" borderColor="border" bg="surface-raised">
      <Table.Root minW="3xl" variant="data">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{t('datasets.column.name')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('datasets.column.task')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('datasets.column.published')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('datasets.column.latestImport')}</Table.ColumnHeader>
            <Table.ColumnHeader w="12" aria-label={t('datasets.column.actions')} />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {datasets.map((d) => (
            <Table.Row key={d.id} data-testid="dataset-row">
              <Table.Cell>
                <HStack gap="2">
                  <ChakraLink asChild fontWeight="semibold" maxW="72" truncate>
                    <Link to="/w/$slug/projects/$projectId/datasets/$datasetId" params={{ slug, projectId, datasetId: d.id }}>
                      {d.name}
                    </Link>
                  </ChakraLink>
                  {d.deleted_at && (
                    <Badge colorPalette="danger" variant="subtle">
                      {t('datasets.deleted')}
                    </Badge>
                  )}
                </HStack>
              </Table.Cell>
              <Table.Cell>{d.task_type ? taskLabel(t, d.task_type) : <Text color="fg.muted">{t('datasets.noTask')}</Text>}</Table.Cell>
              <Table.Cell>
                <Published projectId={projectId} dataset={d} />
              </Table.Cell>
              <Table.Cell>
                <LatestImport projectId={projectId} datasetId={d.id} />
              </Table.Cell>
              <Table.Cell>
                <DatasetMenu projectId={projectId} dataset={d} disabled={denied} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
