import type * as React from 'react';
import { Box, Checkbox, Flex, Heading, SimpleGrid, Slider, Stack, Text } from '@chakra-ui/react';

import { RadioButton, RadioButtonGroup } from '@/components/shared/radio-button-group';
import { SwitchButton } from '@/components/shared/switch-button';
import type { TrainingScheduler } from '@/features/dashboard/data';
import { formatLearningRate } from '@/features/training/format';

const augmentations = ['Random flip', 'Random crop', 'Color jitter', 'Rotation ±15°', 'Mixup', 'Random erasing'] as const;
const batchSizeTicks = [4, 8, 16, 32, 64, 128] as const;
const batchSizeMin = 1;
const batchSizeMax = 128;
const learningRateTicks = ['1e-5', '1e-4', '1e-3', '1e-2', '1e-1'];

type ConfigureStepProps = {
  epochs: number;
  setEpochs: (value: number) => void;
  batchSize: number;
  setBatchSize: (value: number) => void;
  learningRate: number;
  setLearningRate: (value: number) => void;
  scheduler: TrainingScheduler;
  setScheduler: (value: TrainingScheduler) => void;
  selectedAugmentations: string[];
  toggleAugmentation: (value: string) => void;
  earlyStopping: boolean;
  setEarlyStopping: (value: boolean) => void;
};

/** A one-thumb slider with a filled range, named for assistive tech. */
function ValueSlider({
  label,
  valueText,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  valueText?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <Slider.Root
      mt="3"
      size="sm"
      min={min}
      max={max}
      step={step}
      value={[value]}
      aria-label={[label]}
      getAriaValueText={valueText ? () => valueText : undefined}
      onValueChange={(event) => onChange(event.value[0])}
    >
      <Slider.Control>
        <Slider.Track>
          <Slider.Range />
        </Slider.Track>
        <Slider.Thumbs />
      </Slider.Control>
    </Slider.Root>
  );
}

/** A setting's name with its current value on the right. */
function SettingHeader({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Flex align="baseline" justify="space-between" gap="3">
      <Text textStyle="body-sm" fontWeight="semibold">
        {label}
      </Text>
      <Text as="span" textStyle="body-sm" fontWeight="semibold" color="brand-text">
        {value}
      </Text>
    </Flex>
  );
}

export function ConfigureStep(props: ConfigureStepProps) {
  const learningRateExponent = Math.log10(props.learningRate) + 5;

  return (
    <section>
      <Box>
        <Heading as="h2" fontSize="lg" fontWeight="semibold" letterSpacing="tight">
          Configure training
        </Heading>
        <Text mt="1" textStyle="body-sm" color="fg.muted">
          Tune the run's hyperparameters and augmentation.
        </Text>
      </Box>
      <Stack mt="8" gap="6">
        <Box>
          <SettingHeader label="Epochs" value={props.epochs} />
          <ValueSlider label="Epochs" min={1} max={100} step={1} value={props.epochs} onChange={props.setEpochs} />
          <Text mt="2" fontSize="xs" color="fg.muted">
            More epochs may improve accuracy but increase cost.
          </Text>
        </Box>

        <Box>
          <SettingHeader label="Learning rate" value={formatLearningRate(props.learningRate)} />
          <ValueSlider
            label="Learning rate"
            valueText={formatLearningRate(props.learningRate)}
            min={0}
            max={4}
            step={0.01}
            value={learningRateExponent}
            onChange={(value) => props.setLearningRate(Math.pow(10, -5 + value))}
          />
          <Flex mt="2" justify="space-between" fontSize="11px" color="fg.muted">
            {learningRateTicks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </Flex>
          <RadioButtonGroup
            attached
            mt="2"
            aria-label="Learning rate schedule"
            value={props.scheduler}
            onChange={(value) => props.setScheduler(value as TrainingScheduler)}
          >
            {(['cosine', 'linear', 'constant'] as const).map((value) => (
              <RadioButton
                key={value}
                value={value}
                size="xs"
                aria-label={`${value} schedule`}
                textTransform="capitalize"
                _checked={{
                  bg: 'brand',
                  color: 'on-brand',
                  borderColor: 'outline',
                }}
              >
                {value}
              </RadioButton>
            ))}
          </RadioButtonGroup>
        </Box>

        <Box>
          <SettingHeader label="Batch size" value={props.batchSize} />
          <ValueSlider
            label="Batch size"
            valueText={String(props.batchSize)}
            min={batchSizeMin}
            max={batchSizeMax}
            step={1}
            value={props.batchSize}
            onChange={props.setBatchSize}
          />
          <Box position="relative" mt="2" h="4" fontSize="11px" color="fg.muted">
            {batchSizeTicks.map((value) => {
              const percent = ((value - batchSizeMin) / (batchSizeMax - batchSizeMin)) * 100;
              return (
                <Text
                  as="span"
                  key={value}
                  position="absolute"
                  left={`${percent}%`}
                  transform={value === batchSizeMax ? 'translateX(-100%)' : 'translateX(-50%)'}
                >
                  {value}
                </Text>
              );
            })}
          </Box>
        </Box>

        <Box>
          <Text textStyle="body-sm" fontWeight="semibold">
            Data augmentation
          </Text>
          <SimpleGrid mt="2" columns={{ base: 1, sm: 2 }} gap="2">
            {augmentations.map((item) => (
              <Flex
                as="label"
                key={item}
                align="center"
                justify="space-between"
                rounded="l2"
                borderWidth="1px"
                borderColor="border"
                p="2.5"
                cursor="pointer"
              >
                <Text as="span" textStyle="body-sm">
                  {item}
                </Text>
                <SwitchButton
                  size="sm"
                  checked={props.selectedAugmentations.includes(item)}
                  onCheckedChange={() => props.toggleAugmentation(item)}
                  aria-label={item}
                />
              </Flex>
            ))}
          </SimpleGrid>
        </Box>

        <Checkbox.Root checked={props.earlyStopping} onCheckedChange={(event) => props.setEarlyStopping(event.checked === true)}>
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label textStyle="body-sm" fontWeight="normal">
            Enable early stopping (patience 5)
          </Checkbox.Label>
        </Checkbox.Root>
      </Stack>
    </section>
  );
}
