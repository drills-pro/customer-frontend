import { Link } from '@tanstack/react-router'
import { Rocket } from 'lucide-react'

import { DeploymentStatusBadge } from '@/features/deployments/components/deployment-status-badge'
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
import { useOrgDeployments } from '@/features/dashboard/hooks'

export function DeploymentHealthCard() {
  const deployments = useOrgDeployments()

  return (
    <Card size="flush">
      <CardHeader className="border-b">
        <CardTitle>Deployment health</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {deployments.length ? (
          <ItemGroup className="gap-0">
            {deployments.slice(0, 3).map((deployment) => (
              <Item
                key={deployment.id}
                role="listitem"
                className="flex-nowrap rounded-none border-x-0 border-t-0 border-b border-border px-5 py-3 last:border-b-0"
              >
                <ItemContent>
                  <Button
                    asChild
                    variant="link"
                    className="font-semibold text-foreground hover:text-primary self-start"
                  >
                    <Link
                      to="/projects/$projectId/deployments/$deploymentId"
                      params={{
                        projectId: deployment.projectId,
                        deploymentId: deployment.id,
                      }}
                    >
                      {deployment.name}
                    </Link>
                  </Button>
                  <ItemDescription className="text-xs">
                    p95 {deployment.latencyP95} · err {deployment.errorRate}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <DeploymentStatusBadge status={deployment.status} />
                </ItemActions>
              </Item>
            ))}
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
