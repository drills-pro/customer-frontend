import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'

export function DeploymentNotFound({ projectId }: { projectId: string }) {
  return (
    <main
      id="dashboard-main"
      className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-1 items-center p-6"
    >
      <Empty className="w-full border bg-card">
        <EmptyHeader>
          <EmptyTitle>Deployment not found</EmptyTitle>
          <EmptyDescription>
            This deployment does not exist in the selected project.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to="/projects/$projectId/deployments" params={{ projectId }}>
              Return to deployments
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
