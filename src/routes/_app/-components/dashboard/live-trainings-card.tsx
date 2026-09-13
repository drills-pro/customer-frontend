import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Item, ItemFooter, ItemGroup, ItemHeader } from '@/components/ui/item'
import { Progress } from '@/components/ui/progress'
import { trainings } from '@/features/dashboard/data'
import { useDashboardLayout } from '@/features/dashboard/context'
import { showUnavailable } from './helpers'
import { DashboardStatusBadge } from './dashboard-status-badge'
import { DashboardEmptyMessage } from './dashboard-empty-message'

export function LiveTrainingsCard() {
  const { org } = useDashboardLayout()
  const orgTrainings = trainings.filter((item) => item.orgId === org.id)

  return (
    <Card size="flush">
      <CardHeader className="border-b">
        <CardTitle>Live trainings</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {orgTrainings.length ? (
          <ItemGroup className="gap-0">
            {orgTrainings.slice(0, 3).map((run) => (
              <Item
                key={run.id}
                role="listitem"
                className="block rounded-none border-x-0 border-t-0 border-b border-border px-5 py-3.5 last:border-b-0"
              >
                <ItemHeader className="mb-2">
                  <Button
                    variant="link"
                    className="font-medium"
                    onClick={() => showUnavailable(run.name)}
                  >
                    {run.name}
                  </Button>
                  <DashboardStatusBadge status="Running" />
                </ItemHeader>
                <Progress
                  value={run.progress}
                  className="h-1.5 [&_[data-slot=progress-indicator]]:bg-sky-500"
                />
                <ItemFooter className="mt-1.5 text-xs text-muted-foreground">
                  <span>
                    Epoch {run.epoch}/{run.epochs}
                  </span>
                  <span>ETA {run.eta}</span>
                </ItemFooter>
              </Item>
            ))}
          </ItemGroup>
        ) : (
          <DashboardEmptyMessage
            title="No live trainings"
            text="Running jobs will appear here."
          />
        )}
      </CardContent>
    </Card>
  )
}
