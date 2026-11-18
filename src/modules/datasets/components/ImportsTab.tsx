import { Box, Button, EmptyState, Skeleton, Stack, Table } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { Upload } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useImports } from '@/modules/datasets/api';
import { ImportStatusBadge } from '@/modules/datasets/components/ImportStatusBadge';
import { LoadError } from '@/modules/datasets/components/LoadError';
import { ImportStatus } from '@/modules/datasets/constants';

/** Imports, newest first, each with a link to its page. */
export function ImportsTab({
  projectId,
  slug,
  datasetId,
  when,
}: {
  projectId: string;
  slug: string;
  datasetId: string;
  when: (iso: string) => string;
}) {
  const { t } = useTranslation();
  const { imports, error, isError, isPending, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = useImports(projectId, datasetId);

  if (isError) return <LoadError title={t('datasets.imports.loadFailed')} error={error} onRetry={() => void refetch()} />;
  if (isPending || !imports) return <Skeleton h="40" />;
  if (!imports.length)
    return (
      <EmptyState.Root borderWidth="2px" borderColor="border" borderRadius="l3">
        <EmptyState.Content>
          <EmptyState.Indicator>
            <Upload />
          </EmptyState.Indicator>
          <EmptyState.Title>{t('datasets.imports.empty.title')}</EmptyState.Title>
          <EmptyState.Description>{t('datasets.imports.empty.body')}</EmptyState.Description>
        </EmptyState.Content>
      </EmptyState.Root>
    );

  return (
    <Stack gap="4">
      <Table.ScrollArea borderRadius="l3" borderWidth="1px" borderColor="border" bg="surface-raised">
        <Table.Root minW="2xl" variant="data">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{t('datasets.column.status')}</Table.ColumnHeader>
              <Table.ColumnHeader>{t('datasets.column.source')}</Table.ColumnHeader>
              <Table.ColumnHeader>{t('datasets.column.created')}</Table.ColumnHeader>
              <Table.ColumnHeader aria-label={t('datasets.column.actions')} />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {imports.map((i) => (
              <Table.Row key={i.id} data-testid="import-row">
                <Table.Cell>{i.status === ImportStatus.Failed ? <ImportStatusBadge status={i.status} /> : '-'}</Table.Cell>
                <Table.Cell>{t(`datasets.source.${i.source}`)}</Table.Cell>
                <Table.Cell>{when(i.created_at)}</Table.Cell>
                <Table.Cell textAlign="end">
                  <Button asChild size="xs">
                    <Link
                      to="/w/$slug/projects/$projectId/datasets/$datasetId/imports/$importId"
                      params={{ slug, projectId, datasetId, importId: i.id }}
                      data-testid="import-link"
                    >
                      {t('datasets.imports.open')}
                    </Link>
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
      {hasNextPage && (
        <Box>
          <Button onClick={() => void fetchNextPage()} loading={isFetchingNextPage}>
            {t('datasets.loadMore')}
          </Button>
        </Box>
      )}
    </Stack>
  );
}
