import { Flex, Progress, Stack, Text } from '@chakra-ui/react';
import { Activity } from 'lucide-react';

import { EmptyNotice } from '@/components/shared/empty-notice';
import { SectionAction, SectionCard } from '@/components/shared/section-card';
import { ToneBadge } from '@/components/shared/tone-badge';
import { runName } from '@/features/dashboard/format';
import { trainingPlaceholders } from '@/features/dashboard/placeholders';
import { useDashboardSummary } from '@/features/dashboard/queries';
import type { ApiLiveTraining } from '@/features/dashboard/api';
import { unavailable } from '@/lib/unavailable';
import { CardError, CardLoading } from './card-states';

// core-api's in-flight statuses; a finished run is not on this card at all.
const runStatus = {
  running: { label: 'Running', tone: 'info' },
  submitted: { label: 'Queued', tone: 'neutral' },
} as const satisfies Record<ApiLiveTraining['status'], unknown>;

export function LiveTrainingsCard() {
  const { data, error, isPending, refetch } = useDashboardSummary();
  const orgTrainings = data?.live_trainings ?? [];

  return (
    <SectionCard title="Live trainings">
      {isPending ? (
        <CardLoading />
      ) : error ? (
        <CardError title="Could not load trainings" error={error} onRetry={() => void refetch()} />
      ) : orgTrainings.length ? (
        <Stack role="list" gap="0">
          {orgTrainings.slice(0, 3).map((run) => {
            const status = runStatus[run.status];
            const name = runName(run.id);
            return (
              <Stack
                key={run.id}
                role="listitem"
                gap="0"
                px="5"
                py="3.5"
                borderBottomWidth="1px"
                borderColor="border"
                _last={{ borderBottomWidth: '0' }}
              >
                <Flex align="center" justify="space-between" gap="2" mb="2">
                  {/* The run page still reads mock data, so no link yet. */}
                  <SectionAction onClick={() => unavailable(name)}>
                    {name} · {run.project_name}
                  </SectionAction>
                  <ToneBadge tone={status.tone} dot pulse={run.status === 'running'}>
                    {status.label}
                  </ToneBadge>
                </Flex>
                <Progress.Root size="xs" colorPalette="info" value={trainingPlaceholders.progress}>
                  <Progress.Track>
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
                <Flex mt="1.5" justify="space-between" fontSize="xs" color="fg.muted">
                  <Text as="span">
                    Epoch {trainingPlaceholders.currentEpoch}/{run.config?.trainer?.epochs ?? '—'}
                  </Text>
                  <Text as="span">ETA {trainingPlaceholders.eta}</Text>
                </Flex>
              </Stack>
            );
          })}
        </Stack>
      ) : (
        <EmptyNotice icon={<Activity />} title="No live trainings" description="Running jobs will appear here." minH="36" />
      )}
    </SectionCard>
  );
}
