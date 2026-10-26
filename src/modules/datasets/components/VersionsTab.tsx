import { Badge, Box, Button, EmptyState, HStack, Skeleton, Stack, Table, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { Eye, Files } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { toaster } from '@/components/toaster';
import { usePublishVersion, useUnpublishDataset, useVersions, type DatasetSummary } from '@/modules/datasets/api';
import { LoadError } from '@/modules/datasets/components/LoadError';
import { datasetErrorKey } from '@/modules/datasets/errors';
import { formatBytes, versionCounts } from '@/modules/datasets/format';

/** Versions, newest first. Publishing picks the version training reads; there is at most one. */
export function VersionsTab({
  projectId,
  slug,
  dataset,
  denied,
  when,
}: {
  projectId: string;
  slug: string;
  dataset: DatasetSummary;
  denied: boolean;
  when: (iso: string) => string;
}) {
  const { t, i18n } = useTranslation();
  const { versions, error, isError, isPending, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = useVersions(
    projectId,
    dataset.id,
  );
  const publish = usePublishVersion(projectId);
  const unpublish = useUnpublishDataset(projectId);
  const locked = denied || dataset.deleted_at !== null || publish.isPending || unpublish.isPending;
  const number = new Intl.NumberFormat(i18n.resolvedLanguage);
  const fail = (title: string) => (e: unknown) => toaster.create({ type: 'error', title, description: t(datasetErrorKey(e)) });

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
              <Table.ColumnHeader>{t('datasets.column.published')}</Table.ColumnHeader>
              <Table.ColumnHeader aria-label={t('datasets.column.actions')} />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {versions.map((v) => {
              const counts = versionCounts(v.stats);
              const published = dataset.published_version_id === v.id;
              const contents = [
                counts.rows !== undefined && t('datasets.rows', { count: counts.rows, formatted: number.format(counts.rows) }),
                counts.files && t('datasets.files', { count: counts.files, formatted: number.format(counts.files) }),
                counts.bytes && formatBytes(counts.bytes, i18n.resolvedLanguage),
              ].filter(Boolean);
              return (
                <Table.Row key={v.id} data-testid="version-row" data-published={published}>
                  <Table.Cell fontWeight="semibold">{t('datasets.versionNumber', { number: v.number })}</Table.Cell>
                  <Table.Cell>{contents.join(' · ')}</Table.Cell>
                  <Table.Cell>{when(v.created_at)}</Table.Cell>
                  <Table.Cell>
                    {published ? (
                      <Badge colorPalette="success" variant="subtle" data-testid="version-published">
                        {t('datasets.published')}
                      </Badge>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell>
                    <HStack justify="flex-end" gap="2">
                      <Button asChild size="xs">
                        <Link
                          to="/w/$slug/projects/$projectId/datasets/$datasetId/versions/$versionId"
                          params={{ slug, projectId, datasetId: dataset.id, versionId: v.id }}
                          data-testid="version-preview-link"
                        >
                          <Eye />
                          {t('datasets.versions.preview')}
                        </Link>
                      </Button>
                      {published ? (
                        <Button
                          size="xs"
                          disabled={locked}
                          data-testid="version-unpublish"
                          onClick={() =>
                            unpublish.mutate(
                              { datasetId: dataset.id },
                              {
                                onSuccess: () => toaster.create({ type: 'success', title: t('datasets.toast.unpublished') }),
                                onError: fail(t('datasets.toast.publishFailed')),
                              },
                            )
                          }
                        >
                          {t('datasets.versions.unpublish')}
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          variant="solid"
                          disabled={locked}
                          data-testid="version-publish"
                          onClick={() =>
                            publish.mutate(
                              { datasetId: dataset.id, versionId: v.id },
                              {
                                onSuccess: () =>
                                  toaster.create({ type: 'success', title: t('datasets.toast.published', { number: v.number }) }),
                                onError: fail(t('datasets.toast.publishFailed')),
                              },
                            )
                          }
                        >
                          {t('datasets.versions.publish')}
                        </Button>
                      )}
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
