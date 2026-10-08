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
import { useDashboardLayout } from '@/features/dashboard/context'
import {
  RecentActivityCard,
  UploadDialog,
  YourProjectsCard,
  LiveTrainingsCard,
  DeploymentHealthCard,
  WorkspaceMetrics,
} from './-components/dashboard'

export const Route = createFileRoute('/_app/')({ component: DashboardPage })

function DashboardPage() {
  const { preferences, updatePreferences, org } = useDashboardLayout()
  const [uploadOpen, setUploadOpen] = React.useState(false)

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

        <WorkspaceMetrics />

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
                        className={`flex size-5 items-center justify-center rounded-full ${index < 2 ? 'bg-success-muted text-success' : 'bg-muted text-muted-foreground'}`}
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
