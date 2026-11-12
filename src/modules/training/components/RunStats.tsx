import { Box, Card, Progress, SimpleGrid, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { TrainingStatus } from '@/modules/projects';
import type { TrainingRun } from '@/modules/training/api';
import { usePresetLabel } from '@/modules/training/components/ModelStep';
import { PERCENT } from '@/modules/training/constants';
import { useDuration } from '@/modules/training/format';
import { numericEntries, readReport } from '@/modules/training/report';
import { statusUi } from '@/modules/training/status';

const EMPTY = '-';
const FRACTION_DIGITS = 4;

/** The first score a run has: its report's, else what it recorded itself, else the last epoch's. */
function headline(run: TrainingRun): [string, number] | undefined {
  const report = readReport(run.report);
  const sources = [report?.metrics ?? {}, numericEntries(run.metrics), run.progress?.latest.metrics ?? {}];
  return sources.map((m) => Object.entries(m)[0]).find(Boolean);
}

/** A run at a glance: its epoch, how long it has taken, its model and its best known score, over a bar of how far it is. */
export function RunStats({ run }: { run: TrainingRun }) {
  const { t, i18n } = useTranslation();
  const presetLabel = usePresetLabel();
  const duration = useDuration();
  const number = new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: FRACTION_DIGITS });
  const latest = run.progress?.latest;
  const moving = statusUi(run.status).poll;
  const score = headline(run);
  const stats = [
    {
      id: 'epoch',
      label: t('training.run.stats.epoch'),
      value: latest ? t('training.run.stats.epochValue', { epoch: latest.epoch, epochs: latest.epochs }) : EMPTY,
    },
    { id: 'elapsed', label: t('training.run.stats.elapsed'), value: duration(run.created_at, run.completed_at) },
    { id: 'model', label: t('training.run.stats.model'), value: run.preset ? presetLabel(run.preset) : EMPTY },
    { id: 'score', label: score ? score[0] : t('training.run.stats.score'), value: score ? number.format(score[1]) : EMPTY },
  ];
  // Moving with no epoch yet: an indeterminate bar. Ended: as far as it got (a success is full).
  const value = latest ? (latest.epoch / latest.epochs) * PERCENT : moving ? null : run.status === TrainingStatus.Succeeded ? PERCENT : 0;
  const label = latest
    ? t('training.run.progress', { epoch: latest.epoch, epochs: latest.epochs })
    : t(run.status === TrainingStatus.Submitted ? 'training.run.working.submitted' : 'training.run.working.running');

  return (
    <Card.Root variant="outline" overflow="hidden" data-testid="training-run-stats">
      <SimpleGrid columns={{ base: 2, lg: 4 }} gap="5" p="5">
        {stats.map((s) => (
          <Box key={s.id} minW="0" data-testid={`training-stat-${s.id}`}>
            <Text textStyle="body-sm" color="fg.muted" fontFamily={s.id === 'score' && score ? 'mono' : undefined} truncate>
              {s.label}
            </Text>
            <Text mt="1" textStyle="h3" truncate>
              {s.value}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
      <Progress.Root
        size="xs"
        value={value}
        colorPalette={moving ? 'brand' : statusUi(run.status).palette}
        data-testid="training-run-progress"
        data-epoch={latest?.epoch}
        data-epochs={latest?.epochs}
      >
        <Progress.Track borderRadius="0" aria-label={label}>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
    </Card.Root>
  );
}
