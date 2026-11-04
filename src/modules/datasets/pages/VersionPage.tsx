import { useState } from 'react';
import { Box, Heading, Stack, Text } from '@chakra-ui/react';
import { useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useVersionPreview, useVersions } from '@/modules/datasets/api';
import { PreviewPanel } from '@/modules/datasets/components/PreviewPanel';
import { DEFAULT_PREVIEW_LIMIT } from '@/modules/datasets/constants';

const FROM = '/app/w/$slug/projects/$projectId/datasets/$datasetId/versions/$versionId';

/** Sample rows of one version, with a sampling limit. */
export function VersionPage() {
  const { t } = useTranslation();
  const { projectId, datasetId, versionId } = useParams({ from: FROM });
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
