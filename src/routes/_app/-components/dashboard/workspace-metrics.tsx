import { cn } from 'cn'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ApiMetricKey } from '@/features/dashboard/api'
import {
  compactCount,
  metricChange,
  sparklinePoints,
} from '@/features/dashboard/format'
import {
  useDashboardSummary,
  useMetricHistory,
} from '@/features/dashboard/queries'

const HISTORY_DAYS = 30

const changeTone = {
  up: 'text-success',
  down: 'text-destructive',
  flat: 'text-muted-foreground',
} as const

const changeArrow = { up: '▲', down: '▼', flat: '■' } as const

export function WorkspaceMetrics() {
  const { data, isPending } = useDashboardSummary()
  const history = useMetricHistory(HISTORY_DAYS)
  const metrics = data?.metrics

  // The counts are live from core-api; the trend and sparkline beside each
  // come from the metric history.
  const cards: Array<{
    key: ApiMetricKey
    title: string
    value: string | undefined
    format: (value: number) => string
  }> = [
    {
      key: 'active_projects',
      title: 'Active Projects',
      value: metrics && String(metrics.active_projects),
      format: String,
    },
    {
      key: 'trainings_running',
      title: 'Trainings Running',
      value: metrics && String(metrics.trainings_running),
      format: String,
    },
    {
      key: 'models_deployed',
      title: 'Models Deployed',
      value: metrics && String(metrics.models_deployed),
      format: String,
    },
    {
      key: 'inference_calls',
      title: 'Inference Calls',
      value: metrics && compactCount(metrics.inference_calls_30d),
      format: compactCount,
    },
  ]

  return (
    <section
      aria-label="Workspace metrics"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map(({ key, title, value, format }) => {
        const series = history.data?.metrics[key]
        const values = series?.points.map((point) => point.value) ?? []
        const change = series && metricChange(series)

        return (
          <Card key={key} className="py-0">
            <CardContent className="flex items-end justify-between p-5">
              <div className="flex flex-col ">
                <p className="text-sm text-muted-foreground">{title}</p>
                {isPending ? (
                  <Skeleton className="mt-2 h-9 w-16" />
                ) : (
                  <p className="mt-2 text-3xl font-semibold tracking-tight">
                    {/* A dash when the request failed; the cards below say why. */}
                    {value ?? '—'}
                  </p>
                )}
                {history.isPending ? (
                  <Skeleton className="mt-2 h-4 w-24" />
                ) : (
                  change && (
                    <p className="mt-2 text-xs">
                      <span
                        className={cn(
                          'font-medium',
                          changeTone[change.direction],
                        )}
                      >
                        {changeArrow[change.direction]} {change.label}
                      </span>{' '}
                      <span className="text-muted-foreground/80">
                        vs last {HISTORY_DAYS}d
                      </span>
                    </p>
                  )
                )}
              </div>
              {history.isPending ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                values.length > 0 && (
                  <svg
                    viewBox="0 0 100 34"
                    className="h-8 w-24 text-primary"
                    role="img"
                    aria-label={`${title}, last ${HISTORY_DAYS} days: ${format(values[0])} to ${format(values[values.length - 1])}`}
                  >
                    <polyline
                      points={sparklinePoints(values)}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )
              )}
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
