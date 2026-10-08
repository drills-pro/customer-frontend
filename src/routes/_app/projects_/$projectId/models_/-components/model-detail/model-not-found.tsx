import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'

export function ModelNotFound({ projectId }: { projectId: string }) {
  return (
    <main
      id="dashboard-main"
      className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-1 items-center p-6"
    >
      <Empty className="w-full border bg-card">
        <EmptyHeader>
          <EmptyTitle>Model not found</EmptyTitle>
          <EmptyDescription>
            This model does not exist in the selected project.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to="/projects/$projectId/models" params={{ projectId }}>
              Return to models
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
