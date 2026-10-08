import { Bar, BarChart, LabelList, XAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { Dataset, DatasetDetailMock } from '@/features/dashboard/data'

import { getClassHistogram, getClassStats, itemNoun } from './helpers'
import { useCurrentDataset } from './use-current-dataset'

/** Each split keeps its color even when the others are absent. */
const SPLIT_COLORS = {
  Train: 'bg-primary',
  Validation: 'bg-info',
  Test: 'bg-warning',
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
    <div className="grid gap-6">
      <Card size="lg">
        <CardHeader>
          <CardTitle>
            {dataset.modality === 'text' ? 'Label' : 'Class'} distribution
          </CardTitle>
          <CardDescription>
            How {itemNoun(dataset)} are spread across your {dataset.classes}{' '}
            {classNoun}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClassDistribution dataset={dataset} detail={detail} />
        </CardContent>
      </Card>

      <Card size="lg">
        <CardHeader>
          <CardTitle>Split distribution</CardTitle>
          <CardDescription>
            {dataset.items.toLocaleString('en-US')} {itemNoun(dataset)} across{' '}
            {splitSentence(
              detail.splitDistribution
                .filter((split) => split.percent > 0)
                .map((split) => split.label),
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SplitDistribution dataset={dataset} detail={detail} />
        </CardContent>
      </Card>

      <Card size="lg">
        <CardHeader>
          <CardTitle>Dataset composition</CardTitle>
          <CardDescription>
            Format and coverage details not shown above
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Composition dataset={dataset} detail={detail} />
        </CardContent>
      </Card>
    </div>
  )
}

function ClassDistribution({
  dataset,
  detail,
}: {
  dataset: Dataset
  detail: DatasetDetailMock
}) {
  const stats = getClassStats(detail.classDistribution)
  const histogram = getClassHistogram(detail.classDistribution)
  const isText = dataset.modality === 'text'
  // "images" / "rows", and the singular for "grouped by image count".
  const noun = itemNoun(dataset)
  const nounSingular = noun.replace(/s$/, '')
  const classNoun = isText ? 'labels' : 'classes'
  const classNounSingular = isText ? 'label' : 'class'

  if (!stats) {
    return (
      <p className="text-sm text-muted-foreground">
        Distribution will appear after samples are processed.
      </p>
    )
  }

  return (
    <>
      <div className="flex flex-wrap gap-x-8 gap-y-4 border-b pb-5">
        <Stat label={`Avg per ${classNounSingular}`}>
          {stats.avg.toLocaleString('en-US')}
        </Stat>
        <Stat label="Median">{stats.median.toLocaleString('en-US')}</Stat>
        <Stat label={`Largest ${classNounSingular}`}>
          {stats.largest.count.toLocaleString('en-US')}{' '}
          <span className="text-xs font-medium text-muted-foreground">
            {stats.largest.name}
          </span>
        </Stat>
        <Stat label={`Smallest ${classNounSingular}`}>
          {stats.smallest.count.toLocaleString('en-US')}{' '}
          <span className="text-xs font-medium text-muted-foreground">
            {stats.smallest.name}
          </span>
        </Stat>
        <Stat label="Imbalance ratio">
          <span className="text-warning">{stats.ratio} : 1</span>
        </Stat>
      </div>

      <ChartContainer
        config={{ classes: { label: 'Classes', color: 'var(--primary)' } }}
        className="mt-6 h-44 w-full"
        role="img"
        aria-label={`${classNoun} grouped by ${nounSingular} count`}
        data-testid="class-histogram"
      >
        <BarChart
          data={histogram}
          accessibilityLayer
          margin={{ top: 20, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(label) => `${label} ${noun}`}
                formatter={(value, _name, item) => {
                  const names: string[] = item.payload?.names ?? []
                  const shown = names.slice(0, 4)
                  return (
                    <div className="grid gap-0.5">
                      <span className="font-medium text-foreground">
                        {Number(value)} {classNoun}
                      </span>
                      {shown.map((name) => (
                        <span key={name} className="text-muted-foreground">
                          {name}
                        </span>
                      ))}
                      {names.length > shown.length && (
                        <span className="text-muted-foreground">
                          and {names.length - shown.length} more
                        </span>
                      )}
                    </div>
                  )
                }}
              />
            }
          />
          <Bar dataKey="classes" radius={[3, 3, 0, 0]} fill="var(--primary)">
            <LabelList
              dataKey="classes"
              position="top"
              className="fill-foreground text-xs font-semibold"
            />
          </Bar>
        </BarChart>
      </ChartContainer>

      <p className="mt-3 text-[13px] text-muted-foreground">
        <span className="capitalize">{classNoun}</span> grouped by{' '}
        {nounSingular} count · hover a bar to see which {classNoun} fall in that
        range
      </p>
    </>
  )
}

function SplitDistribution({
  dataset,
  detail,
}: {
  dataset: Dataset
  detail: DatasetDetailMock
}) {
  const splits = detail.splitDistribution.filter((split) => split.percent > 0)

  return (
    <>
      <div className="flex h-7 overflow-hidden rounded-md">
        {splits.map((split) => (
          <div
            key={split.label}
            className={`flex items-center justify-center text-xs font-semibold text-background ${SPLIT_COLORS[split.label]}`}
            style={{ width: `${split.percent}%` }}
          >
            {split.percent >= 8 && `${split.percent}%`}
          </div>
        ))}
      </div>
      <div className="mt-3.5 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
        {splits.map((split) => (
          <span key={split.label} className="flex items-center gap-2">
            <span
              className={`size-2.5 rounded-sm ${SPLIT_COLORS[split.label]}`}
            />
            {split.label} —{' '}
            <b className="font-mono font-semibold text-foreground">
              {Math.round((dataset.items * split.percent) / 100).toLocaleString(
                'en-US',
              )}
            </b>
          </span>
        ))}
      </div>
    </>
  )
}

function Composition({
  dataset,
  detail,
}: {
  dataset: Dataset
  detail: DatasetDetailMock
}) {
  const { composition } = detail
  const { avgDimensions, avgWords } = composition

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Stat label="Label coverage">
        {dataset.status === 'Ready' ? '100%' : 'Pending'}
      </Stat>
      <Stat label="Modality">
        <span className="capitalize">{dataset.modality}</span>
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
    </div>
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
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-[15px] font-semibold">{children}</p>
    </div>
  )
}
