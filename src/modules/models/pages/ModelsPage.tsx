import { Alert, Badge, Box, Button, EmptyState, Flex, Heading, Link as ChakraLink, Skeleton, Stack, Table, Text } from '@chakra-ui/react';
import { Link, useParams } from '@tanstack/react-router';
import { Cpu } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/modules/workspaces';
import { errorKey } from '@/shared/api/errors';
import { numericEntries } from '@/shared/api/metrics';
import { useTrainingRuns } from '@/shared/api/overview';
import { includedInSharing, isPromoting, isServing, useModels, type ModelVersion } from '@/modules/models/api';
import { PromoteDialog } from '@/modules/models/components/PromoteDialog';
import { ModelMenu } from '@/modules/models/components/ModelMenu';
import { promotionFailureKey, ProblemCode } from '@/modules/models/errors';
import { modelStatus, ModelStatus, STATUS_UI } from '@/modules/models/status';

const FROM = '/app/w/$slug/projects/$projectId/models';
const EMPTY = '-';
const FRACTION_DIGITS = 4;

/** The project's registered model versions: each one's score and status, whether it is in the project's sharing, and promoting one (or
 * rolling back) behind a confirm. The run that made a version is a click away, with its metrics, config and data. */
export function ModelsPage() {
  const { t } = useTranslation();
  const { slug, projectId } = useParams({ from: FROM });
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
        <ModelsTable models={models} slug={slug} projectId={projectId} />
      )}
    </Stack>
  );
}

function ModelsTable({ models, slug, projectId }: { models: ModelVersion[]; slug: string; projectId: string }) {
  const { t } = useTranslation();
  const { id: workspaceId } = useWorkspace();
  const runs = useTrainingRuns(workspaceId, projectId);
  const scoreOf = (m: ModelVersion) => {
    const run = m.training_run_id ? runs.data?.find((r) => r.id === m.training_run_id) : undefined;
    return Object.entries(numericEntries(run?.metrics))[0];
  };
  return (
    <Table.ScrollArea borderWidth="1px" borderColor="border" borderRadius="l3" bg="surface-raised">
      <Table.Root variant="data">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{t('models.col.model')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('models.col.score')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('models.col.status')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('models.col.sharing')}</Table.ColumnHeader>
            <Table.ColumnHeader>
              <Box srOnly>{t('models.col.actions')}</Box>
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {models.map((m) => (
            <ModelRow key={m.id} version={m} models={models} score={scoreOf(m)} slug={slug} projectId={projectId} />
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

interface ModelRowProps {
  version: ModelVersion;
  /** Every version of the project, to tell a promote from a rollback and to name the one serving. */
  models: ModelVersion[];
  /** The run's first metric, if it has one. */
  score: [string, number] | undefined;
  slug: string;
  projectId: string;
}

function ModelRow({ version: m, models, score, slug, projectId }: ModelRowProps) {
  const { t, i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' });
  const number = new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: FRACTION_DIGITS });
  const included = includedInSharing(m);
  return (
    <Table.Row data-testid="model-row" data-model={m.id} data-stage={m.stage} data-promotion={m.promotion_status ?? ''}>
      <Table.Cell>
        {m.training_run_id ? (
          <ChakraLink asChild fontWeight="medium" color="brand-text">
            <Link
              to="/w/$slug/projects/$projectId/training/$runId"
              params={{ slug, projectId, runId: m.training_run_id }}
              data-testid="model-run-link"
            >
              {m.mlflow_model_name}
            </Link>
          </ChakraLink>
        ) : (
          <Text fontWeight="medium">{m.mlflow_model_name}</Text>
        )}
        <Text mt="0.5" textStyle="body-sm" color="fg.muted">
          {t('models.version', { version: m.mlflow_version })} · {date.format(new Date(m.created_at))}
        </Text>
      </Table.Cell>
      <Table.Cell data-testid="model-score">
        {score ? (
          <Text as="span">
            <Text as="span" fontFamily="mono" color="fg.muted">
              {score[0]}
            </Text>{' '}
            <Text as="span" fontWeight="semibold">
              {number.format(score[1])}
            </Text>
          </Text>
        ) : (
          EMPTY
        )}
      </Table.Cell>
      <Table.Cell>
        <StatusCell version={m} />
      </Table.Cell>
      <Table.Cell>
        {included === undefined ? (
          EMPTY
        ) : (
          <Badge colorPalette={included ? 'info' : 'gray'} variant="subtle" data-testid="model-shared" data-shared={String(included)}>
            {t(included ? 'models.sharing.included' : 'models.sharing.leftOut')}
          </Badge>
        )}
      </Table.Cell>
      <Table.Cell>
        <Flex justify="flex-end" align="center" gap="2">
          {!isServing(m) && !isPromoting(m) && <PromoteDialog projectId={projectId} version={m} models={models} />}
          <ModelMenu projectId={projectId} version={m} />
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}

/** One badge for what the version is doing, with a glyph and a word; a failed promotion also says why (never the server's text). */
function StatusCell({ version }: { version: ModelVersion }) {
  const { t } = useTranslation();
  const status = modelStatus(version);
  const ui = STATUS_UI[status];
  const risk = version.promotion_error_code === ProblemCode.DeployRisk;
  return (
    // Table cells do not wrap; a reason is a sentence, so this one does.
    <Stack gap="1" align="flex-start" maxW="xs" whiteSpace="normal">
      <Badge
        colorPalette={ui.palette}
        variant="subtle"
        gap="1"
        role={status === ModelStatus.Deploying ? 'status' : undefined}
        data-testid={
          status === ModelStatus.Serving ? 'model-serving' : status === ModelStatus.Deploying ? 'model-promoting' : 'model-status'
        }
        data-status={status}
      >
        <ui.icon width={12} height={12} />
        {t(`models.status.${status}`)}
      </Badge>
      {status === ModelStatus.Deploying && (
        <Text textStyle="body-sm" color="fg.muted">
          {t('models.serving.deploying')}
        </Text>
      )}
      {status === ModelStatus.Failed && (
        <Text textStyle="body-sm" color={risk ? 'fg.warning' : 'fg.error'} data-testid="model-promotion-failed">
          {t(promotionFailureKey(version.promotion_error_code))}
        </Text>
      )}
    </Stack>
  );
}
