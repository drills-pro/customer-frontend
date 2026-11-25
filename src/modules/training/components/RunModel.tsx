import { Alert, Box, Flex, Heading, HStack, Skeleton, Stack, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useRunLineage } from '@/modules/deployments';
import { client, unwrap } from '@/shared/api/client';
import { errorKey } from '@/shared/api/errors';
import { MetricsCard } from '@/modules/training/components/MetricsCard';
import { numericEntries } from '@/modules/training/report';

const cardKey = (projectId: string, runId: string) => ['project', projectId, 'training', 'run', runId, 'card'] as const;

/** The model card: what the model was trained from, its base, and whether it has a held-out test split. */
export function useModelCard(projectId: string, runId: string, enabled: boolean) {
  return useQuery({
    queryKey: cardKey(projectId, runId),
    queryFn: () =>
      unwrap(
        client.GET('/v1/projects/{project_id}/training-runs/{run_id}/card', { params: { path: { project_id: projectId, run_id: runId } } }),
      ),
    enabled,
  });
}

/** The model card and lineage of a succeeded run: where its data came from, its base, its test split and what it became. */
export function RunModelCard({ projectId, runId }: { projectId: string; runId: string }) {
  const { t } = useTranslation();
  const card = useModelCard(projectId, runId, true);
  const lineage = useRunLineage(projectId, runId);

  if (card.isError || lineage.isError) {
    return (
      <Alert.Root status="error" colorPalette="danger" data-testid="run-model-card-error">
        <Alert.Indicator />
        <Alert.Description>{t(errorKey(card.error ?? lineage.error))}</Alert.Description>
      </Alert.Root>
    );
  }
  if (card.isPending || lineage.isPending) return <Skeleton h="32" />;

  const info = card.data;
  const links = lineage.data;
  return (
    <Stack gap="4" data-testid="run-model-card">
      <Box borderWidth="1px" borderColor="border" borderRadius="l3" bg="surface-raised" p="5">
        <Heading as="h3" textStyle="body" fontWeight="semibold">
          {t('training.run.card.title')}
        </Heading>
        <Stack mt="3" gap="2" textStyle="body-sm">
          <Row label={t('training.run.card.baseModel')} value={info.base_model?.repo_id ?? t('training.run.card.none')} />
          <Row
            label={t('training.run.card.testSplit')}
            value={info.has_test_split ? t('training.run.card.yes') : t('training.run.card.no')}
          />
          <Row label={t('training.run.card.nearDuplicates')} value={String(info.near_duplicates ?? 0)} />
        </Stack>
      </Box>
      <MetricsCard title={t('training.run.card.metrics')} metrics={numericEntries(info.metrics)} testId="run-model-metrics" />
      <Box borderWidth="1px" borderColor="border" borderRadius="l3" bg="surface-raised" p="5">
        <Heading as="h3" textStyle="body" fontWeight="semibold">
          {t('training.run.lineage.title')}
        </Heading>
        <HStack mt="3" gap="2" wrap="wrap" textStyle="body-sm" data-testid="run-lineage">
          <Text>{t('training.run.lineage.run')}</Text>
          <Text color="fg.muted">→</Text>
          <Text>{links.model_version ? links.model_version.mlflow_model_name : t('training.run.lineage.noModel')}</Text>
          <Text color="fg.muted">→</Text>
          <Text>{links.deployment ? links.deployment.route_prefix : t('training.run.lineage.noDeployment')}</Text>
        </HStack>
      </Box>
    </Stack>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Flex gap="3" justify="space-between" wrap="wrap">
      <Text color="fg.muted">{label}</Text>
      <Text fontFamily="mono">{value}</Text>
    </Flex>
  );
}
