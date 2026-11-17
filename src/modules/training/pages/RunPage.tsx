import { useState } from 'react';
import { Alert, Box, Button, Flex, Heading, HStack, Skeleton, Stack, Tabs, Text } from '@chakra-ui/react';
import { Link, useParams } from '@tanstack/react-router';
import { Copy } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { TrainingStatus } from '@/modules/projects';
import { useWorkspace } from '@/modules/workspaces';
import { NotFound } from '@/shared/ui/NotFound';
import { useRun, type TrainingRun } from '@/modules/training/api';
import { ConfigCard } from '@/modules/training/components/ConfigCard';
import { ConfusionMatrixCard } from '@/modules/training/components/ConfusionMatrixCard';
import { LogsCard } from '@/modules/training/components/LogsCard';
import { MetricCharts } from '@/modules/training/components/MetricCharts';
import { MetricsCard } from '@/modules/training/components/MetricsCard';
import { usePresetLabel } from '@/modules/training/components/ModelStep';
import { RunData } from '@/modules/training/components/RunData';
import { RunModelActions, RunModelCard } from '@/modules/training/components/RunModel';
import { RunStats } from '@/modules/training/components/RunStats';
import { RunStatusBadge } from '@/modules/training/components/RunStatusBadge';
import { StopRunDialog } from '@/modules/training/components/StopRunDialog';
import { RUN_TABS, SHORT_ID_LENGTH, type RunTab } from '@/modules/training/constants';
import { isNotFound, trainingErrorKey } from '@/modules/training/errors';
import { failureKey, numericEntries, readReport, type RunReport } from '@/modules/training/report';
import { statusUi } from '@/modules/training/status';

const FROM = '/app/w/$slug/projects/$projectId/training/$runId';

/** One training run: where it stands at a glance, how it ended, and tabs for its scores, its log and what it was started with. */
export function RunPage() {
  const { t } = useTranslation();
  const { projectId, runId } = useParams({ from: FROM });
  const { data: run, error, isError, isPending, refetch } = useRun(projectId, runId);
  const [tab, setTab] = useState<RunTab>('metrics');

  if (isError) {
    if (isNotFound(error)) return <NotFound />;
    return (
      <Alert.Root status="error" colorPalette="danger" data-testid="training-run-load-error">
        <Alert.Indicator />
        <Alert.Content gap="3">
          <Alert.Title>{t('training.run.loadFailed')}</Alert.Title>
          <Alert.Description>{t(trainingErrorKey(error))}</Alert.Description>
          <Box>
            <Button size="sm" onClick={() => void refetch()}>
              {t('training.retry')}
            </Button>
          </Box>
        </Alert.Content>
      </Alert.Root>
    );
  }
  if (isPending) return <Skeleton h="48" />;

  const report = readReport(run.report);
  return (
    <Stack gap="6">
      <RunHeader run={run} projectId={projectId} />
      <RunStats run={run} />
      <Outcome run={run} report={report} />
      {run.status === TrainingStatus.Succeeded && <RunModelActions projectId={projectId} runId={run.id} />}
      <Tabs.Root value={tab} onValueChange={(e) => setTab(e.value as RunTab)} lazyMount unmountOnExit>
        <Tabs.List aria-label={t('training.run.sections')}>
          <Tabs.Indicator />
          {RUN_TABS.map((id) => (
            <Tabs.Trigger key={id} value={id} data-testid={`training-run-tab-${id}`}>
              {t(`training.run.tab.${id}`)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="metrics" pt="5">
          <MetricsTab run={run} report={report} projectId={projectId} />
        </Tabs.Content>
        <Tabs.Content value="logs" pt="5">
          <LogsCard projectId={projectId} runId={run.id} status={run.status} tall />
        </Tabs.Content>
        <Tabs.Content value="config" pt="5">
          <ConfigCard run={run} projectId={projectId} />
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}

/** The run's name line, what it trained, and its actions: start another like it, and stop it while it moves. */
function RunHeader({ run, projectId }: { run: TrainingRun; projectId: string }) {
  const { t, i18n } = useTranslation();
  const { slug } = useWorkspace();
  const presetLabel = usePresetLabel();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <Flex wrap="wrap" align="flex-start" justify="space-between" gap="3">
      <Box minW="0">
        <Flex align="center" gap="3" wrap="wrap">
          <Heading as="h2" textStyle="h2">
            {t('training.run.title')}
          </Heading>
          <RunStatusBadge status={run.status} />
        </Flex>
        <HStack mt="1" columnGap="4" rowGap="1" wrap="wrap" color="fg.muted">
          <Text fontFamily="mono">{t('training.run.id', { id: run.id.slice(0, SHORT_ID_LENGTH) })}</Text>
          {run.preset && <Text>{t('training.run.preset', { name: presetLabel(run.preset) })}</Text>}
          {run.dataset_id && <RunData projectId={projectId} datasetId={run.dataset_id} versionId={run.dataset_version_id} />}
          <Text>{t('training.run.startedOn', { date: date.format(new Date(run.created_at)) })}</Text>
          {run.completed_at && <Text>{t('training.run.endedOn', { date: date.format(new Date(run.completed_at)) })}</Text>}
        </HStack>
      </Box>
      <HStack gap="2" flexShrink={0}>
        <Button asChild size="sm">
          <Link
            to="/w/$slug/projects/$projectId/training/new"
            params={{ slug, projectId }}
            search={{ clone: run.id }}
            data-testid="training-run-clone"
          >
            <Copy />
            {t('training.run.clone')}
          </Link>
        </Button>
        {statusUi(run.status).cancel && <StopRunDialog projectId={projectId} runId={run.id} />}
      </HStack>
    </Flex>
  );
}

/** How the run stands, in words: still moving, done (and whether its scores can be trusted), failed and why, or cancelled. */
function Outcome({ run, report }: { run: TrainingRun; report: RunReport | null }) {
  const { t } = useTranslation();

  if (statusUi(run.status).poll)
    return (
      <Text color="fg.muted" role="status" data-testid="training-run-working">
        {t('training.run.workingHelp')}
      </Text>
    );

  switch (run.status) {
    case TrainingStatus.Succeeded: {
      const nearDuplicates = report?.nearDuplicates ?? 0;
      return (
        <Stack gap="4">
          <Alert.Root status="success" colorPalette="success" data-testid="training-run-succeeded">
            <Alert.Indicator />
            <Alert.Description>{t('training.run.succeeded')}</Alert.Description>
          </Alert.Root>
          {nearDuplicates > 0 && (
            <Alert.Root status="warning" colorPalette="warning" data-testid="training-near-duplicates" data-count={nearDuplicates}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t('training.run.nearDuplicates.title')}</Alert.Title>
                <Alert.Description>{t('training.run.nearDuplicates.description', { count: nearDuplicates })}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}
        </Stack>
      );
    }
    // A new run starts from the project header's "New training", or from Clone to keep this run's settings.
    case TrainingStatus.Failed:
      return (
        <Alert.Root status="error" colorPalette="danger" data-testid="training-run-failed" data-code={report?.code ?? undefined}>
          <Alert.Indicator />
          <Alert.Description>{t(failureKey(report?.code))}</Alert.Description>
        </Alert.Root>
      );
    default: {
      // Gray with the badge's glyph, so the alert and the Cancelled badge read as one status.
      const { palette, icon: Icon } = statusUi(run.status);
      return (
        <Alert.Root status="neutral" colorPalette={palette} data-testid="training-run-ended">
          <Alert.Indicator>
            <Icon />
          </Alert.Indicator>
          <Alert.Description>{t('training.run.cancelled')}</Alert.Description>
        </Alert.Root>
      );
    }
  }
}

/** The scores: a chart per metric over the epochs, then the latest epoch's (while moving) or the final results and confusion grid,
 * and the log under them, as on the branch's first tab. */
function MetricsTab({ run, report, projectId }: { run: TrainingRun; report: RunReport | null; projectId: string }) {
  const { t } = useTranslation();
  const history = run.progress?.history ?? [];
  const moving = statusUi(run.status).poll;
  const results = report && Object.keys(report.metrics).length > 0 ? report.metrics : numericEntries(run.metrics);
  const succeeded = run.status === TrainingStatus.Succeeded;
  const empty = history.length === 0 && !(moving && run.progress) && !succeeded;
  return (
    <Stack gap="6">
      {history.length > 0 && <MetricCharts history={history} />}
      {moving && run.progress && (
        <MetricsCard title={t('training.run.latest')} metrics={run.progress.latest.metrics} testId="training-latest-metrics" />
      )}
      {succeeded && <MetricsCard title={t('training.run.metrics')} metrics={results} testId="training-metrics" />}
      {succeeded && report?.confusionMatrix && <ConfusionMatrixCard matrix={report.confusionMatrix} />}
      {succeeded && <RunModelCard projectId={projectId} runId={run.id} />}
      {empty && (
        <Text color="fg.muted" data-testid="training-metrics-empty">
          {t('training.run.noScores')}
        </Text>
      )}
      <LogsCard projectId={projectId} runId={run.id} status={run.status} />
    </Stack>
  );
}
