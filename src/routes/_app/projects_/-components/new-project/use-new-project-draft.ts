import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { useDashboardLayout } from '@/features/dashboard/context'
import {
  createEmptyProjectOverview,
  createProjectRecord,
  generateProjectId,
  isProjectNameTaken,
  projectRegions,
} from '@/features/dashboard/data'
import type { CreatedProject } from '@/features/dashboard/data'
import {
  cloneCandidatesFor,
  createTemplateDataset,
  templatesForTask,
} from '@/features/dashboard/templates'
import { startMethods } from './types'
import type { StartMethod } from './types'

export type NewProjectDraft = ReturnType<typeof useNewProjectDraft>

/**
 * All state for the create-project flow: the fields, what each step considers
 * valid, the summary rows, and the submit that writes the project.
 */
export function useNewProjectDraft() {
  const navigate = useNavigate()
  const { preferences, updatePreferences, org } = useDashboardLayout()

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

  const summaryRows: Array<[string, string]> = [
    ['Name', trimmedName || '—'],
    ['Organization', org.name],
    [
      'Region',
      projectRegions.find((item) => item.id === region)?.label ?? region,
    ],
    ['Visibility', visibility],
    ['Task type', task || '—'],
    [
      'Start method',
      startMethod
        ? (startMethods.find((item) => item.id === startMethod)?.label ?? '—')
        : '—',
    ],
    ...(startMethod === 'template'
      ? ([['Template', selectedTemplate?.name ?? 'Not selected']] as Array<
          [string, string]
        >)
      : []),
    ...(startMethod === 'clone'
      ? ([['Clone from', selectedSource?.name ?? 'Not selected']] as Array<
          [string, string]
        >)
      : []),
  ]

  // Changing the task invalidates any template or clone source picked for it.
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

  async function create() {
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

  return {
    step,
    setStep,
    name,
    setName,
    description,
    setDescription,
    region,
    setRegion,
    visibility,
    setVisibility,
    task,
    selectTask,
    startMethod,
    selectStartMethod,
    templateId,
    setTemplateId,
    sourceProjectId,
    setSourceProjectId,
    submitting,
    nameError,
    templates,
    cloneCandidates,
    summaryRows,
    canContinue,
    canSubmit,
    create,
  }
}
