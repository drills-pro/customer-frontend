import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from '@/components/ui/item'
import { deployments } from '@/features/dashboard/data'
import { useDashboardLayout } from '@/features/dashboard/context'
import { showUnavailable } from './helpers'
import { DashboardStatusBadge } from './dashboard-status-badge'
import { DashboardEmptyMessage } from './dashboard-empty-message'

export function DeploymentHealthCard() {
  const { org } = useDashboardLayout()
  const orgDeployments = deployments.filter((item) => item.orgId === org.id)

  return (
    <Card size="flush">
      <CardHeader className="border-b">
        <CardTitle>Deployment health</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {orgDeployments.length ? (
          <ItemGroup className="gap-0">
            {orgDeployments.slice(0, 3).map((deployment) => (
              <Item
                key={deployment.id}
                role="listitem"
                className="flex-nowrap rounded-none border-x-0 border-t-0 border-b border-border px-5 py-3 last:border-b-0"
              >
                <ItemContent>
                  <Button
                    variant="link"
                    className="font-semibold text-foreground hover:text-indigo-600"
                    onClick={() => showUnavailable(deployment.name)}
                  >
                    {deployment.name}
                  </Button>
                  <ItemDescription className="text-xs">
                    p95 {deployment.latency} · err {deployment.errorRate}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <DashboardStatusBadge status={deployment.status} />
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        ) : (
          <DashboardEmptyMessage
            title="No deployments"
            text="Deployed models will appear here."
          />
        )}
      </CardContent>
    </Card>
  )
}
