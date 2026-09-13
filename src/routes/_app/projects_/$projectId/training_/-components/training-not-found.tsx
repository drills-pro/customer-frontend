import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'

export function TrainingNotFound() {
  return (
    <main
      id="dashboard-main"
      className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-1 items-center p-6"
    >
      <Empty className="w-full border bg-white">
        <EmptyHeader>
          <EmptyTitle>Project not found</EmptyTitle>
          <EmptyDescription>
            This project is not available in your organization.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to="/projects">Return to projects</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
