import type { ReactNode } from 'react';
import { Button, Card, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { Download } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { usePresets, type TrainingRun } from '@/modules/training/api';
import { usePresetDetails, usePresetLabel } from '@/modules/training/components/ModelStep';
import { RunData } from '@/modules/training/components/RunData';
import { HYPERPARAMETERS, SHORT_ID_LENGTH } from '@/modules/training/constants';
import { numericEntries } from '@/modules/training/report';
import { downloadText } from '@/shared/ui/download';

const EMPTY = '-';
const JSON_INDENT = 2;

/** What the run was started with: its model, data and resolved settings (core-api keeps those in `config`), and how its preset
 * trains when the preset is still offered. Download saves the same as JSON. */
export function ConfigCard({ run, projectId }: { run: TrainingRun; projectId: string }) {
  const { t } = useTranslation();
  const presetLabel = usePresetLabel();
  const presetDetails = usePresetDetails();
  const presets = usePresets(projectId);
  const preset = presets.data?.find((p) => p.name === run.preset);
  const config = numericEntries(run.config);
  const method = preset ? presetDetails(preset) : [];
  const rows: { id: string; label: string; value: ReactNode }[] = [
    { id: 'preset', label: t('training.model.label'), value: run.preset ? presetLabel(run.preset) : EMPTY },
    {
      id: 'data',
      label: t('training.data.dataset'),
      value: run.dataset_id ? (
        <RunData projectId={projectId} datasetId={run.dataset_id} versionId={run.dataset_version_id} testId="training-config-data-name" />
      ) : (
        EMPTY
      ),
    },
    ...HYPERPARAMETERS.filter((h) => h in config).map((h) => ({
      id: h,
      label: t(`training.settings.${h}.label`),
      value: String(config[h]),
    })),
    ...(method.length ? [{ id: 'method', label: t('training.model.details'), value: method.join(', ') }] : []),
  ];
  const save = () =>
    downloadText(
      `training-${run.id.slice(0, SHORT_ID_LENGTH)}-config.json`,
      JSON.stringify(
        { run: run.id, preset: run.preset, dataset: run.dataset_id, dataset_version: run.dataset_version_id, hyperparameters: config },
        null,
        JSON_INDENT,
      ),
      'application/json',
    );

  return (
    <Card.Root variant="outline" data-testid="training-config">
      <Flex align="center" justify="space-between" gap="3" px="5" py="3" borderBottomWidth="1px" borderColor="border">
        <Card.Title as="h3" textStyle="body" fontWeight="semibold">
          {t('training.run.config.title')}
        </Card.Title>
        <Button size="xs" onClick={save} data-testid="training-config-download">
          <Download />
          {t('training.run.download')}
        </Button>
      </Flex>
      <SimpleGrid columns={{ base: 1, sm: 2 }} columnGap="8" px="5" pb="5" pt="2">
        {rows.map((row) => (
          <Flex
            key={row.id}
            justify="space-between"
            gap="4"
            py="2"
            textStyle="body-sm"
            borderBottomWidth="1px"
            borderColor="border"
            data-testid={`training-config-${row.id}`}
          >
            <Text as="span" color="fg.muted">
              {row.label}
            </Text>
            <Text as="span" maxW="60%" textAlign="end" fontWeight="medium" wordBreak="break-word">
              {row.value}
            </Text>
          </Flex>
        ))}
      </SimpleGrid>
    </Card.Root>
  );
}
