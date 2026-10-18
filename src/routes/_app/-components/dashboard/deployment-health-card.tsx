import { Rocket } from 'lucide-react'

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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from '@/components/ui/item'
import { deploymentPlaceholders } from '@/features/dashboard/placeholders'
import { useDashboardSummary } from '@/features/dashboard/queries'
import type { ApiDeployment } from '@/features/dashboard/api'
import { unavailable } from '@/lib/unavailable'
import { CardError, CardLoading } from './card-states'

const deploymentStatus = {
  active: { label: 'Live', tone: 'success' },
  deploying: { label: 'Deploying', tone: 'warning' },
  failed: { label: 'Failed', tone: 'error' },
} as const satisfies Record<ApiDeployment['status'], unknown>

export function DeploymentHealthCard() {
  const { data, error, isPending, refetch } = useDashboardSummary()
  const deployments = data?.deployments ?? []

  return (
    <Card size="flush">
      <CardHeader className="border-b">
        <CardTitle>Deployment health</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {isPending ? (
          <CardLoading />
        ) : error ? (
          <CardError
            title="Could not load deployments"
            error={error}
            onRetry={() => void refetch()}
          />
        ) : deployments.length ? (
          <ItemGroup className="gap-0">
            {deployments.slice(0, 3).map((deployment) => {
              const status = deploymentStatus[deployment.status]
              return (
                <Item
                  key={deployment.id}
                  role="listitem"
                  className="flex-nowrap rounded-none border-x-0 border-t-0 border-b border-border px-5 py-3 last:border-b-0"
                >
                  <ItemContent>
                    {/* The deployment page still reads mock data, so no link yet. */}
                    <Button
                      variant="link"
                      className="self-start font-semibold text-foreground hover:text-primary"
                      onClick={() => unavailable(deployment.route_prefix)}
                    >
                      {deployment.route_prefix}
                    </Button>
                    <ItemDescription className="text-xs">
                      p95 {deploymentPlaceholders.latencyP95} · err{' '}
                      {deploymentPlaceholders.errorRate}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Badge variant={status.tone}>
                      <BadgeDot
                        className={
                          deployment.status === 'active'
                            ? 'animate-pulse'
                            : undefined
                        }
                      />
                      {status.label}
                    </Badge>
                  </ItemActions>
                </Item>
              )
            })}
          </ItemGroup>
        ) : (
          <Empty className="min-h-36 gap-3 py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Rocket />
              </EmptyMedia>
              <EmptyTitle>No deployments</EmptyTitle>
              <EmptyDescription>
                Deployed models will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
