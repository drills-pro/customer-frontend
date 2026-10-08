import { Card, CardContent } from '@/components/ui/card'
import { useDashboardLayout } from '@/features/dashboard/context'
import {
  useOrgDeployments,
  useOrgProjects,
  useOrgTrainingRuns,
} from '@/features/dashboard/hooks'
import { runProgressAt } from '@/features/dashboard/selectors/training-runs'
import { useNow } from '@/hooks/use-now'

export function WorkspaceMetrics() {
  const { org } = useDashboardLayout()
  const now = useNow()
  const orgProjects = useOrgProjects()
  const runningTrainings = useOrgTrainingRuns().filter(
    (run) => runProgressAt(run, now).status === 'Running',
  )
  const deployments = useOrgDeployments()

  return (
    <section
      aria-label="Workspace metrics"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {[
        [
          'Active Projects',
          String(orgProjects.length || 0),
          '+3',
          '3,25 20,18 34,21 49,11 63,14 76,6 89,9 99,2',
        ],
        [
          'Trainings Running',
          String(runningTrainings.length),
          '+2',
          '2,27 17,20 30,23 45,13 59,16 73,7 87,10 99,2',
        ],
        [
          'Models Deployed',
          String(deployments.filter((item) => item.status === 'Live').length),
          '+1',
          '2,27 17,20 31,23 46,13 60,16 74,7 88,10 99,3',
        ],
        [
          'Inference Calls',
          org.id === 'acme' ? '182k' : org.id === 'northwind' ? '31k' : '0',
          '+24%',
          '2,28 18,21 32,24 47,13 61,16 76,7 89,10 99,3',
        ],
      ].map(([title, value, change, points]) => (
        <Card key={title} className="py-0">
          <CardContent className="flex items-end justify-between p-5">
            <div className="flex flex-col ">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {value}
              </p>
              <p className="mt-2 text-xs">
                <span className="font-medium text-success">▲ {change}</span>{' '}
                <span className="text-muted-foreground/80">vs last 30d</span>
              </p>
            </div>
            <svg
              viewBox="0 0 100 34"
              className="h-8 w-24 text-primary"
              aria-hidden="true"
            >
              <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
