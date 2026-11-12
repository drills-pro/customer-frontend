import { Box, Button, Center, Flex, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { Cpu } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { TASK_ICONS, type TaskType } from '@/modules/projects';
import { GIB, KNOWN_PRESETS, PERCENT, SECONDS_PER_HOUR } from '@/modules/training/constants';
import type { Preset } from '@/modules/training/run-form';
import type { SummaryRow } from '@/shared/ui/wizard';
import { StepHeading } from '@/shared/ui/wizard';
import type { PixelIcon } from '@/shared/ui/icons';

/** A preset's name in the user's language; one the copy does not know (added by an admin) shows as it is. */
export function usePresetLabel() {
  const { t } = useTranslation();
  return (name: string) => (KNOWN_PRESETS.includes(name) ? t(`training.preset.${name}.label`) : name);
}

/** How a preset trains, as short phrases: image augmentation, learning-rate schedule (with its warmup) and early stopping. */
export function usePresetDetails() {
  const { t, i18n } = useTranslation();
  const percent = new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: 0 });
  return (p: Preset): string[] => [
    t(`training.model.augmentation.${p.augmentation}`),
    p.warmup_fraction > 0
      ? t('training.model.lrWarmup', {
          schedule: t(`training.model.lrSchedule.${p.lr_schedule}`),
          percent: percent.format(p.warmup_fraction * PERCENT),
        })
      : t(`training.model.lrSchedule.${p.lr_schedule}`),
    p.early_stopping_patience > 0
      ? t('training.model.earlyStopping', { count: p.early_stopping_patience })
      : t('training.model.noEarlyStopping'),
  ];
}

/** What one run of a preset may use, one row each: CPU, memory, GPU (and its memory) when it has one, and the time limit. */
export function usePresetResources() {
  const { t, i18n } = useTranslation();
  const number = new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: 1 });
  return (p: Preset): SummaryRow[] => [
    { id: 'cpu', label: t('training.resources.cpu'), value: number.format(p.cpu) },
    {
      id: 'memory',
      label: t('training.resources.memory'),
      value: t('training.resources.gb', { value: number.format(p.memory_bytes / GIB) }),
    },
    ...(p.gpu > 0 ? [{ id: 'gpu', label: t('training.resources.gpu'), value: number.format(p.gpu) }] : []),
    ...(p.gpu > 0 && p.vram_gb
      ? [{ id: 'vram', label: t('training.resources.vram'), value: t('training.resources.gb', { value: number.format(p.vram_gb) }) }]
      : []),
    {
      id: 'runtime',
      label: t('training.resources.runtime'),
      value: t('training.resources.hours', { value: number.format(p.max_runtime_s / SECONDS_PER_HOUR) }),
    },
  ];
}

/** The task's icon, so every preset tile and the selected card carry one. */
const taskIcon = (task: TaskType): PixelIcon => (task in TASK_ICONS ? TASK_ICONS[task as keyof typeof TASK_ICONS] : Cpu);

/** The chosen preset in full, above a tile per preset to switch to another. */
export function ModelStep({
  presets,
  task,
  preset,
  setPreset,
}: {
  presets: Preset[];
  task: TaskType;
  preset: string | null;
  setPreset: (name: string) => void;
}) {
  const { t } = useTranslation();
  const label = usePresetLabel();
  const Icon = taskIcon(task);
  const selected = presets.find((p) => p.name === preset);

  return (
    <Stack as="section" gap="5">
      <StepHeading title={t('training.model.title')} description={t('training.model.description')} />
      {selected && <SelectedPreset preset={selected} icon={Icon} />}
      <SimpleGrid columns={{ base: 2, sm: 3 }} gap="3">
        {presets.map((p) => {
          const pressed = preset === p.name;
          return (
            <Button
              key={p.name}
              variant="option"
              onClick={() => setPreset(p.name)}
              aria-pressed={pressed}
              minW="0"
              flexDirection="column"
              justifyContent="flex-start"
              gap="2.5"
              py="5"
              textAlign="center"
              data-testid={`training-preset-${p.name}`}
            >
              <Center
                boxSize="10"
                borderRadius="l2"
                bg={pressed ? 'brand.solid' : 'brand.subtle'}
                color={pressed ? 'brand.contrast' : 'brand.fg'}
              >
                <Icon width={20} height={20} />
              </Center>
              <Text maxW="full" textStyle="body-sm" fontWeight="semibold">
                {label(p.name)}
              </Text>
            </Button>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}

/** The selected preset: what it is, the model it starts from, and how it trains. What it runs on is in the wizard's aside. */
function SelectedPreset({ preset, icon: Icon }: { preset: Preset; icon: PixelIcon }) {
  const { t } = useTranslation();
  const label = usePresetLabel();
  const details = usePresetDetails();
  const chips = details(preset);
  return (
    <Flex
      align="center"
      gap="4"
      borderRadius="l3"
      borderWidth="2px"
      borderColor="brand.border"
      bg="brand.subtle"
      p="5"
      data-testid="training-preset-selected"
      data-preset={preset.name}
    >
      <Center boxSize="14" flexShrink={0} borderRadius="l3" bg="brand.solid" color="brand.contrast">
        <Icon width={24} height={24} />
      </Center>
      <Box minW="0">
        <Heading as="h3" textStyle="body" fontWeight="semibold">
          {label(preset.name)}
        </Heading>
        {KNOWN_PRESETS.includes(preset.name) && (
          <Text textStyle="body-sm" color="fg.muted">
            {t(`training.preset.${preset.name}.description`)}
          </Text>
        )}
        <Text mt="1" textStyle="mono-sm" fontFamily="mono" color="fg.muted" wordBreak="break-all">
          {preset.base_model.license
            ? t('training.model.baseModel', { repo: preset.base_model.repo_id, license: preset.base_model.license })
            : preset.base_model.repo_id}
        </Text>
        <Flex
          mt="2"
          wrap="wrap"
          columnGap="3"
          rowGap="1"
          textStyle="body-sm"
          fontWeight="semibold"
          color="brand-text"
          data-testid="training-preset-details"
        >
          {chips.map((chip, index) => (
            <Flex as="span" key={chip} align="center" gap="3">
              {index > 0 && <Box as="span" boxSize="1" flexShrink={0} bg="currentColor" aria-hidden="true" />}
              {chip}
            </Flex>
          ))}
        </Flex>
      </Box>
    </Flex>
  );
}
