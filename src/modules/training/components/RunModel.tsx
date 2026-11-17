import { useState } from 'react';
import { Alert, Box, Button, Checkbox, Field, Flex, Heading, HStack, Input, Skeleton, Stack, Text } from '@chakra-ui/react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/modules/workspaces';
import { client, unwrap } from '@/shared/api/client';
import { errorKey } from '@/shared/api/errors';
import { useCreateDeployment } from '@/modules/deployments/api';
import { useRegisterModel } from '@/modules/models/api';
import { MetricsCard } from '@/modules/training/components/MetricsCard';
import { numericEntries } from '@/modules/training/report';

const lineageKey = (projectId: string, runId: string) => ['project', projectId, 'training', 'run', runId, 'lineage'] as const;
const cardKey = (projectId: string, runId: string) => ['project', projectId, 'training', 'run', runId, 'card'] as const;

/** Where a run's data, model and deployment come from. Read once a run has succeeded. */
export function useRunLineage(projectId: string, runId: string, enabled: boolean) {
  return useQuery({
    queryKey: lineageKey(projectId, runId),
    queryFn: () =>
      unwrap(
        client.GET('/v1/projects/{project_id}/training-runs/{run_id}/lineage', {
          params: { path: { project_id: projectId, run_id: runId } },
        }),
      ),
    enabled,
  });
}

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

/** Register the run's model under a name, then deploy it. A run without a held-out test split needs the risk acknowledged. */
export function RunModelActions({ projectId, runId }: { projectId: string; runId: string }) {
  const { t } = useTranslation();
  const { slug } = useWorkspace();
  const navigate = useNavigate();
  const lineage = useRunLineage(projectId, runId, true);
  const register = useRegisterModel(projectId);
  const deploy = useCreateDeployment(projectId);
  const [name, setName] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const noTestSplit = lineage.data ? !lineage.data.training_run.has_test_split : false;
  const deployBlocked = noTestSplit && !acknowledged;
  const trimmed = name.trim();

  return (
    <Box borderWidth="1px" borderColor="border" borderRadius="l3" bg="surface-raised" p="5" data-testid="run-model-actions">
      <Heading as="h3" textStyle="body" fontWeight="semibold">
        {t('training.run.model.title')}
      </Heading>
      <Text mt="1" color="fg.muted" textStyle="body-sm">
        {t('training.run.model.help')}
      </Text>
      <Stack mt="4" gap="4">
        <Flex gap="3" wrap="wrap" align="flex-end">
          <Field.Root maxW="sm" flex="1" minW="0">
            <Field.Label>{t('training.run.model.name')}</Field.Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('training.run.model.namePlaceholder')}
              data-testid="run-model-name"
            />
          </Field.Root>
          <Button
            size="sm"
            variant="outline"
            disabled={!trimmed || register.isPending}
            onClick={() => register.mutate({ runId, name: trimmed })}
            data-testid="run-model-register"
          >
            {t('training.run.model.register')}
          </Button>
        </Flex>
        {register.isSuccess && (
          <Alert.Root status="success" colorPalette="success" data-testid="run-model-registered">
            <Alert.Indicator />
            <Alert.Description>{t('training.run.model.registered')}</Alert.Description>
          </Alert.Root>
        )}
        {register.isError && (
          <Text textStyle="body-sm" color="fg.error" role="alert">
            {t(errorKey(register.error))}
          </Text>
        )}
        {noTestSplit && (
          <Checkbox.Root
            checked={acknowledged}
            onCheckedChange={(e) => setAcknowledged(e.checked === true)}
            size="sm"
            data-testid="run-model-acknowledge"
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>{t('training.run.model.acknowledge')}</Checkbox.Label>
          </Checkbox.Root>
        )}
        <Flex gap="3" align="center" wrap="wrap">
          <Button
            size="sm"
            disabled={deployBlocked || deploy.isPending}
            onClick={() =>
              deploy.mutate(
                { runId, acknowledgeRisk: acknowledged },
                {
                  onSuccess: (created) =>
                    void navigate({
                      to: '/w/$slug/projects/$projectId/deployments/$deploymentId',
                      params: { slug, projectId, deploymentId: created.id },
                    }),
                },
              )
            }
            data-testid="run-model-deploy"
          >
            {t('training.run.model.deploy')}
          </Button>
          {deploy.isError && (
            <Text textStyle="body-sm" color="fg.error" role="alert">
              {t(errorKey(deploy.error))}
            </Text>
          )}
        </Flex>
      </Stack>
    </Box>
  );
}

/** The model card and lineage of a succeeded run: where its data came from, its base, its test split and what it became. */
export function RunModelCard({ projectId, runId }: { projectId: string; runId: string }) {
  const { t } = useTranslation();
  const card = useModelCard(projectId, runId, true);
  const lineage = useRunLineage(projectId, runId, true);

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
