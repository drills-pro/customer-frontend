import { useState, type Dispatch, type SetStateAction } from 'react';
import {
  Box,
  Center,
  DataList,
  Field,
  Flex,
  Heading,
  IconButton,
  NumberInput,
  Popover,
  Portal,
  SegmentGroup,
  Slider,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Check, CircleQuestion } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import type { TaskType } from '@/modules/projects';
import { SEED_MAX, SETTINGS_MODES, SettingsMode, shownHyperparameters, type Hyperparameter } from '@/modules/training/constants';
import { usePresetDetails, usePresetLabel } from '@/modules/training/components/ModelStep';
import {
  defaultsFor,
  initialValues,
  isCustomized,
  rangesFor,
  type FieldErrors,
  type Preset,
  type Range,
  type RunFormValues,
} from '@/modules/training/run-form';
import { StepHeading } from '@/shared/ui/wizard';

/** Plain digits: grouping would put separators into the value the form checks and sends. */
const FORMAT = { useGrouping: false } as const;
/** The preset's training method, in the order `usePresetDetails` returns it; each is also its `training.settings.method.*` key. */
const METHOD = ['augmentation', 'learningRate', 'earlyStopping'] as const;

const isMode = (value: string | null): value is SettingsMode => SETTINGS_MODES.includes(value as SettingsMode);

type CustomSettings = Pick<RunFormValues, 'hyperparameters' | 'seed'>;

/** The Settings step's switch. Recommended sets the preset's defaults and keeps the custom values aside, so switching back to Custom
 * restores them. It starts on Custom only for a clone whose settings differ from the defaults, which Custom has to show. */
export function useSettingsMode(
  task: TaskType,
  preset: Preset | undefined,
  values: RunFormValues,
  setValues: Dispatch<SetStateAction<RunFormValues>>,
) {
  const [mode, setModeState] = useState<SettingsMode>(() =>
    preset && isCustomized(values, preset, task) ? SettingsMode.Custom : SettingsMode.Recommended,
  );
  const [savedCustomSettings, setSavedCustomSettings] = useState<CustomSettings | null>(null);
  const setMode = (next: SettingsMode) => {
    if (!preset || next === mode) return;
    setModeState(next);
    if (next === SettingsMode.Recommended) {
      setSavedCustomSettings({ hyperparameters: values.hyperparameters, seed: values.seed });
      setValues((v) => ({ ...v, hyperparameters: defaultsFor(preset, task), seed: initialValues(preset, task).seed }));
    } else if (savedCustomSettings) setValues((v) => ({ ...v, ...savedCustomSettings }));
  };
  /** Another preset has other bounds, so custom values kept for the old one are dropped. */
  const forgetCustomSettings = () => setSavedCustomSettings(null);
  return { mode, setMode, forgetCustomSettings };
}

interface Props {
  task: TaskType;
  preset: Preset;
  values: RunFormValues;
  errors: FieldErrors;
  mode: SettingsMode;
  setMode: (mode: SettingsMode) => void;
  setHyperparameter: (name: Hyperparameter, value: string) => void;
  setSeed: (value: string) => void;
}

/** Recommended (the preset's settings in plain words, so a first run needs no choices here) or Custom (every setting with its
 * bounds, the seed and what the preset fixes for itself). Switching is the page's job, so edits survive a trip to Recommended. */
export function SettingsStep({ task, preset, values, errors, mode, setMode, setHyperparameter, setSeed }: Props) {
  const { t } = useTranslation();
  const ranges = rangesFor(preset, task);
  const shown = shownHyperparameters(task, ranges);

  return (
    <Stack as="section" gap="5">
      <StepHeading title={t('training.settings.title')} description={t('training.settings.description')} />
      <SegmentGroup.Root
        value={mode}
        onValueChange={(e) => isMode(e.value) && setMode(e.value)}
        aria-label={t('training.settings.mode.label')}
        alignSelf="flex-start"
        data-testid="training-mode"
        data-mode={mode}
      >
        <SegmentGroup.Indicator />
        {SETTINGS_MODES.map((m) => (
          <SegmentGroup.Item key={m} value={m} data-testid={`training-mode-${m}`}>
            <SegmentGroup.ItemText>{t(`training.settings.mode.${m}`)}</SegmentGroup.ItemText>
            <SegmentGroup.ItemHiddenInput />
          </SegmentGroup.Item>
        ))}
      </SegmentGroup.Root>
      {mode === SettingsMode.Recommended ? (
        <Recommended preset={preset} values={values} shown={shown} />
      ) : (
        <Stack gap="6">
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
      )}
    </Stack>
  );
}

/** The settings the run will use, under plain names. */
function Recommended({ preset, values, shown }: { preset: Preset; values: RunFormValues; shown: readonly Hyperparameter[] }) {
  const { t } = useTranslation();
  const label = usePresetLabel();
  return (
    <Box borderRadius="l3" borderWidth="1px" borderColor="border" bg="bg.subtle" p="5" data-testid="training-settings-recommended">
      <Flex align="flex-start" gap="4">
        <Center boxSize="10" flexShrink={0} borderRadius="l2" bg="brand.subtle" color="brand.fg">
          <Check width={20} height={20} />
        </Center>
        <Box minW="0" flex="1">
          <Heading as="h3" textStyle="body" fontWeight="semibold">
            {t('training.settings.recommended.title')}
          </Heading>
          <Text mt="1" textStyle="body-sm" color="fg.muted">
            {t('training.settings.recommended.body', { model: label(preset.name) })}
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
        </Box>
      </Flex>
    </Box>
  );
}

/** One hyperparameter: its name with what changing it does behind a help button, a number to type, and a slider held to its
 * bounds with the bounds at its ends. */
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
      <Flex mt="1" w="full" align="center" gap="3" textStyle="body-sm" color="fg.muted">
        <Text as="span">{min}</Text>
        <Slider.Root
          flex="1"
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
        <Text as="span">{max}</Text>
      </Flex>
      {error ? (
        <Field.ErrorText>{t(`training.settings.error.${error}`, { min, max, step })}</Field.ErrorText>
      ) : (
        <Field.HelperText>{t(`training.settings.${name}.help`, { value: fallback })}</Field.HelperText>
      )}
    </Field.Root>
  );
}

/** A question-mark button beside a setting's name that opens what the setting does. A popover, not a hover tooltip, so it opens
 * by tap and keyboard too. It sits outside the field's label, so pressing it does not focus the input. It opens to the side, so
 * it never covers the setting above. */
function HelpTip({ name, text, testId }: { name: string; text: string; testId: string }) {
  const { t } = useTranslation();
  return (
    <Popover.Root size="sm" positioning={{ placement: 'right' }}>
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
