/**
 * Every collection the mock server keeps, with the schema that guards what
 * comes back out of storage. Handlers read and write through these.
 */
import { z } from 'zod'

import type {
  ApiKey,
  ApiNotification,
  ApiSecurity,
  ApiSession,
  ApiUser,
} from '@/features/account/api/types'
import type { ApiDataset } from '@/features/datasets/api/types'
import type {
  ApiDeployment,
  ApiDeploymentKey,
} from '@/features/deployments/api/types'
import type { ApiInvitation } from '@/features/organizations/api/types'
import type { ApiProjectMember } from '@/features/projects/api/types'
import type { ApiTrainingRun } from '@/features/training/api/types'
import { Collection } from './db'
import {
  apiKeySeed,
  notificationSeed,
  securitySeed,
  sessionSeed,
  userSeed,
} from './seed/account'
import { datasetSeed } from './seed/datasets'
import { deploymentSeed } from './seed/deployments'
import { modelSeed } from './seed/models'
import type { ModelRecord } from './seed/models'
import {
  invitationSeed,
  memberSeed,
  organizationSeed,
} from './seed/organizations'
import type { MemberRecord, OrganizationRecord } from './seed/organizations'
import { projectSeed } from './seed/projects'
import type { ProjectRecord } from './seed/projects'
import { trainingRunSeed } from './seed/training'

// Bounded, not just typed: a stored record with a negative count or a
// progress above 100 must not reach the UI.
const id = z.string().min(1)
const count = z.number().int().min(0)
const percent = z.number().min(0).max(100)
const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i)
const visibility = z.enum(['organization', 'private'])

const organizationSchema = z.looseObject({
  id,
  name: z.string().trim().min(1).max(64),
  slug: z.string().regex(/^[a-z0-9-]{2,40}$/),
  description: z.string().max(240),
  color: hexColor,
  plan: z.enum(['free', 'team', 'enterprise']),
  created_at: z.string(),
  your_role: z.enum(['owner', 'admin', 'member', 'viewer']),
  default_project_visibility: visibility,
  require_two_factor: z.boolean(),
  allow_domain_join: z.boolean(),
  credits_used: z.number().min(0),
  mirrored: z.boolean().optional(),
})

const projectSchema = z.looseObject({
  id,
  organization_id: id,
  name: z.string().min(1),
  description: z.string(),
  task_type: z.string(),
  status: z.enum(['active', 'draft', 'archived']),
  color: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  dataset_count: count,
  model_count: count,
  deployment_count: count,
  framework: z.string(),
  region: z.string(),
  visibility,
  pipeline: z.object({
    runs: count,
    running: count,
    complete_through: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
    ]),
  }),
  usage_scale: z.object({
    gpu_scale: z.number().min(0),
    storage_scale: z.number().min(0),
    endpoints_max: z.number().min(0),
  }),
  mirrored: z.boolean().optional(),
})

const datasetSchema = z.looseObject({
  id,
  project_id: id,
  name: z.string().min(1),
  modality: z.enum(['image', 'text', 'tabular']),
  split: z.enum(['train', 'validation', 'test', 'unsplit']),
  item_count: count,
  size_bytes: z.number().min(0),
  class_count: count,
  version: z.number().int().min(1),
  status: z.enum(['ready', 'processing', 'error']),
  created_at: z.string(),
  files: z.array(z.string()),
})

const trainingRunSchema = z.looseObject({
  id,
  project_id: id,
  dataset_id: id,
  name: z.string().min(1),
  architecture: z.string(),
  instance_name: z.string(),
  config: z.object({
    epochs: z.number().int().min(1).max(10_000),
    batch_size: z.number().int().min(1).max(100_000),
    split: z
      .object({
        train: z.number().min(5),
        validation: z.number().min(5),
        test: z.number().min(5),
      })
      .refine(
        (split) => split.train + split.validation + split.test === 100,
        'split must total 100',
      ),
    learning_rate: z.number().gt(0).lte(1),
    scheduler: z.enum(['cosine', 'linear', 'constant']),
    augmentations: z.array(z.string()),
    early_stopping: z.boolean(),
    instance_id: z.string(),
    spot: z.boolean(),
  }),
  estimated_hours: z.number().min(0),
  estimated_cost_usd: z.number().min(0),
  author: z.string(),
  started_at: z.string(),
  status: z.enum(['running', 'stopped', 'completed']),
  progress: percent,
  step: count,
  total_steps: count,
})

export const organizations = new Collection<OrganizationRecord>(
  'organizations',
  () => organizationSeed,
  organizationSchema,
)
export const members = new Collection<MemberRecord>('members', memberSeed)
export const invitations = new Collection<ApiInvitation>(
  'invitations',
  () => invitationSeed,
)

export const projects = new Collection<ProjectRecord>(
  'projects',
  () => projectSeed,
  projectSchema,
)
/** Only projects whose members were changed; the rest use the default team. */
export const projectMembers = new Collection<{
  id: string
  members: ApiProjectMember[]
}>('project_members')
/** Only projects whose integrations were toggled. */
export const projectIntegrations = new Collection<{
  id: string
  enabled: string[]
}>('project_integrations')

export const datasets = new Collection<ApiDataset>(
  'datasets',
  () => datasetSeed,
  datasetSchema,
)
export const trainingRuns = new Collection<ApiTrainingRun>(
  'training_runs',
  trainingRunSeed,
  trainingRunSchema,
)
export const models = new Collection<ModelRecord>('models', () => modelSeed)
export const deployments = new Collection<ApiDeployment>(
  'deployments',
  () => deploymentSeed,
)
/** Only deployments whose key was rotated. */
export const deploymentKeys = new Collection<ApiDeploymentKey & { id: string }>(
  'deployment_keys',
)

export const users = new Collection<ApiUser>('users', () => [userSeed])
export const security = new Collection<ApiSecurity & { id: string }>(
  'security',
  () => [{ id: 'me', ...securitySeed }],
)
export const sessions = new Collection<ApiSession>('sessions', sessionSeed)
export const notifications = new Collection<ApiNotification>(
  'notifications',
  notificationSeed,
)
/** The user's changes to the default notification toggles. */
export const notificationSettings = new Collection<{
  id: string
  enabled: Record<string, boolean>
}>('notification_settings')
export const apiKeys = new Collection<ApiKey>('api_keys', () => apiKeySeed)
