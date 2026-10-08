import * as React from 'react'
import { Bar, BarChart, Cell, XAxis } from 'recharts'

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjectDetail } from '@/features/dashboard/context'
import type { ResourceUsage, UsagePeriod } from '@/features/dashboard/data'
import {
  formatUsageValue,
  getUsageSummary,
  usageRangeLabel,
} from './project-overview'

/** Horizontal room reserved per bar; wider series scroll instead of squashing. */
const BAR_SLOT = 36

export function ResourceUsageCard({
  ref,
  inView,
}: {
  ref?: React.Ref<HTMLDivElement>
  inView: boolean
}) {
  const resources = useProjectDetail().details.resourceUsage
  const [period, setPeriod] = React.useState<UsagePeriod>('day')

  return (
    // min-w-0 all the way down so the scrolling chart clips instead of
    // stretching the card past its grid column.
    <Card ref={ref} size="lg" className="min-w-0 gap-0">
      <CardHeader className="pb-4">
        <CardTitle>Resource usage</CardTitle>
        <CardAction>
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as UsagePeriod)}
          >
            <SelectTrigger
              className="h-8 w-24 bg-card"
              aria-label="Usage interval"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="grid min-w-0">
        {resources.map((resource, index) => (
          <section
            key={resource.id}
            className={index === 0 ? 'min-w-0' : 'min-w-0 border-t pt-5'}
          >
            <div className="flex items-start justify-between gap-4 text-xs">
              <div>
                <h3 className="font-medium text-foreground">
                  {resource.label}
                </h3>
                <p className="mt-1 text-muted-foreground">
                  {resource.description}, {usageRangeLabel(resource, period)}
                </p>
              </div>
              <strong className="whitespace-nowrap font-medium text-muted-foreground">
                {formatUsageValue(getUsageSummary(resource, period))} /{' '}
                {resource.limit} {resource.unit}
              </strong>
            </div>
            <ResourceUsageChart
              resource={resource}
              period={period}
              inView={inView}
            />
          </section>
        ))}
      </CardContent>
    </Card>
  )
}

function ResourceUsageChart({
  resource,
  period,
  inView,
}: {
  resource: ResourceUsage
  period: UsagePeriod
  inView: boolean
}) {
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const points = resource.series[period]

  // Open on the most recent bar — the one drawn at full opacity. Recharts sizes
  // itself after layout, so keep the chart pinned to its right edge through
  // those resizes, and let go as soon as the reader scrolls it themselves.
  React.useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    let pinned = true
    const pinToLatest = () => {
      if (pinned) scroller.scrollLeft = scroller.scrollWidth
    }
    const release = () => {
      pinned = false
    }

    pinToLatest()
    const observer = new ResizeObserver(pinToLatest)
    observer.observe(scroller)
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild)
    scroller.addEventListener('pointerdown', release)
    scroller.addEventListener('wheel', release, { passive: true })
    scroller.addEventListener('keydown', release)

    return () => {
      observer.disconnect()
      scroller.removeEventListener('pointerdown', release)
      scroller.removeEventListener('wheel', release)
      scroller.removeEventListener('keydown', release)
    }
  }, [period, points.length])

  return (
    <div
      ref={scrollerRef}
      className="mt-3 overflow-x-auto overflow-y-hidden"
      data-testid={`usage-scroller-${resource.id}`}
    >
      <ChartContainer
        config={{ value: { label: resource.label, color: resource.color } }}
        className="h-28 w-full"
        style={{ minWidth: points.length * BAR_SLOT }}
        role="img"
        aria-label={`${resource.label} usage for the ${usageRangeLabel(resource, period)}`}
        data-testid={`usage-chart-${resource.id}`}
      >
        <BarChart
          key={inView ? 'visible' : 'pending'}
          data={points}
          accessibilityLayer
          margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            tickFormatter={(label: string) =>
              points.find((point) => point.label === label)?.shortLabel ?? label
            }
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => payload[0]?.payload.label}
                formatter={(value) => (
                  <div className="flex min-w-32 items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {resource.label}
                    </span>
                    <span className="font-mono font-medium text-foreground tabular-nums">
                      {formatUsageValue(Number(value))} {resource.unit}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar dataKey="value" radius={[4, 4, 1, 1]} isAnimationActive={inView}>
            {points.map((point, index) => (
              <Cell
                key={point.label}
                fill={resource.color}
                fillOpacity={index === points.length - 1 ? 1 : 0.18}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
