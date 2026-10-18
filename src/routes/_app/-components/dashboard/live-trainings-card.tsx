import { Activity } from 'lucide-react'

import { Badge, BadgeDot } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Item, ItemFooter, ItemGroup, ItemHeader } from '@/components/ui/item'
import { Progress } from '@/components/ui/progress'
import { runName } from '@/features/dashboard/format'
import { trainingPlaceholders } from '@/features/dashboard/placeholders'
import { useDashboardSummary } from '@/features/dashboard/queries'
import type { ApiLiveTraining } from '@/features/dashboard/api'
import { unavailable } from '@/lib/unavailable'
import { CardError, CardLoading } from './card-states'

// core-api's in-flight statuses; a finished run is not on this card at all.
const runStatus = {
  running: { label: 'Running', tone: 'info' },
  submitted: { label: 'Queued', tone: 'neutral' },
} as const satisfies Record<ApiLiveTraining['status'], unknown>

export function LiveTrainingsCard() {
  const { data, error, isPending, refetch } = useDashboardSummary()
  const orgTrainings = data?.live_trainings ?? []

  return (
    <Card size="flush">
      <CardHeader className="border-b">
        <CardTitle>Live trainings</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {isPending ? (
          <CardLoading />
        ) : error ? (
          <CardError
            title="Could not load trainings"
            error={error}
            onRetry={() => void refetch()}
          />
        ) : orgTrainings.length ? (
          <ItemGroup className="gap-0">
            {orgTrainings.slice(0, 3).map((run) => {
              const status = runStatus[run.status]
              const name = runName(run.id)
              return (
                <Item
                  key={run.id}
                  role="listitem"
                  className="block rounded-none border-x-0 border-t-0 border-b border-border px-5 py-3.5 last:border-b-0"
                >
                  <ItemHeader className="mb-2">
                    {/* The run page still reads mock data, so no link yet. */}
                    <Button
                      variant="link"
                      className="font-medium"
                      onClick={() => unavailable(name)}
                    >
                      {name} · {run.project_name}
                    </Button>
                    <Badge variant={status.tone}>
                      <BadgeDot
                        className={
                          run.status === 'running' ? 'animate-pulse' : undefined
                        }
                      />
                      {status.label}
                    </Badge>
                  </ItemHeader>
                  <Progress
                    value={trainingPlaceholders.progress}
                    className="h-1.5 [&_[data-slot=progress-indicator]]:bg-info"
                  />
                  <ItemFooter className="mt-1.5 text-xs text-muted-foreground">
                    <span>
                      Epoch {trainingPlaceholders.currentEpoch}/
                      {run.config?.trainer?.epochs ?? '—'}
                    </span>
                    <span>ETA {trainingPlaceholders.eta}</span>
                  </ItemFooter>
                </Item>
              )
            })}
          </ItemGroup>
        ) : (
          <Empty className="min-h-36 gap-3 py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Activity />
              </EmptyMedia>
              <EmptyTitle>No live trainings</EmptyTitle>
              <EmptyDescription>
                Running jobs will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
