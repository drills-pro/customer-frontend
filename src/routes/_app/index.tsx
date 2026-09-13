import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, Plus, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { allProjects, deployments, trainings } from '@/features/dashboard/data'
import { useDashboardLayout } from '@/features/dashboard/context'
import {
  RecentActivityCard,
  Sparkline,
  UploadDialog,
  YourProjectsCard,
  LiveTrainingsCard,
  DeploymentHealthCard,
} from './-components/dashboard'

export const Route = createFileRoute('/_app/')({ component: DashboardPage })

function DashboardPage() {
  const { preferences, updatePreferences, org } = useDashboardLayout()
  const [uploadOpen, setUploadOpen] = React.useState(false)

  const orgProjects = allProjects(preferences).filter(
    (item) => item.orgId === org.id,
  )
  const orgTrainings = trainings.filter((item) => item.orgId === org.id)
  const orgDeployments = deployments.filter((item) => item.orgId === org.id)

  return (
    <>
      <main
        id="dashboard-main"
        className="mx-auto w-full max-w-[1448px] flex-1 p-4 sm:p-6"
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Good morning, Alex <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-1 text-muted-foreground">
              Here is what happened across your workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              variant="outline"
              className="px-3.5"
              onClick={() => setUploadOpen(true)}
            >
              <Upload />
              Upload Dataset
            </Button>
            <Button asChild size="lg" className="px-3.5">
              <Link to="/projects/new">
                <Plus />
                New Project
              </Link>
            </Button>
          </div>
        </div>

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
              String(orgTrainings.length),
              '+2',
              '2,27 17,20 30,23 45,13 59,16 73,7 87,10 99,2',
            ],
            [
              'Models Deployed',
              String(
                orgDeployments.filter((item) => item.status === 'Live').length,
              ),
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
                    <span className="font-medium text-emerald-600">
                      ▲ {change}
                    </span>{' '}
                    <span className="text-slate-400">vs last 30d</span>
                  </p>
                </div>
                <Sparkline points={points} />
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="grid gap-6">
            <RecentActivityCard />
            <YourProjectsCard />
          </div>
          <div className="grid gap-6">
            <LiveTrainingsCard />
            <DeploymentHealthCard />
            {!preferences.onboardingDismissed && (
              <Card size="flush">
                <CardHeader className="border-b">
                  <CardTitle>Getting started</CardTitle>
                  <CardAction>
                    <Button
                      variant="link"
                      className="text-muted-foreground"
                      onClick={() =>
                        updatePreferences({ onboardingDismissed: true })
                      }
                    >
                      Dismiss
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-3 p-5">
                  {[
                    'Create a project',
                    'Upload a dataset',
                    'Run your first training',
                    'Deploy a model',
                  ].map((label, index) => (
                    <div
                      className="flex items-center gap-3 text-sm"
                      key={label}
                    >
                      <span
                        className={`flex size-5 items-center justify-center rounded-full ${index < 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {index < 2 ? <Check className="size-3.5" /> : index + 1}
                      </span>
                      {label}
                    </div>
                  ))}
                  <Progress value={50} className="mt-4 h-1.5" />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        organizationId={org.id}
        onUpload={(activity) =>
          updatePreferences({
            uploads: [activity, ...preferences.uploads],
          })
        }
      />
    </>
  )
}
