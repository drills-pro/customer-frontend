import { Alert, Box, Button, EmptyState, Heading, Link as ChakraLink, Skeleton, Stack, Table, Text } from '@chakra-ui/react';
import { Link, useParams } from '@tanstack/react-router';
import { Cpu } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { ACTIVE_TRAINING, TRAINING_RUN_LIMIT, type TrainingRunSummary } from '@/modules/projects';
import { useWorkspace } from '@/modules/workspaces';
import { useRuns } from '@/modules/training/api';
import { usePresetLabel } from '@/modules/training/components/ModelStep';
import { RunStatusBadge } from '@/modules/training/components/RunStatusBadge';
import { trainingErrorKey } from '@/modules/training/errors';
import { useDuration } from '@/modules/training/format';
import { numericEntries } from '@/modules/training/report';

const FROM = '/app/w/$slug/projects/$projectId/training/';
const EMPTY = '-';
const FRACTION_DIGITS = 4;

/** The project's training runs, newest first, each leading to its page. Statuses move by themselves while a run is in flight. */
export function RunsPage() {
  const { t } = useTranslation();
  const { id: workspaceId, slug } = useWorkspace();
  const { projectId } = useParams({ from: FROM });
  const { data: runs, error, isError, isPending, refetch } = useRuns(workspaceId, projectId);

  return (
    <Stack gap="6">
      <Box>
        <Heading as="h2" textStyle="h2">
          {t('training.title')}
        </Heading>
        <Text mt="1" color="fg.muted">
          {t('training.list.subtitle')}
        </Text>
      </Box>
      {isError ? (
        <Alert.Root status="error" colorPalette="danger" data-testid="training-list-load-error">
          <Alert.Indicator />
          <Alert.Content gap="3">
            <Alert.Title>{t('training.list.loadFailed')}</Alert.Title>
            <Alert.Description>{t(trainingErrorKey(error))}</Alert.Description>
            <Box>
              <Button size="sm" onClick={() => void refetch()}>
                {t('training.retry')}
              </Button>
            </Box>
          </Alert.Content>
        </Alert.Root>
      ) : isPending ? (
        <Skeleton h="48" />
      ) : runs.length === 0 ? (
        <EmptyState.Root
          minH="64"
          borderWidth="1px"
          borderColor="border"
          borderRadius="l3"
          bg="surface-raised"
          data-testid="training-list-empty"
        >
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Cpu />
            </EmptyState.Indicator>
            <EmptyState.Title>{t('training.list.empty.title')}</EmptyState.Title>
            <EmptyState.Description>{t('training.list.empty.body')}</EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <Stack gap="3">
          <RunsTable runs={runs} slug={slug} projectId={projectId} />
          {runs.length >= TRAINING_RUN_LIMIT && (
            <Text textStyle="body-sm" color="fg.muted" data-testid="training-list-more">
              {t('training.list.more', { count: TRAINING_RUN_LIMIT })}
            </Text>
          )}
        </Stack>
      )}
    </Stack>
  );
}

function RunsTable({ runs, slug, projectId }: { runs: TrainingRunSummary[]; slug: string; projectId: string }) {
  const { t, i18n } = useTranslation();
  const presetLabel = usePresetLabel();
  const duration = useDuration();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium', timeStyle: 'short' });
  const number = new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: FRACTION_DIGITS });

  return (
    <Table.ScrollArea borderWidth="1px" borderColor="border" borderRadius="l3" bg="surface-raised">
      <Table.Root variant="data">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{t('training.list.col.run')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('training.list.col.status')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('training.list.col.duration')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('training.list.col.result')}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {runs.map((run) => {
            const [headline] = Object.entries(numericEntries(run.metrics));
            const moving = ACTIVE_TRAINING.includes(run.status);
            return (
              <Table.Row key={run.id} data-testid="training-row" data-run={run.id}>
                <Table.Cell>
                  <ChakraLink asChild fontWeight="medium" color="brand-text">
                    <Link to="/w/$slug/projects/$projectId/training/$runId" params={{ slug, projectId, runId: run.id }}>
                      {date.format(new Date(run.created_at))}
                    </Link>
                  </ChakraLink>
                  <Text mt="0.5" textStyle="body-sm" color="fg.muted">
                    {run.preset ? presetLabel(run.preset) : EMPTY}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <RunStatusBadge status={run.status} />
                </Table.Cell>
                <Table.Cell data-testid="training-row-duration">{moving ? EMPTY : duration(run.created_at, run.completed_at)}</Table.Cell>
                <Table.Cell>
                  {headline ? (
                    <Text as="span">
                      <Text as="span" fontFamily="mono" color="fg.muted">
                        {headline[0]}
                      </Text>{' '}
                      <Text as="span" color="fg" fontWeight="medium">
                        {number.format(headline[1])}
                      </Text>
                    </Text>
                  ) : (
                    EMPTY
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
