import { useState } from 'react';
import { Box, Button, Heading, Stack, Text } from '@chakra-ui/react';
import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useVersionPreview, useVersions } from '@/modules/datasets/api';
import { PreviewPanel } from '@/modules/datasets/components/PreviewPanel';
import { DEFAULT_PREVIEW_LIMIT } from '@/modules/datasets/constants';
import { useWorkspace } from '@/modules/workspaces';

const FROM = '/app/w/$slug/projects/$projectId/datasets/$datasetId/versions/$versionId';

/** Sample rows of one version, with a sampling limit. */
export function VersionPage() {
  const { t } = useTranslation();
  const { slug } = useWorkspace();
  const { projectId, datasetId, versionId } = useParams({ from: FROM });
  const [limit, setLimit] = useState(DEFAULT_PREVIEW_LIMIT);
  const preview = useVersionPreview(projectId, datasetId, versionId, limit);
  const { versions } = useVersions(projectId, datasetId);
  const number = versions?.find((v) => v.id === versionId)?.number;

  return (
    <Stack gap="6">
      <Box>
        <Button asChild variant="ghost" size="sm" mb="2">
          <Link to="/w/$slug/projects/$projectId/datasets/$datasetId" params={{ slug, projectId, datasetId }}>
            <ArrowLeft />
            {t('datasets.backToDataset')}
          </Link>
        </Button>
        <Heading as="h1" textStyle="h1">
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
