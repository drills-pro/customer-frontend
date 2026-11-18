import { Badge, Box, Button, Center, Flex, Grid, Stack, Text } from '@chakra-ui/react';
import { Cpu } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { TASK_ICONS, type TaskType } from '@/modules/projects';
import { DEFAULT_PRESET, GIB, KNOWN_PRESETS, PERCENT, SECONDS_PER_HOUR } from '@/modules/training/constants';
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

/** The task's icon, so every preset row carries one. */
const taskIcon = (task: TaskType): PixelIcon => (task in TASK_ICONS ? TASK_ICONS[task as keyof typeof TASK_ICONS] : Cpu);

/** Compare the offered presets in one list. Each row is one large selection target and shows the run limit and compute beside the
 * plain-language description. How a preset trains is on the Settings step; its full resources are in the wizard's aside. */
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
  const resources = usePresetResources();
  const Icon = taskIcon(task);

  return (
    <Stack as="section" gap="5">
      <StepHeading title={t('training.model.title')} description={t('training.model.description')} />
      <Stack
        gap="0"
        overflow="hidden"
        borderWidth="1px"
        borderColor="border"
        borderRadius="l3"
        role="group"
        aria-label={t('training.model.label')}
      >
        <Grid
          display={{ base: 'none', md: 'grid' }}
          templateColumns="minmax(0, 1fr) 8rem minmax(12rem, .85fr) 2rem"
          gap="5"
          alignItems="center"
          px="5"
          py="2.5"
          bg="bg.subtle"
          borderBottomWidth="1px"
          borderColor="border"
          textStyle="label"
          color="fg.muted"
          textTransform="uppercase"
        >
          <Text>{t('training.model.label')}</Text>
          <Text>{t('training.resources.runtime')}</Text>
          <Text>{t('training.resources.title')}</Text>
          <Box />
        </Grid>
        {presets.map((p, index) => {
          const pressed = preset === p.name;
          const rows = resources(p);
          const runtime = rows.find((row) => row.id === 'runtime');
          const compute = rows.filter((row) => row !== runtime);
          return (
            <Button
              key={p.name}
              variant="plain"
              onClick={() => setPreset(p.name)}
              aria-pressed={pressed}
              w="full"
              h="auto"
              minW="0"
              p="0"
              borderWidth="0"
              borderRadius="0"
              whiteSpace="normal"
              textAlign="start"
              fontWeight="normal"
              data-testid={`training-preset-${p.name}`}
            >
              <Grid
                w="full"
                minW="0"
                templateColumns={{ base: 'minmax(0, 1fr) auto', md: 'minmax(0, 1fr) 8rem minmax(12rem, .85fr) 2rem' }}
                gap={{ base: '3', md: '5' }}
                alignItems="center"
                px="5"
                py="4"
                bg={pressed ? 'selected-bg' : 'control-bg'}
                borderBottomWidth={index === presets.length - 1 ? '0' : '1px'}
                borderColor={pressed ? 'selected-edge' : 'border'}
                _hover={{ bg: pressed ? 'selected-bg' : 'selected-bg/50' }}
              >
                <Flex minW="0" align="flex-start" gap="3.5">
                  <Center
                    boxSize="9"
                    flexShrink={0}
                    borderRadius="l2"
                    bg={pressed ? 'brand.solid' : 'brand.subtle'}
                    color={pressed ? 'brand.contrast' : 'brand.fg'}
                  >
                    <Icon width={18} height={18} />
                  </Center>
                  <Box minW="0">
                    <Flex align="center" gap="2" wrap="wrap">
                      <Text textStyle="body-sm" fontWeight="semibold">
                        {label(p.name)}
                      </Text>
                      {p.name === DEFAULT_PRESET && (
                        <Badge colorPalette="brand" variant="subtle" data-testid="training-preset-recommended">
                          {t('training.model.recommended')}
                        </Badge>
                      )}
                    </Flex>
                    {KNOWN_PRESETS.includes(p.name) && (
                      <Text mt="1" textStyle="body-sm" color="fg.muted">
                        {t(`training.preset.${p.name}.description`)}
                      </Text>
                    )}
                  </Box>
                </Flex>
                <Box gridColumn={{ base: '1', md: 'auto' }} pl={{ base: '12.5', md: '0' }}>
                  <Text display={{ md: 'none' }} textStyle="label" color="fg.muted" textTransform="uppercase">
                    {t('training.resources.runtime')}
                  </Text>
                  <Text mt={{ base: '0.5', md: '0' }} textStyle="body-sm" fontWeight="medium">
                    {runtime?.value}
                  </Text>
                </Box>
                <Box gridColumn={{ base: '1 / -1', md: 'auto' }} pl={{ base: '12.5', md: '0' }}>
                  <Text display={{ md: 'none' }} textStyle="label" color="fg.muted" textTransform="uppercase">
                    {t('training.resources.title')}
                  </Text>
                  <Flex mt={{ base: '0.5', md: '0' }} wrap="wrap" columnGap="3" rowGap="1" textStyle="body-sm">
                    {compute.map((row) => (
                      <Text as="span" key={row.id}>
                        <Text as="span" color="fg.muted">
                          {row.label}{' '}
                        </Text>
                        <Text as="span" fontWeight="medium">
                          {row.value}
                        </Text>
                      </Text>
                    ))}
                  </Flex>
                </Box>
                <Box
                  gridColumn={{ base: '2', md: 'auto' }}
                  gridRow={{ base: '1', md: 'auto' }}
                  justifySelf="center"
                  alignSelf={{ base: 'start', md: 'center' }}
                  boxSize="2"
                  bg="brand.solid"
                  opacity={pressed ? 1 : 0}
                  aria-hidden="true"
                />
              </Grid>
            </Button>
          );
        })}
      </Stack>
    </Stack>
  );
}
