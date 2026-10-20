import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  SimpleGrid,
  Slider,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Link } from '@tanstack/react-router'
import { Database } from 'lucide-react'

import { EmptyNotice } from '@/components/shared/empty-notice'
import type { Dataset, TrainingSplit } from '@/features/dashboard/data'

/** Train, validation and test: one hue, stepping down in strength. */
const splitColors = ['brand', 'brand/70', 'brand/25']

export function DatasetStep({
  datasets,
  datasetId,
  setDatasetId,
  split,
  setSplit,
  projectId,
}: {
  datasets: Dataset[]
  datasetId: string
  setDatasetId: (id: string) => void
  split: TrainingSplit
  setSplit: (split: TrainingSplit) => void
  projectId: string
}) {
  const dataset = datasets.find((item) => item.id === datasetId)
  const minSplit = 5
  const boundaries = [split.train, split.train + split.validation]
  const splitRows = [
    ['Train', split.train],
    ['Validation', split.validation],
    ['Test', split.test],
  ] as const

  const segments = [
    { start: 0, end: boundaries[0], label: `Train ${split.train}%` },
    { start: boundaries[0], end: boundaries[1], label: `${split.validation}%` },
    { start: boundaries[1], end: 100, label: `${split.test}%` },
  ]

  return (
    <section>
      <Box>
        <Heading
          as="h2"
          fontSize="lg"
          fontWeight="semibold"
          letterSpacing="tight"
        >
          Choose a dataset
        </Heading>
        <Text mt="1" textStyle="body-sm" color="fg.muted">
          Pick the ready dataset this run will train on, then set how it's
          split.
        </Text>
      </Box>
      {datasets.length ? (
        <>
          <Stack mt="6" gap="2.5">
            {datasets.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant="option"
                onClick={() => setDatasetId(item.id)}
                aria-pressed={datasetId === item.id}
                w="full"
                justifyContent="space-between"
                gap="4"
                rounded="l3"
                css={{
                  '&[aria-pressed=true] [data-dataset-icon]': {
                    bg: 'brand',
                    color: 'on-brand',
                  },
                  '&[aria-pressed=true] [data-chosen]': { opacity: 1 },
                }}
              >
                <Flex minW="0" align="center" gap="3.5">
                  <Center
                    data-dataset-icon
                    boxSize="9"
                    flexShrink={0}
                    rounded="l2"
                    bg="brand.subtle"
                    color="brand.fg"
                  >
                    <Database size={18} />
                  </Center>
                  <Box minW="0">
                    <Text truncate textStyle="body-sm" fontWeight="semibold">
                      {item.name}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {item.items.toLocaleString('en-US')} items ·{' '}
                      {item.classes} classes · v{item.version}
                    </Text>
                  </Box>
                </Flex>
                <Box
                  data-chosen
                  aria-hidden="true"
                  boxSize="2"
                  flexShrink={0}
                  rounded="full"
                  bg="brand"
                  opacity={0}
                />
              </Button>
            ))}
          </Stack>

          <Box mt="5" borderTopWidth="1px" borderColor="border" pt="5">
            <Flex
              mb="3"
              wrap="wrap"
              align="baseline"
              justify="space-between"
              gap="2"
            >
              <Heading as="h3" textStyle="body-sm" fontWeight="semibold">
                Train / validation / test split
              </Heading>
              <Text fontSize="xs" color="fg.muted">
                Drag the dividers to adjust
              </Text>
            </Flex>
            <Slider.Root
              min={0}
              max={100}
              step={1}
              minStepsBetweenThumbs={minSplit}
              value={boundaries}
              aria-label={['Train split', 'Validation split']}
              getAriaValueText={({ index }) =>
                index === 0
                  ? `Train ${split.train}%`
                  : `Validation ${split.validation}%, test ${split.test}%`
              }
              onValueChange={(event) => {
                const [nextTrain, nextValidationEnd] = event.value
                // The bar spans 0–100 so segment widths match their
                // percentages; every split still keeps at least minSplit.
                const validationEnd = Math.min(
                  Math.max(nextValidationEnd, minSplit * 2),
                  100 - minSplit,
                )
                const train = Math.min(
                  Math.max(nextTrain, minSplit),
                  validationEnd - minSplit,
                )
                setSplit({
                  train,
                  validation: validationEnd - train,
                  test: 100 - validationEnd,
                })
              }}
            >
              <Slider.Control>
                <Slider.Track
                  h="8"
                  rounded="l2"
                  bg="bg.muted"
                  position="relative"
                >
                  {segments.map((segment, index) => (
                    <Flex
                      key={index}
                      position="absolute"
                      insetY="0"
                      left={`${segment.start}%`}
                      w={`${Math.max(0, segment.end - segment.start)}%`}
                      align="center"
                      justify="center"
                      overflow="hidden"
                      whiteSpace="nowrap"
                      bg={splitColors[index]}
                      color={index === 2 ? 'fg' : 'on-brand'}
                    >
                      <Text
                        as="span"
                        truncate
                        fontSize="xs"
                        fontWeight="semibold"
                      >
                        {segment.label}
                      </Text>
                    </Flex>
                  ))}
                </Slider.Track>
                {boundaries.map((_, index) => (
                  <Slider.Thumb
                    key={index}
                    index={index}
                    h="5"
                    w="1"
                    rounded="sm"
                    borderWidth="0"
                    bg="surface-raised"
                    boxShadow="none"
                  >
                    <Slider.HiddenInput />
                  </Slider.Thumb>
                ))}
              </Slider.Control>
            </Slider.Root>
            <SimpleGrid mt="3" columns={3} gap="2">
              {splitRows.map(([label, percentage], index) => (
                <Box key={label} minW="0" fontSize="xs">
                  <Flex align="center" gap="1.5" color="fg.muted">
                    <Box
                      boxSize="2"
                      flexShrink={0}
                      rounded="sm"
                      bg={splitColors[index]}
                    />
                    {label}
                  </Flex>
                  <Text as="strong" mt="0.5" display="block" lineHeight="short">
                    {percentage}% ·{' '}
                    {Math.round(
                      (dataset?.items ?? 0) * (percentage / 100),
                    ).toLocaleString('en-US')}{' '}
                    items
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </>
      ) : (
        <EmptyNotice
          mt="5"
          minH="56"
          rounded="l3"
          borderWidth="1px"
          borderColor="border"
          title="Add a ready dataset first"
          description="Upload data and wait for processing to finish before starting training."
        >
          <Button asChild variant="solid" size="sm">
            <Link to="/projects/$projectId/datasets" params={{ projectId }}>
              Go to datasets
            </Link>
          </Button>
        </EmptyNotice>
      )}
    </section>
  )
}
