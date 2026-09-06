import { linkOptions } from '@tanstack/react-router'

export const sections = [
  'overview',
  'datasets',
  'training',
  'models',
  'deployments',
  'settings',
] as const

export const projectLink = (projectId: string, section = 'overview') =>
  linkOptions({
    to: '/projects/$projectId/$section',
    params: { projectId, section },
  })

export const datasetLink = (projectId: string, datasetId: string) =>
  linkOptions({
    to: '/projects/$projectId/datasets/$datasetId',
    params: { projectId, datasetId },
  })

export const runLink = (projectId: string, runId: string) =>
  linkOptions({
    to: '/projects/$projectId/training/$runId',
    params: { projectId, runId },
  })

export const modelLink = (projectId: string, modelId: string) =>
  linkOptions({
    to: '/projects/$projectId/models/$modelId',
    params: { projectId, modelId },
  })

export const deploymentLink = (projectId: string, deploymentId: string) =>
  linkOptions({
    to: '/projects/$projectId/deployments/$deploymentId',
    params: { projectId, deploymentId },
  })

export const trainingLink = (projectId: string) =>
  linkOptions({
    to: '/projects/$projectId/training/new',
    params: { projectId },
  })

export const activityLink = (projectId: string, kind: string, id: string) =>
  kind === 'dataset'
    ? datasetLink(projectId, id)
    : kind === 'training'
      ? runLink(projectId, id)
      : kind === 'deployment'
        ? deploymentLink(projectId, id)
        : projectLink(projectId)
