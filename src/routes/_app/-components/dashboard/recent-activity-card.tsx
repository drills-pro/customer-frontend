import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
} from '@/components/ui/item'
import { activities } from '@/features/dashboard/data'
import { useDashboardLayout } from '@/features/dashboard/context'
import { showUnavailable } from './helpers'
import { ActivityMark } from './activity-mark'
import { DashboardEmptyMessage } from './dashboard-empty-message'

export function RecentActivityCard() {
  const { preferences, org } = useDashboardLayout()
  const [allActivity, setAllActivity] = React.useState(false)
  const orgActivity = [...preferences.uploads, ...activities].filter(
    (item) => item.orgId === org.id,
  )

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
        {orgActivity.length ? (
          <ItemGroup className="gap-0">
            {orgActivity.slice(0, allActivity ? 20 : 5).map((item) => (
              <Item
                key={item.id}
                role="listitem"
                className="min-h-15 flex-nowrap rounded-none border-x-0 border-t-0 border-b border-border px-4 py-3.5 last:border-b-0 sm:px-5"
              >
                <ItemMedia>
                  <ActivityMark kind={item.icon} />
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
                    onClick={() => showUnavailable(item.action)}
                  >
                    {item.action}
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        ) : (
          <DashboardEmptyMessage
            title="No activity yet"
            text="Workspace activity will appear here."
          />
        )}
      </CardContent>
    </Card>
  )
}
