import { Link } from '@tanstack/react-router'
import { Box, ChevronDown, Cpu, Database } from 'lucide-react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { cn } from 'cn'
import { formatAccuracy } from '../../../-components/model-list'
import { useCurrentModel } from './use-current-model'

/** Below this, a class is worth investigating before the model ships. */
const WEAK_CLASS_ACCURACY = 85

/**
 * The three lineage steps point at three different routes, so each caller owns
 * its own `Link` and this only supplies the shared body and box.
 */
const lineageStepClass =
  'flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 transition-colors'

function LineageBody({
  icon: Icon,
  title,
  description,
  current = false,
}: {
  icon: typeof Box
  title: string
  description: string
  current?: boolean
}) {
  return (
    <>
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          current
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            'truncate font-mono text-[13px] font-semibold',
            current ? 'text-primary' : 'text-foreground',
          )}
        >
          {title}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {description}
        </p>
      </div>
    </>
  )
}

function LineageArrow() {
  return (
    <ChevronDown
      className="ml-7 size-4 text-muted-foreground"
      aria-hidden="true"
    />
  )
}

export function OverviewTab() {
  const { model, versions, detail } = useCurrentModel()
  const history = versions.map((item) => ({
    version: `v${item.version}`,
    accuracy: item.accuracy,
  }))

  return (
    <>
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Card size="flush">
            <CardHeader className="flex-row items-center border-b [--card-section:--spacing(3.5)]">
              <CardTitle className="mr-auto">
                Accuracy across versions
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                higher is better
              </span>
            </CardHeader>
            <CardContent className="p-5">
              {history.length > 1 ? (
                <ChartContainer
                  config={{
                    accuracy: { label: 'Accuracy', color: 'var(--primary)' },
                  }}
                  className="aspect-auto h-52 w-full"
                >
                  <LineChart data={history} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="version"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      domain={['dataMin - 2', 'dataMax + 1']}
                      tickFormatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      dataKey="accuracy"
                      type="monotone"
                      stroke="var(--color-accuracy)"
                      strokeWidth={2.5}
                      dot={{ r: 3.5 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <Empty className="min-h-52 border-0">
                  <EmptyHeader>
                    <EmptyTitle>Only one version so far</EmptyTitle>
                    <EmptyDescription>
                      Train {model.name} again to compare accuracy across
                      versions.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>

        <Card size="flush">
          <CardHeader className="border-b [--card-section:--spacing(3.5)]">
            <CardTitle>Lineage</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 p-3">
            <Link
              to="/projects/$projectId/datasets/$datasetId"
              params={{
                projectId: model.projectId,
                datasetId: detail.datasetId,
              }}
              className={cn(lineageStepClass, 'hover:bg-muted')}
            >
              <LineageBody
                icon={Database}
                title={detail.datasetId}
                description="Dataset"
              />
            </Link>
            <LineageArrow />
            <Link
              to="/projects/$projectId/training/$runId"
              params={{ projectId: model.projectId, runId: model.runId }}
              className={cn(lineageStepClass, 'hover:bg-muted')}
            >
              <LineageBody
                icon={Cpu}
                title={`run ${model.runId}`}
                description="Training run"
              />
            </Link>
            <LineageArrow />
            <div className={cn(lineageStepClass, 'bg-primary-muted')}>
              <LineageBody
                icon={Box}
                title={`${model.name} v${model.version}`}
                description="This model"
                current
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {detail.perClassAccuracy.length > 0 ? (
        <Card size="flush" className="mt-6">
          <CardHeader className="flex-row items-center border-b [--card-section:--spacing(3.5)]">
            <CardTitle className="mr-auto">Per-class accuracy</CardTitle>
            <span className="text-xs text-muted-foreground">
              {detail.perClassAccuracy.length} weakest classes
            </span>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-5">Class</TableHead>
                  <TableHead className="text-right">Accuracy</TableHead>
                  <TableHead className="text-right">Support</TableHead>
                  <TableHead className="w-[220px]">Distribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.perClassAccuracy.map((entry) => {
                  const weak = entry.accuracy < WEAK_CLASS_ACCURACY
                  return (
                    <TableRow key={entry.label}>
                      <TableCell className="px-5">
                        <code className="text-[13px]">{entry.label}</code>
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-semibold tabular-nums',
                          weak ? 'text-warning' : 'text-foreground',
                        )}
                      >
                        {formatAccuracy(entry.accuracy)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {entry.support.toLocaleString('en-US')}
                      </TableCell>
                      <TableCell>
                        <Progress
                          value={entry.accuracy}
                          aria-label={`${entry.label} accuracy`}
                          className={cn(
                            'h-1.5',
                            weak &&
                              '[&_[data-slot=progress-indicator]]:bg-warning',
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </>
  )
}
