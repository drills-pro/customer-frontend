import type { ReactNode } from 'react';
import { Box, Button, EmptyState, HStack, Skeleton, Stack, Table, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { Eye, Files } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useVersions, type DatasetSummary } from '@/modules/datasets/api';
import { LoadError } from '@/modules/datasets/components/LoadError';
import { formatBytes, versionCounts } from '@/modules/datasets/format';

/** Versions, newest first. `emptyAction` leads out of the empty state. */
export function VersionsTab({
  projectId,
  slug,
  dataset,
  denied,
  when,
  emptyAction,
}: {
  projectId: string;
  slug: string;
  dataset: DatasetSummary;
  denied: boolean;
  when: (iso: string) => string;
  emptyAction?: ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const { versions, error, isError, isPending, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = useVersions(
    projectId,
    dataset.id,
  );
  const number = new Intl.NumberFormat(i18n.resolvedLanguage);

  if (isError) return <LoadError title={t('datasets.versions.loadFailed')} error={error} onRetry={() => void refetch()} />;
  if (isPending || !versions) return <Skeleton h="40" />;
  if (!versions.length)
    return (
      <EmptyState.Root borderWidth="2px" borderColor="border" borderRadius="l3">
        <EmptyState.Content>
          <EmptyState.Indicator>
            <Files />
          </EmptyState.Indicator>
          <EmptyState.Title>{t('datasets.versions.empty.title')}</EmptyState.Title>
          <EmptyState.Description>{t('datasets.versions.empty.body')}</EmptyState.Description>
          {emptyAction}
        </EmptyState.Content>
      </EmptyState.Root>
    );

  return (
    <Stack gap="4">
      <Table.ScrollArea borderRadius="l3" borderWidth="1px" borderColor="border" bg="surface-raised">
        <Table.Root minW="3xl" variant="data">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{t('datasets.column.version')}</Table.ColumnHeader>
              <Table.ColumnHeader>{t('datasets.column.contents')}</Table.ColumnHeader>
              <Table.ColumnHeader>{t('datasets.column.created')}</Table.ColumnHeader>
              <Table.ColumnHeader aria-label={t('datasets.column.actions')} />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {versions.map((v) => {
              const counts = versionCounts(v.stats);
              const contents = [
                counts.rows !== undefined && t('datasets.rows', { count: counts.rows, formatted: number.format(counts.rows) }),
                counts.files && t('datasets.files', { count: counts.files, formatted: number.format(counts.files) }),
                counts.bytes && formatBytes(counts.bytes, i18n.resolvedLanguage),
              ].filter(Boolean);
              return (
                <Table.Row key={v.id} data-testid="version-row">
                  <Table.Cell fontWeight="semibold">{t('datasets.versionNumber', { number: v.number })}</Table.Cell>
                  <Table.Cell>{contents.join(' · ')}</Table.Cell>
                  <Table.Cell>{when(v.created_at)}</Table.Cell>
                  <Table.Cell>
                    <HStack justify="flex-end" gap="2">
                      <Button asChild size="xs">
                        <Link
                          to="/w/$slug/projects/$projectId/datasets/versions/$versionId"
                          params={{ slug, projectId, versionId: v.id }}
                          data-testid="version-preview-link"
                        >
                          <Eye />
                          {t('datasets.versions.preview')}
                        </Link>
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              );
            })}
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
      {denied && <Text color="fg.muted">{t('datasets.readOnly')}</Text>}
    </Stack>
  );
}
