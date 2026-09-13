import * as React from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FolderKanban,
  Sparkles,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useDashboardLayout } from '@/features/dashboard/context'
import {
  createProjectRecord,
  createEmptyProjectOverview,
  generateProjectId,
  isProjectNameTaken,
  projectRegions,
  projectTaskTypes,
} from '@/features/dashboard/data'
import type { CreatedProject } from '@/features/dashboard/data'
import { ProjectMark } from '@/components/dashboard/project-ui'
import {
  cloneCandidatesFor,
  createTemplateDataset,
  templatesForTask,
} from '@/features/dashboard/templates'

export const Route = createFileRoute('/_app/projects_/new')({
  component: NewProjectPage,
})

const steps = ['Basics', 'Task type', 'Start method'] as const

type StartMethod = 'upload' | 'template' | 'clone'

const startMethods: Array<{
  id: StartMethod
  label: string
  description: string
  icon: typeof Upload
}> = [
  {
    id: 'upload',
    label: 'Upload dataset',
    description: 'Start empty and upload your own data right after creation.',
    icon: Upload,
  },
  {
    id: 'template',
    label: 'Use a template',
    description: 'Seed the project with a ready sample dataset for this task.',
    icon: Sparkles,
  },
  {
    id: 'clone',
    label: 'Clone a project',
    description: 'Reuse the setup from an existing compatible project.',
    icon: Copy,
  },
]

function StepHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  )
}

function NewProjectPage() {
  const navigate = useNavigate()
  const { preferences, updatePreferences, hydrated, org } = useDashboardLayout()

  const [step, setStep] = React.useState(0)
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [region, setRegion] = React.useState<string>(projectRegions[0].id)
  const [visibility, setVisibility] = React.useState<
    'Organization' | 'Private'
  >('Organization')
  const [task, setTask] = React.useState<string>('')
  const [startMethod, setStartMethod] = React.useState<StartMethod | ''>('')
  const [templateId, setTemplateId] = React.useState('')
  const [sourceProjectId, setSourceProjectId] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  if (!hydrated) {
    return <main id="dashboard-main" className="min-h-96 flex-1" />
  }

  const trimmedName = name.trim()
  const nameTaken =
    trimmedName.length > 0 &&
    isProjectNameTaken(trimmedName, org.id, preferences)
  const nameError = !trimmedName
    ? undefined
    : nameTaken
      ? 'A project with this name already exists in this organization.'
      : undefined

  const templates = task ? templatesForTask(task) : []
  const cloneCandidates = task
    ? cloneCandidatesFor(org.id, task, preferences)
    : []
  const selectedTemplate = templates.find((item) => item.id === templateId)
  const selectedSource = cloneCandidates.find(
    (item) => item.id === sourceProjectId,
  )

  function selectTask(value: string) {
    setTask(value)
    setTemplateId('')
    setSourceProjectId('')
  }

  function selectStartMethod(value: StartMethod) {
    setStartMethod(value)
    setTemplateId('')
    setSourceProjectId('')
  }

  const basicsValid = Boolean(trimmedName) && !nameTaken
  const taskValid = Boolean(task)
  const startMethodValid =
    startMethod === 'upload'
      ? true
      : startMethod === 'template'
        ? Boolean(templateId)
        : startMethod === 'clone'
          ? Boolean(sourceProjectId)
          : false

  const stepValid = [basicsValid, taskValid, startMethodValid]
  const canContinue = stepValid[step]
  const canSubmit = stepValid.every(Boolean)

  async function handleCreate() {
    if (!canSubmit || submitting) return
    setSubmitting(true)

    const hasDataset = startMethod === 'template'
    const id = generateProjectId(trimmedName, preferences)
    const project = {
      ...createProjectRecord({
        name: trimmedName,
        description,
        orgId: org.id,
        task,
        hasDataset,
      }),
      id,
    }
    const overview = createEmptyProjectOverview({
      region,
      visibility,
      task,
      hasDataset,
    })
    const created: CreatedProject = {
      project,
      overview,
      startMethod: startMethod as StartMethod,
      template: selectedTemplate?.id,
      clonedFromProjectId: selectedSource?.id,
    }

    const nextDatasets =
      startMethod === 'template' && selectedTemplate
        ? [createTemplateDataset(id, selectedTemplate), ...preferences.datasets]
        : preferences.datasets

    updatePreferences({
      createdProjects: [created, ...preferences.createdProjects],
      datasets: nextDatasets,
      uploads: [
        {
          id: `project-${id}`,
          orgId: org.id,
          icon: 'success',
          lead: `Project ${project.name}`,
          text: 'created',
          time: 'Just now',
          action: 'View',
        },
        ...preferences.uploads,
      ],
    })

    toast.success(`${project.name} created.`)

    if (startMethod === 'upload') {
      await navigate({
        to: '/projects/$projectId/datasets',
        params: { projectId: id },
        search: { add: true },
      })
    } else {
      await navigate({
        to: '/projects/$projectId/overview',
        params: { projectId: id },
      })
    }
  }

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

            {step === 0 && (
              <section className="grid gap-5">
                <StepHeading
                  title="Basics"
                  description="Name your project and choose where it lives."
                />
                <Label className="block leading-normal font-normal">
                  <span className="text-sm font-medium">Project name</span>
                  <Input
                    className="mt-1.5"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Retail Vision"
                    aria-invalid={Boolean(nameError)}
                    autoFocus
                  />
                  {nameError && (
                    <p className="mt-1.5 text-xs text-destructive">
                      {nameError}
                    </p>
                  )}
                </Label>
                <Label className="block leading-normal font-normal">
                  <span className="text-sm font-medium">
                    Description{' '}
                    <span className="font-normal text-slate-400">
                      (optional)
                    </span>
                  </span>
                  <Textarea
                    className="mt-1.5"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="What is this project for?"
                    rows={3}
                  />
                </Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Label className="block leading-normal font-normal">
                    <span className="text-sm font-medium">Organization</span>
                    <Input
                      className="mt-1.5"
                      value={org.name}
                      disabled
                      readOnly
                    />
                  </Label>
                  <Label className="block leading-normal font-normal">
                    <span className="text-sm font-medium">Region</span>
                    <Select value={region} onValueChange={setRegion}>
                      <SelectTrigger
                        className="mt-1.5 w-full"
                        aria-label="Region"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {projectRegions.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Label>
                </div>
                <Label className="block leading-normal font-normal">
                  <span className="text-sm font-medium">Visibility</span>
                  <Select
                    value={visibility}
                    onValueChange={(value) =>
                      setVisibility(value as 'Organization' | 'Private')
                    }
                  >
                    <SelectTrigger
                      className="mt-1.5 w-full"
                      aria-label="Visibility"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Organization">
                        Organization — visible to everyone in {org.name}
                      </SelectItem>
                      <SelectItem value="Private">
                        Private — visible only to invited collaborators
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Label>
              </section>
            )}

            {step === 1 && (
              <section>
                <StepHeading
                  title="Task type"
                  description="Choose what this project is trained to do."
                />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {projectTaskTypes.map((item) => (
                    <Button
                      key={item}
                      type="button"
                      variant="option"
                      onClick={() => selectTask(item)}
                      aria-pressed={task === item}
                      className="flex-col items-stretch justify-start"
                    >
                      <div className="flex items-start justify-between">
                        <FolderKanban className="size-5 text-indigo-600" />
                        {task === item && (
                          <span className="text-indigo-600">●</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium">{item}</p>
                    </Button>
                  ))}
                </div>
              </section>
            )}

            {step === 2 && (
              <section>
                <StepHeading
                  title="Start method"
                  description="Choose how this project's first dataset gets created."
                />
                <div className="mt-5 grid gap-2.5">
                  {startMethods.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      variant="option"
                      onClick={() => selectStartMethod(item.id)}
                      aria-pressed={startMethod === item.id}
                      className="w-full items-start justify-start gap-3"
                    >
                      <item.icon className="mt-0.5 size-5 shrink-0 text-indigo-600" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {item.label}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {item.description}
                        </span>
                      </span>
                      {startMethod === item.id && (
                        <span className="ml-auto text-indigo-600">●</span>
                      )}
                    </Button>
                  ))}
                </div>

                {startMethod === 'template' && (
                  <div className="mt-5">
                    {templates.length ? (
                      <div className="grid gap-2.5">
                        {templates.map((template) => (
                          <Button
                            key={template.id}
                            type="button"
                            variant="option"
                            onClick={() => setTemplateId(template.id)}
                            aria-pressed={templateId === template.id}
                            className="w-full justify-between gap-4"
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-medium">
                                {template.name}
                              </span>
                              <span className="block text-xs text-slate-500">
                                {template.description}
                              </span>
                              <span className="mt-1 block text-[11px] font-medium text-slate-400">
                                {template.items.toLocaleString('en-US')} items ·{' '}
                                {template.size}
                              </span>
                            </span>
                            {templateId === template.id && (
                              <span className="text-indigo-600">●</span>
                            )}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <Empty className="min-h-40 border">
                        <EmptyHeader>
                          <EmptyTitle>
                            No templates for this task yet
                          </EmptyTitle>
                          <EmptyDescription>
                            Choose a different task type or start by uploading
                            your own dataset instead.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    )}
                  </div>
                )}

                {startMethod === 'clone' && (
                  <div className="mt-5">
                    {cloneCandidates.length ? (
                      <div className="grid gap-2.5">
                        {cloneCandidates.map((candidate) => (
                          <Button
                            key={candidate.id}
                            type="button"
                            variant="option"
                            onClick={() => setSourceProjectId(candidate.id)}
                            aria-pressed={sourceProjectId === candidate.id}
                            className="w-full justify-start gap-3"
                          >
                            <ProjectMark
                              project={candidate}
                              className="size-8"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {candidate.name}
                              </span>
                              <span className="block text-xs text-slate-500">
                                {candidate.task}
                              </span>
                            </span>
                            {sourceProjectId === candidate.id && (
                              <span className="text-indigo-600">●</span>
                            )}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <Empty className="min-h-40 border">
                        <EmptyHeader>
                          <EmptyTitle>
                            No compatible projects to clone
                          </EmptyTitle>
                          <EmptyDescription>
                            There are no other {task} projects in {org.name}{' '}
                            yet.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    )}
                    <p className="mt-3 text-xs text-slate-400">
                      Cloning copies project setup only — datasets, runs,
                      models, and deployments are not duplicated.
                    </p>
                  </div>
                )}
              </section>
            )}

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
                  disabled={!canContinue}
                  onClick={() => setStep((current) => current + 1)}
                >
                  Continue
                  <ChevronRight />
                </Button>
              ) : (
                <Button
                  disabled={!canSubmit || submitting}
                  onClick={handleCreate}
                >
                  {submitting ? 'Creating…' : 'Create project'}
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
              <SummaryRow label="Name" value={trimmedName || '—'} />
              <SummaryRow label="Organization" value={org.name} />
              <SummaryRow
                label="Region"
                value={
                  projectRegions.find((item) => item.id === region)?.label ??
                  region
                }
              />
              <SummaryRow label="Visibility" value={visibility} />
              <SummaryRow label="Task type" value={task || '—'} />
              <SummaryRow
                label="Start method"
                value={
                  startMethod
                    ? (startMethods.find((item) => item.id === startMethod)
                        ?.label ?? '—')
                    : '—'
                }
              />
              {startMethod === 'template' && (
                <SummaryRow
                  label="Template"
                  value={selectedTemplate?.name ?? 'Not selected'}
                />
              )}
              {startMethod === 'clone' && (
                <SummaryRow
                  label="Clone from"
                  value={selectedSource?.name ?? 'Not selected'}
                />
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-medium">{value}</span>
    </div>
  )
}
