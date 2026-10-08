import { FolderKanban } from 'lucide-react'

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
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { useOrgProjects } from '@/features/dashboard/hooks'
import { unavailable } from '@/lib/unavailable'

export function YourProjectsCard() {
  const orgProjects = useOrgProjects()

  return (
    <Card size="flush">
      <CardHeader className="border-b">
        <CardTitle>Your projects</CardTitle>
        <CardAction>
          <Button variant="link" onClick={() => unavailable('All projects')}>
            View all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {orgProjects.length ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {orgProjects.slice(0, 4).map((project) => (
              <Item
                asChild
                variant="outline"
                key={project.id}
                className="p-0 hover:border-primary/40 hover:bg-primary-muted/40"
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => unavailable(project.name)}
                  className="h-auto w-full justify-start gap-3 p-3 text-left whitespace-normal"
                >
                  <ItemMedia>
                    <span
                      className="size-6 rounded-md"
                      style={{ backgroundColor: project.color }}
                    />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="text-base">{project.name}</ItemTitle>
                    <ItemDescription>
                      {project.task} · {project.models} models
                    </ItemDescription>
                    <ItemDescription className="text-muted-foreground/80">
                      Updated {project.updated}
                    </ItemDescription>
                  </ItemContent>
                </Button>
              </Item>
            ))}
          </div>
        ) : (
          <Empty className="min-h-36 gap-3 py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderKanban />
              </EmptyMedia>
              <EmptyTitle>Create your first project</EmptyTitle>
              <EmptyDescription>
                New projects for this organization will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
