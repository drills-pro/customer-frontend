import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { ApiError } from '@/api/client'
import {
  useProjectTemplates,
  useRegions,
  useTaskTypes,
} from '@/features/catalog/queries'
import { useDashboardLayout } from '@/features/dashboard/context'
import { toApiVisibility } from '@/features/organizations/mappers'
import { useCreateProject, useProjects } from '@/features/projects/queries'
import { formatBytes } from '@/lib/format'
import { startMethods } from './types'
import type { StartMethod } from './types'

export type NewProjectDraft = ReturnType<typeof useNewProjectDraft>

/**
 * All state for the create-project flow: the fields, what each step considers
 * valid, the summary rows, and the submit that creates the project.
 */
export function useNewProjectDraft() {
  const navigate = useNavigate()
  const { org } = useDashboardLayout()
  const createProject = useCreateProject()
  const orgProjects = useProjects(org.id).data ?? []
  const regions = useRegions().data ?? []
  const taskTypes = (useTaskTypes().data ?? []).filter(
    (item) => item.selectable,
  )

  const [step, setStep] = React.useState(0)
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [chosenRegion, setRegion] = React.useState('')
  const [visibility, setVisibility] = React.useState<
    'Organization' | 'Private'
  >('Organization')
  /** The task type id; `taskLabel` is what the user reads. */
  const [task, setTask] = React.useState<string>('')
  const [startMethod, setStartMethod] = React.useState<StartMethod | ''>('')
  const [templateId, setTemplateId] = React.useState('')
  const [sourceProjectId, setSourceProjectId] = React.useState('')
  /** A name the API refused as taken, e.g. created in another tab. */
  const [refusedName, setRefusedName] = React.useState<string>()

  // The first region is the default until the user picks one.
  const region = chosenRegion || regions.at(0)?.id || ''
  const taskLabel = taskTypes.find((item) => item.id === task)?.label ?? ''

  const trimmedName = name.trim()
  const normalizedName = trimmedName.toLowerCase()
  const nameTaken =
    trimmedName.length > 0 &&
    (normalizedName === refusedName ||
      orgProjects.some(
        (item) => item.name.trim().toLowerCase() === normalizedName,
      ))
  const nameError = nameTaken
    ? 'A project with this name already exists in this organization.'
    : undefined

  const templates = (useProjectTemplates(task || undefined).data ?? []).map(
    (item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      items: item.dataset.item_count,
      size: formatBytes(item.dataset.size_bytes),
    }),
  )
  const cloneCandidates = task
    ? orgProjects.filter((item) => item.taskType === task)
    : []
  const selectedTemplate = templates.find((item) => item.id === templateId)
  const selectedSource = cloneCandidates.find(
    (item) => item.id === sourceProjectId,
  )

  const summaryRows: Array<[string, string]> = [
    ['Name', trimmedName || '—'],
    ['Organization', org.name],
    ['Region', regions.find((item) => item.id === region)?.label ?? region],
    ['Visibility', visibility],
    ['Task type', taskLabel || '—'],
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

  const basicsValid = Boolean(trimmedName) && !nameTaken && Boolean(region)
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
  const submitting = createProject.isPending

  function create() {
    if (!canSubmit || submitting || !startMethod) return
    createProject.mutate(
      {
        organization_id: org.id,
        name: trimmedName,
        description,
        task_type: task,
        region,
        visibility: toApiVisibility(visibility),
        start_method: startMethod,
        template_id: selectedTemplate?.id,
        cloned_from_project_id: selectedSource?.id,
      },
      {
        onSuccess: (created) => {
          toast.success(`${created.name} created.`)
          void (startMethod === 'upload'
            ? navigate({
                to: '/projects/$projectId/datasets',
                params: { projectId: created.id },
                search: { add: true },
              })
            : navigate({
                to: '/projects/$projectId/overview',
                params: { projectId: created.id },
              }))
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            setRefusedName(normalizedName)
            setStep(0)
          }
        },
      },
    )
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
    regions,
    visibility,
    setVisibility,
    task,
    taskLabel,
    taskTypes,
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
