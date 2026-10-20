import type * as React from 'react'
import {
  Box,
  Center,
  Flex,
  Grid,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Chart, useChart } from '@chakra-ui/charts'
import { Bar, BarChart, LabelList, Tooltip, XAxis } from 'recharts'

import { SectionCard } from '@/components/shared/section-card'
import type { Dataset, DatasetDetail } from '@/features/dashboard/data'

import { getClassHistogram, getClassStats, itemNoun } from './helpers'
import { useCurrentDataset } from './use-current-dataset'

/** Each split keeps its color even when the others are absent. */
const SPLIT_COLORS = {
  Train: 'brand',
  Validation: 'info',
  Test: 'warning',
} as const

/** "train, validation, and test" — only the splits this dataset actually has. */
function splitSentence(labels: string[]) {
  const names = labels.map((label) => label.toLowerCase())
  if (names.length === 1) return `the ${names[0]} split`
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

export function StatisticsTab() {
  const { dataset, detail } = useCurrentDataset()
  const classNoun = dataset.modality === 'text' ? 'labels' : 'classes'

  return (
    <Grid gap="6">
      <SectionCard
        divided={false}
        title={`${dataset.modality === 'text' ? 'Label' : 'Class'} distribution`}
        description={`How ${itemNoun(dataset)} are spread across your ${dataset.classes} ${classNoun}`}
      >
        <Box px="5" pb="5">
          <ClassDistribution dataset={dataset} detail={detail} />
        </Box>
      </SectionCard>

      <SectionCard
        divided={false}
        title="Split distribution"
        description={`${dataset.items.toLocaleString('en-US')} ${itemNoun(dataset)} across ${splitSentence(
          detail.splitDistribution
            .filter((split) => split.percent > 0)
            .map((split) => split.label),
        )}`}
      >
        <Box px="5" pb="5">
          <SplitDistribution dataset={dataset} detail={detail} />
        </Box>
      </SectionCard>

      <SectionCard
        divided={false}
        title="Dataset composition"
        description="Format and coverage details not shown above"
      >
        <Box px="5" pb="5">
          <Composition dataset={dataset} detail={detail} />
        </Box>
      </SectionCard>
    </Grid>
  )
}

function ClassDistribution({
  dataset,
  detail,
}: {
  dataset: Dataset
  detail: DatasetDetail
}) {
  const stats = getClassStats(detail.classDistribution)
  const histogram = getClassHistogram(detail.classDistribution)
  const isText = dataset.modality === 'text'
  // "images" / "rows", and the singular for "grouped by image count".
  const noun = itemNoun(dataset)
  const nounSingular = noun.replace(/s$/, '')
  const classNoun = isText ? 'labels' : 'classes'
  const classNounSingular = isText ? 'label' : 'class'

  const chart = useChart({
    data: histogram,
    series: [{ name: 'classes', color: 'brand', label: 'Classes' }],
  })

  if (!stats) {
    return (
      <Text textStyle="body-sm" color="fg.muted">
        Distribution will appear after samples are processed.
      </Text>
    )
  }

  return (
    <>
      <Flex
        wrap="wrap"
        columnGap="8"
        rowGap="4"
        borderBottomWidth="1px"
        borderColor="border"
        pb="5"
      >
        <Stat label={`Avg per ${classNounSingular}`}>
          {stats.avg.toLocaleString('en-US')}
        </Stat>
        <Stat label="Median">{stats.median.toLocaleString('en-US')}</Stat>
        <Stat label={`Largest ${classNounSingular}`}>
          {stats.largest.count.toLocaleString('en-US')}{' '}
          <Text as="span" fontSize="xs" fontWeight="medium" color="fg.muted">
            {stats.largest.name}
          </Text>
        </Stat>
        <Stat label={`Smallest ${classNounSingular}`}>
          {stats.smallest.count.toLocaleString('en-US')}{' '}
          <Text as="span" fontSize="xs" fontWeight="medium" color="fg.muted">
            {stats.smallest.name}
          </Text>
        </Stat>
        <Stat label="Imbalance ratio">
          <Text as="span" color="fg.warning">
            {stats.ratio} : 1
          </Text>
        </Stat>
      </Flex>

      <Chart.Root
        chart={chart}
        mt="6"
        h="44"
        w="full"
        role="img"
        aria-label={`${classNoun} grouped by ${nounSingular} count`}
        data-testid="class-histogram"
      >
        <BarChart
          responsive
          data={chart.data}
          accessibilityLayer
          margin={{ top: 20, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis
            dataKey={chart.key('label')}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            tick={{ fill: chart.color('fg.muted'), fontSize: 12 }}
          />
          <Tooltip
            cursor={false}
            content={
              <Chart.Tooltip
                labelFormatter={(label) => `${label} ${noun}`}
                render={(item) => {
                  const names: string[] = item.payload?.names ?? []
                  const shown = names.slice(0, 4)
                  return (
                    <Stack gap="0.5">
                      <Text as="span" fontWeight="medium">
                        {Number(item.value)} {classNoun}
                      </Text>
                      {shown.map((name) => (
                        <Text as="span" key={name} color="fg.muted">
                          {name}
                        </Text>
                      ))}
                      {names.length > shown.length && (
                        <Text as="span" color="fg.muted">
                          and {names.length - shown.length} more
                        </Text>
                      )}
                    </Stack>
                  )
                }}
              />
            }
          />
          <Bar
            dataKey={chart.key('classes')}
            radius={[3, 3, 0, 0]}
            fill={chart.color('brand')}
          >
            <LabelList
              dataKey={chart.key('classes')}
              position="top"
              fill={chart.color('fg')}
              fontSize={12}
              fontWeight={600}
            />
          </Bar>
        </BarChart>
      </Chart.Root>

      <Text mt="3" fontSize="13px" color="fg.muted">
        <Text as="span" textTransform="capitalize">
          {classNoun}
        </Text>{' '}
        grouped by {nounSingular} count · hover a bar to see which {classNoun}{' '}
        fall in that range
      </Text>
    </>
  )
}

function SplitDistribution({
  dataset,
  detail,
}: {
  dataset: Dataset
  detail: DatasetDetail
}) {
  const splits = detail.splitDistribution.filter((split) => split.percent > 0)

  return (
    <>
      <Flex h="7" overflow="hidden" rounded="l1">
        {splits.map((split) => (
          <Center
            key={split.label}
            w={`${split.percent}%`}
            colorPalette={SPLIT_COLORS[split.label]}
            bg="colorPalette.solid"
            color="colorPalette.contrast"
            fontSize="xs"
            fontWeight="semibold"
          >
            {split.percent >= 8 && `${split.percent}%`}
          </Center>
        ))}
      </Flex>
      <Flex
        mt="3.5"
        wrap="wrap"
        columnGap="6"
        rowGap="2"
        fontSize="13px"
        color="fg.muted"
      >
        {splits.map((split) => (
          <Flex as="span" key={split.label} align="center" gap="2">
            <Box
              boxSize="2.5"
              rounded="sm"
              colorPalette={SPLIT_COLORS[split.label]}
              bg="colorPalette.solid"
            />
            {split.label} —{' '}
            <Text as="b" fontFamily="mono" fontWeight="semibold" color="fg">
              {Math.round((dataset.items * split.percent) / 100).toLocaleString(
                'en-US',
              )}
            </Text>
          </Flex>
        ))}
      </Flex>
    </>
  )
}

function Composition({
  dataset,
  detail,
}: {
  dataset: Dataset
  detail: DatasetDetail
}) {
  const { composition } = detail
  const { avgDimensions, avgWords } = composition

  return (
    <SimpleGrid columns={{ base: 1, sm: 2 }} gap="5">
      <Stat label="Label coverage">
        {dataset.status === 'Ready' ? '100%' : 'Pending'}
      </Stat>
      <Stat label="Modality">
        <Text as="span" textTransform="capitalize">
          {dataset.modality}
        </Text>
      </Stat>
      {avgDimensions && (
        <Stat label="Avg image dimensions">
          {avgDimensions.width} × {avgDimensions.height} px
        </Stat>
      )}
      {avgWords !== undefined && (
        <Stat label="Avg words per row">{avgWords}</Stat>
      )}
      <Stat label="File format">{composition.fileFormat}</Stat>
    </SimpleGrid>
  )
}

function Stat({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <Box>
      <Text fontSize="xs" color="fg.muted">
        {label}
      </Text>
      <Text mt="1" fontFamily="mono" fontSize="15px" fontWeight="semibold">
        {children}
      </Text>
    </Box>
  )
}
