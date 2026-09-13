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
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { allProjects } from '@/features/dashboard/data'
import { useDashboardLayout } from '@/features/dashboard/context'
import { showUnavailable } from './helpers'
import { DashboardEmptyMessage } from './dashboard-empty-message'

export function YourProjectsCard() {
  const { preferences, org } = useDashboardLayout()
  const orgProjects = allProjects(preferences).filter(
    (item) => item.orgId === org.id,
  )

  return (
    <Card size="flush">
      <CardHeader className="border-b">
        <CardTitle>Your projects</CardTitle>
        <CardAction>
          <Button
            variant="link"
            onClick={() => showUnavailable('All projects')}
          >
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
                className="p-0 hover:border-indigo-300 hover:bg-indigo-50/40"
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => showUnavailable(project.name)}
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
                    <ItemDescription className="text-slate-400">
                      Updated {project.updated}
                    </ItemDescription>
                  </ItemContent>
                </Button>
              </Item>
            ))}
          </div>
        ) : (
          <DashboardEmptyMessage
            title="Create your first project"
            text="New projects for this organization will appear here."
          />
        )}
      </CardContent>
    </Card>
  )
}
