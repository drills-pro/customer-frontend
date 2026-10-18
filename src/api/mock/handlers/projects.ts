/** Projects, their usage, members and integrations. */
import type {
  ApiIntegration,
  ApiProject,
  ApiProjectDetail,
  ApiProjectMember,
  ApiProjectRole,
  CreateProjectRequest,
  InviteProjectMemberRequest,
  UpdateProjectRequest,
} from '@/features/projects/api/types'
import type { ApiVisibility } from '@/features/organizations/api/types'
import { notFound, retiredRoute } from '../router'
import { frameworkForTask, projectTemplates, regions } from '../seed/catalog'
import {
  defaultProjectMembers,
  integrationCatalog,
  projectInviteColors,
} from '../seed/projects'
import type { ProjectRecord } from '../seed/projects'
import { resourceUsage } from '../seed/usage'
import {
  datasets,
  deployments,
  models,
  organizations,
  projectIntegrations,
  projectMembers,
  projects,
  trainingRuns,
} from '../store'
import { bodyOf, conflict, invalid, nowIso, slugify } from './shared'

const DEFAULT_PROJECT_COLOR = '#6366f1'

export function project(projectId: string) {
  return projects.get(projectId) ?? notFound('Project')
}

/** Records a change inside a project, which also makes it "recently updated". */
export function touchProject(
  projectId: string,
  change: (current: ProjectRecord) => Partial<ProjectRecord> = () => ({}),
) {
  const current = project(projectId)
  return projects.put({ ...current, ...change(current), updated_at: nowIso() })
}

function toDetail({
  usage_scale: _,
  mirrored: _mirrored,
  ...detail
}: ProjectRecord): ApiProjectDetail {
  return detail
}

function toListRow(record: ProjectRecord): ApiProject {
  const {
    framework: _framework,
    region: _region,
    visibility: _visibility,
    pipeline: _pipeline,
    best_model: _best,
    readme: _readme,
    readme_markdown: _markdown,
    ...row
  } = toDetail(record)
  return row
}

function assertNameFree(name: string, organizationId: string, ownId?: string) {
  const normalized = name.trim().toLowerCase()
  const taken = projects
    .all()
    .some(
      (item) =>
        item.organization_id === organizationId &&
        item.id !== ownId &&
        item.name.trim().toLowerCase() === normalized,
    )
  if (taken) conflict('A project with this name already exists.')
}

function newProjectId(name: string) {
  const existing = new Set(projects.all().map((item) => item.id))
  const base = slugify(name, 'project')
  if (!existing.has(base)) return base
  let suffix = 2
  while (existing.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

retiredRoute('GET', '/v1/projects', ({ query }) => {
  const organizationId = query.get('organization_id')
  return projects
    .all()
    .filter(
      (item) => !organizationId || item.organization_id === organizationId,
    )
    .map(toListRow)
})

retiredRoute('POST', '/v1/projects', ({ body }) => {
  const input = bodyOf<CreateProjectRequest>(body)
  const name = input.name.trim()
  if (!name) invalid('Project name is required')
  if (!organizations.get(input.organization_id)) notFound('Organization')
  if (!regions.some((item) => item.id === input.region))
    invalid('Unknown region')
  assertNameFree(name, input.organization_id)

  const template =
    input.start_method === 'template'
      ? projectTemplates.find((item) => item.id === input.template_id)
      : undefined
  if (input.start_method === 'template' && !template)
    invalid('Unknown template')

  const id = newProjectId(name)
  const now = nowIso()
  const created = projects.put({
    id,
    organization_id: input.organization_id,
    name,
    description: input.description.trim(),
    task_type: input.task_type,
    status: 'draft',
    color: DEFAULT_PROJECT_COLOR,
    created_at: now,
    updated_at: now,
    dataset_count: template ? 1 : 0,
    model_count: 0,
    deployment_count: 0,
    framework: frameworkForTask(input.task_type),
    region: input.region,
    visibility: input.visibility,
    pipeline: { runs: 0, running: 0, complete_through: template ? 2 : 1 },
    best_model: null,
    readme: null,
    readme_markdown: null,
    usage_scale: {
      gpu_scale: 0,
      storage_scale: template ? 0.1 : 0,
      endpoints_max: 0,
    },
  })

  if (template) {
    datasets.put({
      id: `${id}-${template.dataset.name}`,
      project_id: id,
      name: template.dataset.name,
      modality: template.dataset.modality,
      split: 'train',
      item_count: template.dataset.item_count,
      size_bytes: template.dataset.size_bytes,
      class_count: template.dataset.class_count,
      version: 1,
      status: 'ready',
      created_at: now,
      files: [],
    })
  }
  return toDetail(created)
})

retiredRoute('GET', '/v1/projects/:projectId', ({ params }) =>
  toDetail(project(params.projectId)),
)

retiredRoute('PATCH', '/v1/projects/:projectId', ({ params, body }) => {
  const current = project(params.projectId)
  const input = bodyOf<UpdateProjectRequest>(body)
  const changes: Partial<ProjectRecord> = {}
  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name) invalid('Project name is required')
    assertNameFree(name, current.organization_id, current.id)
    changes.name = name
  }
  if (input.description !== undefined) {
    changes.description = input.description.trim()
  }
  if (input.readme_markdown !== undefined) {
    changes.readme_markdown = input.readme_markdown
  }
  return toDetail(touchProject(current.id, () => changes))
})

retiredRoute(
  'PATCH',
  '/v1/projects/:projectId/visibility',
  ({ params, body }) => {
    const { visibility } = bodyOf<{ visibility: ApiVisibility }>(body)
    return toDetail(touchProject(params.projectId, () => ({ visibility })))
  },
)

retiredRoute('POST', '/v1/projects/:projectId/archive', ({ params }) => {
  const current = project(params.projectId)
  // An archived project serves nothing: its live endpoints are paused.
  for (const deployment of deployments.all()) {
    if (deployment.project_id === current.id && deployment.status === 'live') {
      deployments.put({
        ...deployment,
        status: 'paused',
        active_replicas: 0,
        requests_24h: null,
        latency_p50_ms: null,
        latency_p95_ms: null,
        latency_p99_ms: null,
        error_rate_percent: null,
        cost_per_day_usd: 0,
      })
    }
  }
  return toDetail(touchProject(current.id, () => ({ status: 'archived' })))
})

retiredRoute('POST', '/v1/projects/:projectId/unarchive', ({ params }) =>
  toDetail(touchProject(params.projectId, () => ({ status: 'active' }))),
)

retiredRoute('POST', '/v1/projects/:projectId/transfer', ({ params, body }) => {
  const current = project(params.projectId)
  const { organization_id } = bodyOf<{ organization_id: string }>(body)
  if (!organizations.get(organization_id)) notFound('Organization')
  assertNameFree(current.name, organization_id, current.id)
  return toDetail(touchProject(current.id, () => ({ organization_id })))
})

retiredRoute('DELETE', '/v1/projects/:projectId', ({ params }) => {
  const current = project(params.projectId)
  for (const collection of [datasets, trainingRuns, models, deployments]) {
    for (const item of collection.all()) {
      if (item.project_id === current.id) collection.remove(item.id)
    }
  }
  projectMembers.remove(current.id)
  projectIntegrations.remove(current.id)
  projects.remove(current.id)
})

retiredRoute('GET', '/v1/projects/:projectId/usage', ({ params }) =>
  resourceUsage(project(params.projectId).usage_scale),
)

function membersOf(projectId: string): ApiProjectMember[] {
  return projectMembers.get(projectId)?.members ?? defaultProjectMembers
}

function saveMembers(projectId: string, next: ApiProjectMember[]) {
  projectMembers.put({ id: projectId, members: next })
  return next
}

retiredRoute('GET', '/v1/projects/:projectId/members', ({ params }) =>
  membersOf(project(params.projectId).id),
)

retiredRoute(
  'POST',
  '/v1/projects/:projectId/invitations',
  ({ params, body }) => {
    const { id } = project(params.projectId)
    const input = bodyOf<InviteProjectMemberRequest>(body)
    const email = input.email.trim().toLowerCase()
    const current = membersOf(id)
    if (current.some((item) => item.email.toLowerCase() === email)) {
      conflict('That person is already on this project.')
    }
    const invited: ApiProjectMember = {
      id: slugify(email, 'member'),
      name: email.split('@')[0],
      email,
      color: projectInviteColors[current.length % projectInviteColors.length],
      role: input.role,
      status: 'invited',
    }
    saveMembers(id, [...current, invited])
    return invited
  },
)

function memberOf(projectId: string, userId: string) {
  return (
    membersOf(projectId).find((item) => item.id === userId) ??
    notFound('Member')
  )
}

retiredRoute(
  'PUT',
  '/v1/projects/:projectId/members/:userId',
  ({ params, body }) => {
    const { id } = project(params.projectId)
    const target = memberOf(id, params.userId)
    const { role } = bodyOf<{ role: ApiProjectRole }>(body)
    if (target.role === 'owner' || role === 'owner') {
      conflict('The owner role cannot be changed here.')
    }
    const updated = { ...target, role }
    saveMembers(
      id,
      membersOf(id).map((item) => (item.id === target.id ? updated : item)),
    )
    return updated
  },
)

retiredRoute(
  'DELETE',
  '/v1/projects/:projectId/members/:userId',
  ({ params }) => {
    const { id } = project(params.projectId)
    const target = memberOf(id, params.userId)
    if (target.role === 'owner') conflict('The owner cannot be removed.')
    saveMembers(
      id,
      membersOf(id).filter((item) => item.id !== target.id),
    )
  },
)

function integrationsOf(projectId: string): ApiIntegration[] {
  const enabled = projectIntegrations.get(projectId)?.enabled
  return integrationCatalog.map((item) => ({
    ...item,
    enabled: enabled ? enabled.includes(item.id) : item.enabled,
  }))
}

retiredRoute('GET', '/v1/projects/:projectId/integrations', ({ params }) =>
  integrationsOf(project(params.projectId).id),
)

retiredRoute(
  'PUT',
  '/v1/projects/:projectId/integrations/:integrationId',
  ({ params, body }) => {
    const { id } = project(params.projectId)
    const { enabled } = bodyOf<{ enabled: boolean }>(body)
    const current = integrationsOf(id)
    if (!current.some((item) => item.id === params.integrationId)) {
      notFound('Integration')
    }
    const next = current
      .filter((item) =>
        item.id === params.integrationId ? enabled : item.enabled,
      )
      .map((item) => item.id)
    projectIntegrations.put({ id, enabled: next })
    return integrationsOf(id).find((item) => item.id === params.integrationId)
  },
)
