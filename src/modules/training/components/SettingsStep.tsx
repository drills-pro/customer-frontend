import { Box, Button, Collapsible, DataList, Field, Flex, Heading, NumberInput, Slider, Stack, Text } from '@chakra-ui/react';
import { ChevronDown, Reload } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import type { TaskType } from '@/modules/projects';
import { SEED_MAX, shownHyperparameters, type Hyperparameter } from '@/modules/training/constants';
import { usePresetDetails } from '@/modules/training/components/ModelStep';
import type { FieldErrors, Preset, RunFormValues, SettingsField } from '@/modules/training/run-form';
import { StepHeading } from '@/shared/ui/wizard';

/** Plain digits: grouping would put separators into the value the form checks and sends. */
const FORMAT = { useGrouping: false } as const;
/** The preset's training method, in the order `usePresetDetails` returns it; each is also its `training.settings.method.*` key. */
const METHOD = ['augmentation', 'learningRate', 'earlyStopping'] as const;

interface Props {
  task: TaskType;
  preset: Preset;
  values: RunFormValues;
  errors: FieldErrors;
  setHyperparameter: (name: Hyperparameter, value: string) => void;
  setSeed: (value: string) => void;
  reset: () => void;
}

/** The preset's hyperparameters on sliders held to its bounds, what the preset fixes for itself, and the seed under Advanced. */
export function SettingsStep({ task, preset, values, errors, setHyperparameter, setSeed, reset }: Props) {
  const { t } = useTranslation();
  const errorText = (field: SettingsField, min: number, max: number) =>
    errors[field] && t(`training.settings.error.${errors[field]}`, { min, max });

  return (
    <Stack as="section" gap="6">
      <StepHeading title={t('training.settings.title')} description={t('training.settings.description')} />
      <Stack gap="6">
        {shownHyperparameters(task).map((h) => {
          const { min, max, default: fallback } = preset.hyperparameters[h];
          const typed = Number(values.hyperparameters[h]);
          const value = Number.isFinite(typed) ? Math.min(max, Math.max(min, typed)) : fallback;
          const label = t(`training.settings.${h}.label`);
          return (
            <Box key={h}>
              <Flex align="baseline" justify="space-between" gap="3">
                <Text textStyle="body-sm" fontWeight="semibold">
                  {label}
                </Text>
                <Text as="span" textStyle="body-sm" fontWeight="semibold" color="brand-text" data-testid={`training-${h}-value`}>
                  {values.hyperparameters[h]}
                </Text>
              </Flex>
              <Slider.Root
                mt="3"
                size="sm"
                min={min}
                max={max}
                step={1}
                value={[value]}
                aria-label={[label]}
                onValueChange={(e) => setHyperparameter(h, String(e.value[0]))}
                data-testid={`training-${h}`}
              >
                <Slider.Control>
                  <Slider.Track>
                    <Slider.Range />
                  </Slider.Track>
                  <Slider.Thumbs />
                </Slider.Control>
              </Slider.Root>
              <Flex mt="2" justify="space-between" textStyle="body-sm" color="fg.muted">
                <Text as="span">{min}</Text>
                <Text as="span">{max}</Text>
              </Flex>
              <Text mt="1" textStyle="body-sm" color={errors[h] ? 'fg.error' : 'fg.muted'}>
                {errors[h] ? errorText(h, min, max) : t(`training.settings.${h}.help`, { value: fallback, min, max })}
              </Text>
            </Box>
          );
        })}
      </Stack>
      <PresetMethod preset={preset} />
      <Box>
        <Button size="sm" variant="ghost" onClick={reset} data-testid="training-reset">
          <Reload />
          {t('training.settings.reset')}
        </Button>
      </Box>
      <Collapsible.Root defaultOpen={Boolean(errors.seed)}>
        <Collapsible.Trigger asChild>
          <Button size="sm" variant="ghost" data-testid="training-advanced">
            {t('training.settings.advanced')}
            <ChevronDown />
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Field.Root mt="3" required invalid={Boolean(errors.seed)} maxW="xs">
            <Field.Label>{t('training.settings.seed.label')}</Field.Label>
            <NumberInput.Root
              width="full"
              min={0}
              max={SEED_MAX}
              value={values.seed}
              onValueChange={(e) => setSeed(e.value)}
              clampValueOnBlur={false}
              formatOptions={FORMAT}
              data-testid="training-seed"
            >
              <NumberInput.Control />
              <NumberInput.Input />
            </NumberInput.Root>
            {errors.seed ? (
              <Field.ErrorText>{errorText('seed', 0, SEED_MAX)}</Field.ErrorText>
            ) : (
              <Field.HelperText>{t('training.settings.seed.help')}</Field.HelperText>
            )}
          </Field.Root>
        </Collapsible.Content>
      </Collapsible.Root>
    </Stack>
  );
}

/** How the preset trains. A run cannot change these, so they are shown, not offered. */
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
        {METHOD.map((id, i) => (
          <DataList.Item key={id}>
            <DataList.ItemLabel>{t(`training.settings.method.${id}`)}</DataList.ItemLabel>
            <DataList.ItemValue>{values[i]}</DataList.ItemValue>
          </DataList.Item>
        ))}
      </DataList.Root>
    </Box>
  );
}
