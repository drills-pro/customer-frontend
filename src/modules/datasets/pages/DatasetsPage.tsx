import { useState, type ReactNode } from 'react';
import { Box, Button, EmptyState, Heading, Skeleton, Stack, Text } from '@chakra-ui/react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Database, Plus } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useDatasets, useWriteDenied } from '@/modules/datasets/api';
import { CreateDatasetDialog } from '@/modules/datasets/components/CreateDatasetDialog';
import { DatasetsTable } from '@/modules/datasets/components/DatasetsTable';
import { LoadError } from '@/modules/datasets/components/LoadError';
import { useProjectDetail } from '@/modules/projects';
import { useWorkspace } from '@/modules/workspaces';

/** The datasets of one project. */
export function DatasetsPage() {
  const { t } = useTranslation();
  const workspace = useWorkspace();
  const { slug } = workspace;
  const { projectId } = useParams({ from: '/app/w/$slug/projects/$projectId/datasets/' });
  const project = useProjectDetail(workspace.id, projectId);
  const navigate = useNavigate();
  const denied = useWriteDenied(projectId);
  const { datasets, error, isError, isPending, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = useDatasets(projectId);
  const open = (datasetId: string) =>
    void navigate({ to: '/w/$slug/projects/$projectId/datasets/$datasetId', params: { slug, projectId, datasetId } });
  // The dialog lives here, not in the card: creating the first dataset swaps the empty card for the list, and a dialog inside
  // the card would unmount mid-create.
  const [creating, setCreating] = useState(false);
  const addCard = (title: string, body: string) => (
    <AddDatasetCard title={title} body={body}>
      <Button disabled={denied} onClick={() => setCreating(true)} data-testid="datasets-create-open">
        <Plus />
        {t('datasets.create.open')}
      </Button>
    </AddDatasetCard>
  );

  return (
    <Stack gap="6">
      <CreateDatasetDialog
        projectId={projectId}
        slug={slug}
        task={project.task_type}
        open={creating}
        onOpenChange={setCreating}
        onCreated={open}
      />
      <Box>
        <Heading as="h2" textStyle="h2">
          {t('datasets.title')}
        </Heading>
        <Text mt="1" color="fg.muted">
          {t('datasets.subtitle')}
        </Text>
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
        addCard(t('datasets.empty.title'), t('datasets.empty.body'))
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
          {addCard(t('datasets.more.title'), t('datasets.more.body'))}
        </Stack>
      )}
    </Stack>
  );
}

/** The dashed card that offers a new dataset: the empty state, and the last thing under a list that has some. */
function AddDatasetCard({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <EmptyState.Root
      borderWidth="2px"
      borderStyle="dashed"
      borderColor="border.emphasized"
      borderRadius="l3"
      data-testid="datasets-add-card"
    >
      <EmptyState.Content>
        <EmptyState.Indicator>
          <Database />
        </EmptyState.Indicator>
        <EmptyState.Title>{title}</EmptyState.Title>
        <EmptyState.Description>{body}</EmptyState.Description>
        {children}
      </EmptyState.Content>
    </EmptyState.Root>
  );
}
