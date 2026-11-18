import { useState } from 'react';
import { Alert, Badge, Box, Button, Checkbox, EmptyState, Heading, HStack, Skeleton, Spinner, Stack, Table, Text } from '@chakra-ui/react';
import { SimpleSelect } from '@/components/simple-select';
import { useParams } from '@tanstack/react-router';
import { Cpu } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { errorKey } from '@/shared/api/errors';
import {
  usePromoteModel,
  usePublishModel,
  useModels,
  isPromoting,
  isRollback,
  isServing,
  MODEL_STAGES,
  PromotionStatus,
  type ModelStage,
  type ModelVersion,
} from '@/modules/models/api';
import { modelErrorKey, promotionFailureKey, ProblemCode } from '@/modules/models/errors';

const FROM = '/app/w/$slug/projects/$projectId/models';

/** The project's registered model versions: which one is serving, promoting another (or rolling back), and whether each is published. */
export function ModelsPage() {
  const { t } = useTranslation();
  const { projectId } = useParams({ from: FROM });
  const { data: models, error, isError, isPending, refetch } = useModels(projectId);

  return (
    <Stack gap="6">
      <Box>
        <Heading as="h2" textStyle="h2">
          {t('models.title')}
        </Heading>
        <Text mt="1" color="fg.muted">
          {t('models.subtitle')}
        </Text>
      </Box>
      {isError ? (
        <Alert.Root status="error" colorPalette="danger" data-testid="models-load-error">
          <Alert.Indicator />
          <Alert.Content gap="3">
            <Alert.Title>{t('models.loadFailed')}</Alert.Title>
            <Alert.Description>{t(errorKey(error))}</Alert.Description>
            <Box>
              <Button size="sm" onClick={() => void refetch()}>
                {t('models.retry')}
              </Button>
            </Box>
          </Alert.Content>
        </Alert.Root>
      ) : isPending ? (
        <Skeleton h="48" />
      ) : models.length === 0 ? (
        <EmptyState.Root minH="64" borderWidth="1px" borderColor="border" borderRadius="l3" bg="surface-raised" data-testid="models-empty">
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Cpu />
            </EmptyState.Indicator>
            <EmptyState.Title>{t('models.empty.title')}</EmptyState.Title>
            <EmptyState.Description>{t('models.empty.body')}</EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <ModelsTable models={models} projectId={projectId} />
      )}
    </Stack>
  );
}

function ModelsTable({ models, projectId }: { models: ModelVersion[]; projectId: string }) {
  const { t, i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <Table.ScrollArea borderWidth="1px" borderColor="border" borderRadius="l3" bg="surface-raised">
      <Table.Root variant="data">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{t('models.col.model')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('models.col.stage')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('models.col.serving')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('models.col.publish')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('models.col.created')}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {models.map((m) => (
            <Table.Row key={m.id} data-testid="model-row" data-model={m.id} data-stage={m.stage} data-promotion={m.promotion_status ?? ''}>
              <Table.Cell>
                <Text fontWeight="medium">{m.mlflow_model_name}</Text>
                <Text textStyle="body-sm" color="fg.muted" fontFamily="mono">
                  {t('models.version', { version: m.mlflow_version })}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <StageControl projectId={projectId} version={m} />
              </Table.Cell>
              <Table.Cell>
                <ServingControl projectId={projectId} version={m} models={models} />
              </Table.Cell>
              <Table.Cell>
                <PublishControl projectId={projectId} version={m} />
              </Table.Cell>
              <Table.Cell>{date.format(new Date(m.created_at))}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

/** The stage by hand. The serving version has none to set (promote another to replace it), and one being promoted waits for the result. */
function StageControl({ projectId, version }: { projectId: string; version: ModelVersion }) {
  const { t } = useTranslation();
  const promote = usePromoteModel(projectId);
  if (isServing(version))
    return (
      <Badge colorPalette="success" data-testid="model-serving">
        {t('models.stage.Production')}
      </Badge>
    );
  return (
    <Stack gap="1">
      <SimpleSelect
        label={t('models.col.stage')}
        hideLabel
        size="sm"
        width="10rem"
        disabled={isPromoting(version)}
        items={MODEL_STAGES.map((stage) => ({ label: t(`models.stage.${stage}`), value: stage }))}
        value={version.stage}
        onChange={(stage) => promote.mutate({ versionId: version.id, stage: stage as ModelStage })}
      />
      {promote.isError && (
        <Text textStyle="body-sm" color="fg.error" role="alert">
          {t(modelErrorKey(promote.error))}
        </Text>
      )}
    </Stack>
  );
}

/** Promote to Production (or roll back to an older version): the version is deployed first, and the one serving now keeps serving until
 * that deployment is active. Pending and failed are on the row; a failed one says why and can be tried again. */
function ServingControl({ projectId, version, models }: { projectId: string; version: ModelVersion; models: ModelVersion[] }) {
  const { t } = useTranslation();
  const promote = usePromoteModel(projectId);
  const [accepted, setAccepted] = useState(false);
  if (isServing(version))
    return (
      <Text color="fg.muted" data-testid="model-serving-note">
        {t('models.serving.now')}
      </Text>
    );
  if (isPromoting(version))
    return (
      <HStack gap="2" role="status" data-testid="model-promoting">
        <Spinner size="sm" />
        <Text>{t('models.serving.deploying')}</Text>
      </HStack>
    );
  const rollback = isRollback(models, version);
  const failed = version.promotion_status === PromotionStatus.Failed;
  const risk = failed && version.promotion_error_code === ProblemCode.DeployRisk;
  return (
    <Stack gap="2">
      {failed && (
        <Alert.Root status={risk ? 'warning' : 'error'} colorPalette={risk ? 'warning' : 'danger'} data-testid="model-promotion-failed">
          <Alert.Indicator />
          <Alert.Content gap="2">
            <Alert.Description>{t(promotionFailureKey(version.promotion_error_code))}</Alert.Description>
            {risk && (
              <Checkbox.Root
                size="sm"
                checked={accepted}
                onCheckedChange={(e) => setAccepted(e.checked === true)}
                data-testid="model-promote-risk-accept"
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>{t('models.serving.riskAccept')}</Checkbox.Label>
              </Checkbox.Root>
            )}
          </Alert.Content>
        </Alert.Root>
      )}
      <Box>
        <Button
          size="xs"
          variant="outline"
          loading={promote.isPending}
          disabled={risk && !accepted}
          onClick={() => promote.mutate({ versionId: version.id, stage: 'Production', acknowledgeRisk: risk && accepted })}
          data-testid="model-promote"
          data-action={rollback ? 'rollback' : 'promote'}
        >
          {t(failed ? 'models.serving.retry' : rollback ? 'models.serving.rollback' : 'models.serving.promote')}
        </Button>
      </Box>
      {promote.isError && (
        <Text textStyle="body-sm" color="fg.error" role="alert">
          {t(modelErrorKey(promote.error))}
        </Text>
      )}
    </Stack>
  );
}

/** The list does not say whether a version is published, so both actions are offered; the API takes either. */
function PublishControl({ projectId, version }: { projectId: string; version: ModelVersion }) {
  const { t } = useTranslation();
  const publish = usePublishModel(projectId);
  return (
    <Stack gap="1">
      <HStack gap="2">
        <Button
          size="xs"
          variant="outline"
          disabled={publish.isPending}
          onClick={() => publish.mutate({ versionId: version.id, publish: true })}
          data-testid="model-publish"
        >
          {t('models.publish.on')}
        </Button>
        <Button
          size="xs"
          variant="ghost"
          disabled={publish.isPending}
          onClick={() => publish.mutate({ versionId: version.id, publish: false })}
          data-testid="model-unpublish"
        >
          {t('models.publish.off')}
        </Button>
      </HStack>
      {publish.isError && (
        <Text textStyle="body-sm" color="fg.error" role="alert">
          {t(errorKey(publish.error))}
        </Text>
      )}
    </Stack>
  );
}
