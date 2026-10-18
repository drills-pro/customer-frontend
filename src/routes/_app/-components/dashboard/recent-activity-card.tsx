import * as React from 'react'
import {
  Check,
  CircleUserRound,
  Database,
  History,
  Rocket,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
} from '@/components/ui/item'
import { toActivity } from '@/features/dashboard/format'
import { useDashboardSummary } from '@/features/dashboard/queries'
import type { Activity } from '@/features/dashboard/data'
import { unavailable } from '@/lib/unavailable'
import { CardError, CardLoading } from './card-states'

const activityStyles: Record<Activity['icon'], string> = {
  success: 'bg-success-muted text-success',
  dataset: 'bg-warning-muted text-warning',
  deployment: 'bg-info-muted text-info',
  error: 'bg-destructive-muted text-destructive',
  person: 'bg-primary-muted text-primary',
}

const activityIcons: Record<Activity['icon'], typeof Check> = {
  success: Check,
  dataset: Database,
  deployment: Rocket,
  error: X,
  person: CircleUserRound,
}

export function RecentActivityCard() {
  const { data, error, isPending, refetch } = useDashboardSummary()
  const orgActivity = (data?.activity ?? []).map((item) => toActivity(item))
  const [allActivity, setAllActivity] = React.useState(false)

  return (
    <Card size="flush">
      <CardHeader className="border-b">
        <CardTitle>Recent activity</CardTitle>
        <CardAction>
          <Button
            variant="link"
            onClick={() => setAllActivity((value) => !value)}
          >
            {allActivity ? 'Show less' : 'View all'}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {isPending ? (
          <CardLoading rows={5} />
        ) : error ? (
          <CardError
            title="Could not load activity"
            error={error}
            onRetry={() => void refetch()}
          />
        ) : orgActivity.length ? (
          <ItemGroup className="gap-0">
            {orgActivity.slice(0, allActivity ? 20 : 5).map((item) => {
              const Icon = activityIcons[item.icon]
              return (
                <Item
                  key={item.id}
                  role="listitem"
                  className="min-h-15 flex-nowrap rounded-none border-x-0 border-t-0 border-b border-border px-4 py-3.5 last:border-b-0 sm:px-5"
                >
                  <ItemMedia>
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${activityStyles[item.icon]}`}
                    >
                      <Icon className="size-4" />
                    </span>
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <p>
                      <strong className="font-semibold">{item.lead}</strong>{' '}
                      <span>{item.text}</span>
                    </p>
                  </ItemContent>
                  <ItemActions>
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                      {item.time}
                    </span>
                    <Button
                      variant="link"
                      className="shrink-0"
                      onClick={() => unavailable(item.action)}
                    >
                      {item.action}
                    </Button>
                  </ItemActions>
                </Item>
              )
            })}
          </ItemGroup>
        ) : (
          <Empty className="min-h-36 gap-3 py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <History />
              </EmptyMedia>
              <EmptyTitle>No activity yet</EmptyTitle>
              <EmptyDescription>
                Workspace activity will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
