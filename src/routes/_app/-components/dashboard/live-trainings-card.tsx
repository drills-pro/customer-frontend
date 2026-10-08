import { Link } from '@tanstack/react-router'
import { Activity } from 'lucide-react'

import { TrainingStatusBadge } from '@/features/training/components/training-status-badge'
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
import { useOrgTrainingRuns } from '@/features/dashboard/hooks'
import { runProgressAt } from '@/features/dashboard/selectors/training-runs'
import { useNow } from '@/hooks/use-now'

export function LiveTrainingsCard() {
  const now = useNow()
  const orgTrainings = useOrgTrainingRuns()
    .map((run) => ({ run, live: runProgressAt(run, now) }))
    .filter(({ live }) => live.status !== 'Stopped')

  return (
    <Card size="flush">
      <CardHeader className="border-b">
        <CardTitle>Live trainings</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {orgTrainings.length ? (
          <ItemGroup className="gap-0">
            {orgTrainings.slice(0, 3).map(({ run, live }) => (
              <Item
                key={run.id}
                role="listitem"
                className="block rounded-none border-x-0 border-t-0 border-b border-border px-5 py-3.5 last:border-b-0"
              >
                <ItemHeader className="mb-2">
                  <Button asChild variant="link" className="font-medium">
                    <Link
                      to="/projects/$projectId/training/$runId"
                      params={{ projectId: run.projectId, runId: run.id }}
                    >
                      {run.name}
                    </Link>
                  </Button>
                  <TrainingStatusBadge status={live.status} />
                </ItemHeader>
                <Progress
                  value={live.progress}
                  className="h-1.5 [&_[data-slot=progress-indicator]]:bg-info"
                />
                <ItemFooter className="mt-1.5 text-xs text-muted-foreground">
                  <span>
                    Epoch {live.epoch}/{run.epochs}
                  </span>
                  <span>ETA {live.eta}</span>
                </ItemFooter>
              </Item>
            ))}
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
