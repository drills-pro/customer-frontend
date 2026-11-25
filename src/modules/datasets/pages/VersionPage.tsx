import { useState } from 'react';
import { Box, Heading, Skeleton, Stack, Text } from '@chakra-ui/react';
import { useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useProjectDataset, useVersionPreview, useVersions } from '@/modules/datasets/api';
import { LoadError } from '@/modules/datasets/components/LoadError';
import { PreviewPanel } from '@/modules/datasets/components/PreviewPanel';
import { DEFAULT_PREVIEW_LIMIT } from '@/modules/datasets/constants';
import { NotFound } from '@/shared/ui/NotFound';

const FROM = '/app/w/$slug/projects/$projectId/datasets/versions/$versionId';

/** Sample rows of one version, with a sampling limit. A version belongs to the project's dataset. */
export function VersionPage() {
  const { t } = useTranslation();
  const { projectId, versionId } = useParams({ from: FROM });
  const { dataset, isPending, isError, error, refetch } = useProjectDataset(projectId);
  if (isError) return <LoadError title={t('datasets.loadFailed')} error={error} onRetry={() => void refetch()} />;
  if (isPending) return <Skeleton h="48" />;
  if (!dataset) return <NotFound />;
  return <VersionView projectId={projectId} datasetId={dataset.id} versionId={versionId} />;
}

function VersionView({ projectId, datasetId, versionId }: { projectId: string; datasetId: string; versionId: string }) {
  const { t } = useTranslation();
  const [limit, setLimit] = useState(DEFAULT_PREVIEW_LIMIT);
  const preview = useVersionPreview(projectId, datasetId, versionId, limit);
  const { versions } = useVersions(projectId, datasetId);
  const number = versions?.find((v) => v.id === versionId)?.number;

  return (
    <Stack gap="6">
      <Box>
        <Heading as="h2" textStyle="h2">
          {number === undefined ? t('datasets.version.title') : t('datasets.version.titleNumber', { number })}
        </Heading>
        <Text mt="1" color="fg.muted">
          {t('datasets.version.subtitle')}
        </Text>
      </Box>
      <PreviewPanel query={preview} limit={limit} onLimit={setLimit} />
    </Stack>
  );
}
