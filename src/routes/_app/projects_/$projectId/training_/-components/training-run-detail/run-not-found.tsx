import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'

export function RunNotFound({ projectId }: { projectId: string }) {
  return (
    <main
      id="dashboard-main"
      className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-1 items-center p-6"
    >
      <Empty className="w-full border bg-white">
        <EmptyHeader>
          <EmptyTitle>Training run not found</EmptyTitle>
          <EmptyDescription>
            This run does not exist in the selected project.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to="/projects/$projectId/overview" params={{ projectId }}>
              Return to project
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
