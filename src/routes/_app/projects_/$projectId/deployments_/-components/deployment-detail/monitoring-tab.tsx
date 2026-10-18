import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import { cn } from 'cn'
import { useDeploymentMetrics } from '@/features/deployments/queries'
import { useCurrentDeployment } from './use-current-deployment'

/** Parses the leading number out of `140 ms`; `—` has none. */
function ms(value: string) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function MonitoringTab({
  onEditScaling,
}: {
  onEditScaling: () => void
}) {
  const { project, deployment } = useCurrentDeployment()
  const metrics = useDeploymentMetrics(project.id, deployment.id).data
  const volumeData = (metrics?.request_volume ?? []).map((point) => ({
    hour: point.hours_ago === 0 ? 'now' : `${point.hours_ago}h ago`,
    requests: point.requests,
  }))
  const live = deployment.status === 'Live'
  /**
   * All three percentiles share one scale — p99, the slowest value shown — so
   * the bars can actually be compared against each other.
   */
  const scale = ms(deployment.latencyP99) || 1
  const percentiles = [
    ['p50', deployment.latencyP50, 'half of requests finish faster than this'],
    ['p95', deployment.latencyP95, 'the number to quote in an SLA'],
    ['p99', deployment.latencyP99, 'the slowest 1 in 100'],
  ] as const
  const percentileTone = [
    '[&_[data-slot=progress-indicator]]:bg-success',
    '[&_[data-slot=progress-indicator]]:bg-warning',
    '[&_[data-slot=progress-indicator]]:bg-destructive',
  ]

  return (
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-3">
      <div className="grid min-w-0 gap-6 lg:col-span-2">
        <Card size="flush">
          <CardHeader className="flex-row items-center border-b [--card-section:--spacing(3.5)]">
            <CardTitle className="mr-auto">Request volume</CardTitle>
            <span className="text-xs text-muted-foreground">
              hourly · last 24h
            </span>
          </CardHeader>
          <CardContent className="p-5">
            {live ? (
              <ChartContainer
                config={{
                  requests: { label: 'Requests', color: 'var(--primary)' },
                }}
                className="aspect-auto h-56 w-full"
              >
                <AreaChart data={volumeData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    // Both ends must be labelled: "now" is the point people read.
                    interval="preserveStartEnd"
                    minTickGap={48}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    tickFormatter={(value: number) =>
                      value >= 1000
                        ? `${(value / 1000).toFixed(1)}k`
                        : `${value}`
                    }
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    dataKey="requests"
                    type="monotone"
                    stroke="var(--color-requests)"
                    strokeWidth={2.5}
                    fill="var(--color-requests)"
                    fillOpacity={0.14}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <Empty className="min-h-56 border-0">
                <EmptyHeader>
                  <EmptyTitle>No traffic</EmptyTitle>
                  <EmptyDescription>
                    This deployment is {deployment.status.toLowerCase()}, so it
                    is not receiving requests.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card size="flush">
          <CardHeader className="flex-row items-center border-b [--card-section:--spacing(3.5)]">
            <CardTitle className="mr-auto">Latency distribution</CardTitle>
            <span className="text-xs text-muted-foreground">
              scale 0 – {deployment.latencyP99}
            </span>
          </CardHeader>
          <CardContent className="p-5">
            {percentiles.map(([label, value, note], index) => (
              <div key={label} className="mt-4 first:mt-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[13px] font-medium">
                    {label}
                  </span>
                  <span className="text-[15px] font-semibold tabular-nums">
                    {value}
                  </span>
                </div>
                <Progress
                  value={live ? (ms(value) / scale) * 100 : 0}
                  aria-label={`${label} latency`}
                  className={cn('mt-1.5 h-2', percentileTone[index])}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card size="flush">
          <CardHeader className="border-b [--card-section:--spacing(3.5)]">
            <CardTitle>Live metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <dl className="divide-y">
              {(
                [
                  ['Requests (24h)', deployment.requests24h],
                  ['p50 latency', deployment.latencyP50],
                  ['p95 latency', deployment.latencyP95],
                  ['p99 latency', deployment.latencyP99],
                  ['Error rate', deployment.errorRate],
                  [
                    'Replicas',
                    `${deployment.activeReplicas} / ${deployment.maxReplicas}`,
                  ],
                  ['Cost today', deployment.costPerDay],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13px]"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd
                    className={cn(
                      'font-medium tabular-nums',
                      value === '—' && 'text-muted-foreground',
                    )}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card size="flush">
          <CardHeader className="border-b [--card-section:--spacing(3.5)]">
            <CardTitle>Autoscaling</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {(
              [
                ['Min replicas', String(deployment.minReplicas)],
                ['Max replicas', String(deployment.maxReplicas)],
                ['Target concurrency', String(deployment.targetConcurrency)],
                [
                  'Scale-down delay',
                  `${Math.round(deployment.scaleDownDelaySeconds / 60)} min`,
                ],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between py-1.5 text-[13px]"
              >
                <span className="text-muted-foreground">{label}</span>
                <b className="font-semibold tabular-nums">{value}</b>
              </div>
            ))}
            <Button
              variant="outline"
              size="lg"
              className="mt-4 w-full"
              onClick={onEditScaling}
            >
              Edit scaling
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
