import { Box, Button, EmptyState, Flex, Heading, Skeleton, Stack, Text } from '@chakra-ui/react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Database } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useDatasets, useWriteDenied } from '@/modules/datasets/api';
import { CreateDatasetDialog } from '@/modules/datasets/components/CreateDatasetDialog';
import { DatasetsTable } from '@/modules/datasets/components/DatasetsTable';
import { LoadError } from '@/modules/datasets/components/LoadError';
import { useWorkspace } from '@/modules/workspaces';

/** The datasets of one project. */
export function DatasetsPage() {
  const { t } = useTranslation();
  const { slug } = useWorkspace();
  const { projectId } = useParams({ from: '/app/w/$slug/projects/$projectId/datasets/' });
  const navigate = useNavigate();
  const denied = useWriteDenied(projectId);
  const { datasets, error, isError, isPending, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = useDatasets(projectId);
  const open = (datasetId: string) =>
    void navigate({ to: '/w/$slug/projects/$projectId/datasets/$datasetId', params: { slug, projectId, datasetId } });
  const create = <CreateDatasetDialog projectId={projectId} disabled={denied} onCreated={open} />;

  return (
    <Stack gap="6">
      <Box>
        <Button asChild variant="ghost" size="sm" mb="2">
          <Link to="/w/$slug/projects" params={{ slug }}>
            <ArrowLeft />
            {t('datasets.backToProjects')}
          </Link>
        </Button>
        <Flex align="end" justify="space-between" gap="4" wrap="wrap">
          <Box>
            <Heading as="h1" textStyle="h1">
              {t('datasets.title')}
            </Heading>
            <Text mt="1" color="fg.muted">
              {t('datasets.subtitle')}
            </Text>
          </Box>
          {create}
        </Flex>
      </Box>
      {denied && (
        <Text color="fg.muted" data-testid="datasets-read-only">
          {t('datasets.readOnly')}
        </Text>
      )}
      {isError ? (
        <LoadError title={t('datasets.loadFailed')} error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <Skeleton h="48" />
      ) : !datasets?.length ? (
        <EmptyState.Root borderWidth="2px" borderColor="border" borderRadius="l3">
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Database />
            </EmptyState.Indicator>
            <EmptyState.Title>{t('datasets.empty.title')}</EmptyState.Title>
            <EmptyState.Description>{t('datasets.empty.body')}</EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <Stack gap="4">
          <DatasetsTable projectId={projectId} slug={slug} datasets={datasets} denied={denied} />
          {hasNextPage && (
            <Box>
              <Button onClick={() => void fetchNextPage()} loading={isFetchingNextPage} data-testid="datasets-load-more">
                {t('datasets.loadMore')}
              </Button>
            </Box>
          )}
        </Stack>
      )}
    </Stack>
  );
}
