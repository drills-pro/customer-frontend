import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { cn } from '@/lib/utils'

const data = [
  { label: '00:00', primary: 12, secondary: 8 },
  { label: '06:00', primary: 28, secondary: 21 },
  { label: '12:00', primary: 51, secondary: 38 },
  { label: '18:00', primary: 72, secondary: 61 },
  { label: '23:59', primary: 91, secondary: 75 },
]

const config = {
  primary: { label: 'Validation', color: 'var(--primary)' },
  secondary: { label: 'Train', color: '#10b981' },
} satisfies ChartConfig

export function Chart({
  kind = 'accuracy',
  compact = false,
}: {
  kind?: 'accuracy' | 'loss' | 'requests'
  compact?: boolean
}) {
  const values =
    kind === 'loss'
      ? data.map((point) => ({
          ...point,
          primary: 100 - point.primary,
          secondary: 100 - point.secondary,
        }))
      : data
  const ariaLabel = `${kind} sample trend chart`

  if (kind === 'requests') {
    return (
      <ChartContainer
        config={{ primary: { label: 'Requests', color: 'var(--primary)' } }}
        className={cn('chart h-64 w-full', compact && 'h-32')}
        role="img"
        aria-label={ariaLabel}
      >
        <AreaChart data={values} accessibilityLayer>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis hide />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            dataKey="primary"
            type="monotone"
            fill="var(--color-primary)"
            fillOpacity={0.18}
            stroke="var(--color-primary)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    )
  }

  return (
    <ChartContainer
      config={config}
      className={cn('chart h-64 w-full', compact && 'h-32')}
      role="img"
      aria-label={ariaLabel}
    >
      <LineChart data={values} accessibilityLayer>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis hide />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="primary"
          type="monotone"
          stroke="var(--color-primary)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="secondary"
          type="monotone"
          stroke="var(--color-secondary)"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
