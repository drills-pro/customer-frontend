import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useDashboardLayout } from '@/features/dashboard/context'
import {
  BasicsStep,
  StartMethodStep,
  steps,
  TaskStep,
  useNewProjectDraft,
} from './-components/new-project'

export const Route = createFileRoute('/_app/projects_/new')({
  component: NewProjectPage,
})

function NewProjectPage() {
  const { hydrated } = useDashboardLayout()

  if (!hydrated) {
    return <main id="dashboard-main" className="min-h-96 flex-1" />
  }

  return <NewProjectFlow />
}

function NewProjectFlow() {
  const { org } = useDashboardLayout()
  const draft = useNewProjectDraft()
  const { step, setStep } = draft

  return (
    <main
      id="dashboard-main"
      className="mx-auto w-full max-w-[1448px] min-w-0 flex-1 p-4 sm:p-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create project
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up a new project in {org.name}.
        </p>
      </div>

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-3">
        <Card size="flush" className="min-w-0 lg:col-span-2">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center gap-2">
              {steps.map((label, index) => (
                <React.Fragment key={label}>
                  {index > 0 && (
                    <div
                      className={`h-px flex-1 ${index <= step ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => index < step && setStep(index)}
                    disabled={index > step}
                    aria-current={step === index ? 'step' : undefined}
                    className="h-auto gap-2 px-0 text-sm font-medium hover:bg-transparent disabled:cursor-not-allowed"
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${index < step ? 'bg-emerald-500 text-white' : index === step ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {index < step ? (
                        <Check className="size-3.5" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span
                      className={
                        index === step ? 'text-foreground' : 'text-slate-500'
                      }
                    >
                      {label}
                    </span>
                  </Button>
                </React.Fragment>
              ))}
            </div>

            {step === 0 && <BasicsStep draft={draft} orgName={org.name} />}
            {step === 1 && <TaskStep draft={draft} />}
            {step === 2 && <StartMethodStep draft={draft} orgName={org.name} />}

            <div className="mt-8 flex justify-between border-t pt-5">
              {step === 0 ? (
                <Button variant="outline" asChild>
                  <Link to="/projects">Cancel</Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setStep((current) => current - 1)}
                >
                  <ChevronLeft />
                  Back
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button
                  disabled={!draft.canContinue}
                  onClick={() => setStep((current) => current + 1)}
                >
                  Continue
                  <ChevronRight />
                </Button>
              ) : (
                <Button
                  disabled={!draft.canSubmit || draft.submitting}
                  onClick={draft.create}
                >
                  {draft.submitting ? 'Creating…' : 'Create project'}
                  <ChevronRight />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <aside className="grid gap-4">
          <Card size="lg">
            <CardContent className="grid gap-3">
              <h3 className="text-sm font-semibold">Summary</h3>
              {draft.summaryRows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-3 border-b py-2 text-sm last:border-0"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="max-w-[60%] text-right font-medium">
                    {value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}
