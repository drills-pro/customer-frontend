import { Alert, Box, Button, EmptyState, Heading, HStack, Skeleton, Stack, Table, Text } from '@chakra-ui/react';
import { SimpleSelect } from '@/components/simple-select';
import { useParams } from '@tanstack/react-router';
import { Cpu } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { errorKey } from '@/shared/api/errors';
import { usePromoteModel, usePublishModel, useModels, MODEL_STAGES, type ModelStage, type ModelVersion } from '@/modules/models/api';

const FROM = '/app/w/$slug/projects/$projectId/models';

/** The project's registered model versions: where each stands, whether it is published, and which stage it is in. */
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
            <Table.ColumnHeader>{t('models.col.publish')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('models.col.created')}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {models.map((m) => (
            <Table.Row key={m.id} data-testid="model-row" data-model={m.id}>
              <Table.Cell>
                <Text fontWeight="medium">{m.customer_label || m.mlflow_model_name}</Text>
                <Text textStyle="body-sm" color="fg.muted" fontFamily="mono">
                  {t('models.version', { version: m.mlflow_version })}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <StageControl projectId={projectId} version={m} />
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

/** Moves the version to another stage. The API answers 409 or 422 for an illegal move; the message says why. */
function StageControl({ projectId, version }: { projectId: string; version: ModelVersion }) {
  const { t } = useTranslation();
  const promote = usePromoteModel(projectId);
  return (
    <Stack gap="1">
      <SimpleSelect
        label={t('models.col.stage')}
        hideLabel
        size="sm"
        width="10rem"
        items={MODEL_STAGES.map((stage) => ({ label: t(`models.stage.${stage}`), value: stage }))}
        value={version.stage}
        onChange={(stage) => promote.mutate({ versionId: version.id, stage: stage as ModelStage })}
      />
      {promote.isError && (
        <Text textStyle="body-sm" color="fg.error" role="alert">
          {t(errorKey(promote.error))}
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
