import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  Collapsible,
  DataList,
  Field,
  Flex,
  Heading,
  IconButton,
  NumberInput,
  Popover,
  Portal,
  Slider,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Check, ChevronDown, CircleQuestion, Reload, Sliders } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import type { TaskType } from '@/modules/projects';
import { ADVANCED_SETTINGS_KEY, SEED_MAX, shownHyperparameters, type Hyperparameter } from '@/modules/training/constants';
import { usePresetDetails, usePresetLabel } from '@/modules/training/components/ModelStep';
import { rangesFor, type FieldErrors, type Preset, type Range, type RunFormValues } from '@/modules/training/run-form';
import { StepHeading } from '@/shared/ui/wizard';

/** Plain digits: grouping would put separators into the value the form checks and sends. */
const FORMAT = { useGrouping: false } as const;
/** The preset's training method, in the order `usePresetDetails` returns it; each is also its `training.settings.method.*` key. */
const METHOD = ['augmentation', 'learningRate', 'earlyStopping'] as const;
/** What the Advanced section's remembered state is stored as. */
const OPEN = 'open';

/** Whether this browser left the Advanced section open last time. Storage may be off (a private window); then it starts closed. */
const rememberedOpen = () => {
  try {
    return localStorage.getItem(ADVANCED_SETTINGS_KEY) === OPEN;
  } catch {
    return false;
  }
};
const rememberOpen = (open: boolean) => {
  try {
    if (open) localStorage.setItem(ADVANCED_SETTINGS_KEY, OPEN);
    else localStorage.removeItem(ADVANCED_SETTINGS_KEY);
  } catch {
    // Not remembered; the section still works.
  }
};

interface Props {
  task: TaskType;
  preset: Preset;
  values: RunFormValues;
  errors: FieldErrors;
  /** Whether the values differ from the preset's defaults. */
  customized: boolean;
  setHyperparameter: (name: Hyperparameter, value: string) => void;
  setSeed: (value: string) => void;
  reset: () => void;
}

/** The recommended settings in plain words first, so a first run needs no choices here. Advanced, closed unless the values were
 * changed or this browser left it open, holds every setting with its bounds, the seed and what the preset fixes for itself. */
export function SettingsStep({ task, preset, values, errors, customized, setHyperparameter, setSeed, reset }: Props) {
  const { t } = useTranslation();
  const ranges = rangesFor(preset, task);
  const shown = shownHyperparameters(task, ranges);
  const [open] = useState(() => customized || Object.keys(errors).length > 0 || rememberedOpen());

  return (
    <Stack as="section" gap="5">
      <StepHeading title={t('training.settings.title')} description={t('training.settings.description')} />
      <Recommended preset={preset} values={values} shown={shown} customized={customized} reset={reset} />
      <Collapsible.Root defaultOpen={open} onOpenChange={(e) => rememberOpen(e.open)}>
        <Collapsible.Trigger asChild>
          <Button size="sm" variant="ghost" data-testid="training-advanced">
            {t('training.settings.advanced')}
            <ChevronDown />
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Stack mt="3" gap="6">
            <Text textStyle="body-sm" color="fg.muted">
              {t('training.settings.advancedDescription')}
            </Text>
            {shown.map((h) => {
              const range = ranges[h];
              return range ? (
                <HyperparameterField
                  key={h}
                  name={h}
                  range={range}
                  value={values.hyperparameters[h]}
                  errors={errors}
                  onChange={(value) => setHyperparameter(h, value)}
                />
              ) : null;
            })}
            <SeedField value={values.seed} errors={errors} onChange={setSeed} />
            <PresetMethod preset={preset} />
          </Stack>
        </Collapsible.Content>
      </Collapsible.Root>
    </Stack>
  );
}

/** The settings the run will use, under plain names, and whether they are still the recommended ones. */
function Recommended({
  preset,
  values,
  shown,
  customized,
  reset,
}: {
  preset: Preset;
  values: RunFormValues;
  shown: readonly Hyperparameter[];
  customized: boolean;
  reset: () => void;
}) {
  const { t } = useTranslation();
  const label = usePresetLabel();
  const Icon = customized ? Sliders : Check;
  const state = customized ? 'custom' : 'recommended';
  return (
    <Box
      borderRadius="l3"
      borderWidth="2px"
      borderColor="brand.border"
      bg="brand.subtle"
      p="5"
      data-testid="training-settings-recommended"
      data-customized={String(customized)}
    >
      <Flex align="flex-start" gap="4">
        <Center boxSize="10" flexShrink={0} borderRadius="l2" bg="brand.solid" color="brand.contrast">
          <Icon width={20} height={20} />
        </Center>
        <Box minW="0" flex="1">
          <Flex align="center" gap="2" wrap="wrap">
            <Heading as="h3" textStyle="body" fontWeight="semibold">
              {t(`training.settings.${state}.title`)}
            </Heading>
            {customized && (
              <Badge colorPalette="brand" variant="solid" gap="1" data-testid="training-settings-customized">
                <Sliders width={12} height={12} />
                {t('training.settings.customized')}
              </Badge>
            )}
          </Flex>
          <Text mt="1" textStyle="body-sm" color="fg.muted">
            {t(`training.settings.${state}.body`, { model: label(preset.name) })}
          </Text>
          {shown.length > 0 && (
            <DataList.Root mt="3" orientation="horizontal" size="sm">
              {shown.map((h) => (
                <DataList.Item key={h}>
                  <DataList.ItemLabel>{t(`training.settings.${h}.plain`)}</DataList.ItemLabel>
                  <DataList.ItemValue fontWeight="semibold" data-testid={`training-${h}-value`}>
                    {values.hyperparameters[h]}
                  </DataList.ItemValue>
                </DataList.Item>
              ))}
            </DataList.Root>
          )}
          {customized && (
            <Button mt="3" size="sm" variant="ghost" onClick={reset} data-testid="training-reset">
              <Reload />
              {t('training.settings.reset')}
            </Button>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

/** One hyperparameter: its name with what changing it does behind a help button, a number to type and a slider held to its bounds. */
function HyperparameterField({
  name,
  range,
  value,
  errors,
  onChange,
}: {
  name: Hyperparameter;
  range: Range;
  value: string;
  errors: FieldErrors;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const { min, max, step, default: fallback } = range;
  const typed = Number(value);
  const position = Number.isFinite(typed) ? Math.min(max, Math.max(min, typed)) : fallback;
  const label = t(`training.settings.${name}.label`);
  const error = errors[name];
  return (
    <Field.Root invalid={Boolean(error)}>
      <Flex w="full" align="center" justify="space-between" gap="4">
        <Flex minW="0" align="center" gap="1">
          <Field.Label>{label}</Field.Label>
          <HelpTip name={label} text={t(`training.settings.${name}.effect`)} testId={`training-${name}-help`} />
        </Flex>
        <NumberInput.Root
          flexShrink={0}
          w="28"
          size="sm"
          min={min}
          max={max}
          step={step}
          value={value}
          onValueChange={(e) => onChange(e.value)}
          clampValueOnBlur={false}
          formatOptions={FORMAT}
          data-testid={`training-${name}-input`}
        >
          <NumberInput.Control />
          <NumberInput.Input />
        </NumberInput.Root>
      </Flex>
      <Slider.Root
        mt="2"
        w="full"
        size="sm"
        min={min}
        max={max}
        step={step}
        value={[position]}
        aria-label={[label]}
        onValueChange={(e) => onChange(String(e.value[0]))}
        data-testid={`training-${name}`}
      >
        <Slider.Control>
          <Slider.Track>
            <Slider.Range />
          </Slider.Track>
          <Slider.Thumbs />
        </Slider.Control>
      </Slider.Root>
      <Flex w="full" justify="space-between" textStyle="body-sm" color="fg.muted">
        <Text as="span">{min}</Text>
        <Text as="span">{max}</Text>
      </Flex>
      {error ? (
        <Field.ErrorText>{t(`training.settings.error.${error}`, { min, max, step })}</Field.ErrorText>
      ) : (
        <Field.HelperText>{t(`training.settings.${name}.help`, { value: fallback, min, max })}</Field.HelperText>
      )}
    </Field.Root>
  );
}

/** A question-mark button beside a setting's name that opens what the setting does. A popover, not a hover tooltip, so it opens
 * by tap and keyboard too. It sits outside the field's label, so pressing it does not focus the input. */
function HelpTip({ name, text, testId }: { name: string; text: string; testId: string }) {
  const { t } = useTranslation();
  return (
    <Popover.Root size="sm" positioning={{ placement: 'top-start' }}>
      <Popover.Trigger asChild>
        <IconButton
          size="2xs"
          variant="ghost"
          color="fg.muted"
          aria-label={t('training.settings.helpLabel', { name })}
          data-testid={testId}
        >
          <CircleQuestion />
        </IconButton>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content maxW="xs" data-testid={`${testId}-content`}>
            <Popover.Arrow>
              <Popover.ArrowTip />
            </Popover.Arrow>
            <Popover.Body>
              <Popover.Title fontWeight="semibold">{name}</Popover.Title>
              <Text mt="1" textStyle="body-sm">
                {text}
              </Text>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}

function SeedField({ value, errors, onChange }: { value: string; errors: FieldErrors; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  return (
    <Field.Root required invalid={Boolean(errors.seed)} maxW="xs">
      <Flex align="center" gap="1">
        <Field.Label>{t('training.settings.seed.label')}</Field.Label>
        <HelpTip name={t('training.settings.seed.label')} text={t('training.settings.seed.help')} testId="training-seed-help" />
      </Flex>
      <NumberInput.Root
        width="full"
        min={0}
        max={SEED_MAX}
        value={value}
        onValueChange={(e) => onChange(e.value)}
        clampValueOnBlur={false}
        formatOptions={FORMAT}
        data-testid="training-seed"
      >
        <NumberInput.Control />
        <NumberInput.Input />
      </NumberInput.Root>
      {errors.seed && <Field.ErrorText>{t(`training.settings.error.${errors.seed}`, { min: 0, max: SEED_MAX, step: 1 })}</Field.ErrorText>}
    </Field.Root>
  );
}

/** What the preset starts from and how it trains. A run cannot change these, so they are shown, not offered. */
function PresetMethod({ preset }: { preset: Preset }) {
  const { t, i18n } = useTranslation();
  const details = usePresetDetails()(preset);
  const rate = new Intl.NumberFormat(i18n.resolvedLanguage, { notation: 'scientific' }).format(preset.learning_rate);
  const values = [details[0], t('training.settings.method.rate', { rate, schedule: details[1] }), details[2]];
  return (
    <Box borderTopWidth="1px" borderColor="border" pt="5" data-testid="training-method">
      <Heading as="h3" textStyle="body-sm" fontWeight="semibold">
        {t('training.settings.method.title')}
      </Heading>
      <Text mt="1" textStyle="body-sm" color="fg.muted">
        {t('training.settings.method.description')}
      </Text>
      <DataList.Root mt="3" orientation="horizontal" size="sm">
        {/* A preset with no base model trains from scratch (a tabular bundle's), so there is no repo to name. */}
        {preset.base_model && (
          <DataList.Item data-testid="training-method-base-model">
            <DataList.ItemLabel>{t('training.run.card.baseModel')}</DataList.ItemLabel>
            <DataList.ItemValue fontFamily="mono" wordBreak="break-all">
              {preset.base_model.license
                ? t('training.model.baseModel', { repo: preset.base_model.repo_id, license: preset.base_model.license })
                : preset.base_model.repo_id}
            </DataList.ItemValue>
          </DataList.Item>
        )}
        {METHOD.map((id, i) => (
          <DataList.Item key={id}>
            <DataList.ItemLabel>{t(`training.settings.method.${id}`)}</DataList.ItemLabel>
            {/* The phrases are written to follow a comma (the run's config card), so the list capitalizes them. */}
            <DataList.ItemValue _firstLetter={{ textTransform: 'uppercase' }}>{values[i]}</DataList.ItemValue>
          </DataList.Item>
        ))}
      </DataList.Root>
    </Box>
  );
}
