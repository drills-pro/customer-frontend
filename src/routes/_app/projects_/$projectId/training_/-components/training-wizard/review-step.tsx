import { Box, Flex, Heading, Stack, Text } from '@chakra-ui/react'

import { SectionAction } from '@/components/shared/section-card'
import type {
  TrainingScheduler,
  TrainingSplit,
} from '@/features/dashboard/data'
import { formatLearningRate } from '@/features/training/format'

export function ReviewBlock({
  label,
  value,
  onEdit,
}: {
  label: string
  value: string
  onEdit: () => void
}) {
  return (
    <Flex
      align="center"
      justify="space-between"
      gap="4"
      rounded="l3"
      borderWidth="1px"
      borderColor="border"
      p="4"
    >
      <Box minW="0">
        <Text
          fontSize="11px"
          fontWeight="medium"
          textTransform="uppercase"
          letterSpacing="wide"
          color="fg.muted"
        >
          {label}
        </Text>
        <Text mt="1" truncate textStyle="body-sm" fontWeight="semibold">
          {value}
        </Text>
      </Box>
      <SectionAction
        flexShrink={0}
        fontSize="xs"
        onClick={onEdit}
        aria-label={`Edit ${label.toLowerCase()}`}
      >
        Edit
      </SectionAction>
    </Flex>
  )
}

export function ReviewStep({
  datasetName,
  split,
  architectureName,
  epochs,
  batchSize,
  learningRate,
  scheduler,
  earlyStopping,
  computeName,
  spot,
  onEditStep,
}: {
  datasetName: string
  split: TrainingSplit
  architectureName: string
  epochs: number
  batchSize: number
  learningRate: number
  scheduler: TrainingScheduler
  earlyStopping: boolean
  computeName: string
  spot: boolean
  onEditStep: (step: number) => void
}) {
  return (
    <section>
      <Box>
        <Heading
          as="h2"
          fontSize="lg"
          fontWeight="semibold"
          letterSpacing="tight"
        >
          Review and start
        </Heading>
        <Text mt="1" textStyle="body-sm" color="fg.muted">
          Double-check your configuration before starting the run.
        </Text>
      </Box>
      <Stack mt="6" gap="2.5">
        <ReviewBlock
          label="Dataset"
          value={datasetName}
          onEdit={() => onEditStep(0)}
        />
        <ReviewBlock
          label="Split"
          value={`${split.train}% / ${split.validation}% / ${split.test}%`}
          onEdit={() => onEditStep(0)}
        />
        <ReviewBlock
          label="Model"
          value={architectureName}
          onEdit={() => onEditStep(1)}
        />
        <ReviewBlock
          label="Configuration"
          value={`${epochs} epochs · batch ${batchSize} · lr ${formatLearningRate(learningRate)} (${scheduler})${earlyStopping ? ' · early stopping' : ''}`}
          onEdit={() => onEditStep(2)}
        />
        <ReviewBlock
          label="Compute"
          value={`${computeName}${spot ? ' · spot' : ''}`}
          onEdit={() => onEditStep(3)}
        />
      </Stack>
      <Box
        mt="5"
        rounded="l2"
        bg="bg.warning"
        p="3"
        fontSize="xs"
        color="fg.warning"
      >
        Starting this run will immediately begin billing against your workspace
        credits.
      </Box>
    </section>
  )
}
