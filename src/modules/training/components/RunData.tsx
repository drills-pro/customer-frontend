import { Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useDataset, useVersions } from '@/modules/datasets';

/** "Dataset name · Version N", from the dataset pages' own queries. */
export function RunData({
  projectId,
  datasetId,
  versionId,
  testId = 'training-run-data',
}: {
  projectId: string;
  datasetId: string;
  versionId: string | null;
  testId?: string;
}) {
  const { t } = useTranslation();
  const dataset = useDataset(projectId, datasetId);
  const { versions } = useVersions(projectId, datasetId);
  const number = versions?.find((v) => v.id === versionId)?.number;
  if (!dataset.data) return null;
  return (
    <Text as="span" data-testid={testId}>
      {number === undefined ? dataset.data.name : t('training.run.data', { name: dataset.data.name, number })}
    </Text>
  );
}
