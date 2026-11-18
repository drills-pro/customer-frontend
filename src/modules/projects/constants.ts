import { AiScan, Grid2x3, Image, TextStartT } from 'pixelarticons/react';
import type { ProjectRole, TASK_TYPES } from '@/modules/projects/api';
import type { PixelIcon } from '@/shared/ui/icons';

/** The wizard's steps; `done` shows the new project. Each id is also its `newProject.step.*` key. */
export const STEPS = ['basics', 'task', 'review', 'done'] as const;
export type StepId = (typeof STEPS)[number];
export const step = (id: StepId) => STEPS.indexOf(id);

/** A UI cap on the project name; the server stores any length. */
export const NAME_MAX = 100;

export const TASK_ICONS: Record<(typeof TASK_TYPES)[number], PixelIcon> = {
  'image-classification': Image,
  'object-detection': AiScan,
  'tabular-classification': Grid2x3,
  'text-classification': TextStartT,
};

/** The project's sections; each id is also its `projects.detail.tab.*` key. */
export const ProjectTab = {
  Overview: 'overview',
  Datasets: 'datasets',
  Training: 'training',
  Models: 'models',
  Deployments: 'deployments',
} as const;
export type ProjectTab = (typeof ProjectTab)[keyof typeof ProjectTab];
export const PROJECT_TABS: readonly ProjectTab[] = [
  ProjectTab.Overview,
  ProjectTab.Datasets,
  ProjectTab.Training,
  ProjectTab.Models,
  ProjectTab.Deployments,
];

/** The overview's pipeline stages, in order; each id is also its `projects.overview.pipeline.*` key. */
export const PIPELINE_STAGES = ['data', 'train', 'deploy'] as const;
export type StageId = (typeof PIPELINE_STAGES)[number];

/** Where a pipeline stage stands; each is also its `projects.overview.pipeline.state.*` key. */
export const StageState = { Done: 'done', Active: 'active', Todo: 'todo', Unavailable: 'unavailable' } as const;
export type StageState = (typeof StageState)[keyof typeof StageState];

/** The API types run and deployment `status` as a plain string. Values mirror core-api (training/constants.py, deployments/status.py). */
export const TrainingStatus = {
  Submitted: 'submitted',
  Running: 'running',
  Succeeded: 'succeeded',
  Failed: 'failed',
  Cancelled: 'cancelled',
} as const;
export type TrainingStatus = (typeof TrainingStatus)[keyof typeof TrainingStatus];
export const DeploymentStatus = {
  Deploying: 'deploying',
  Active: 'active',
  Stopped: 'stopped',
  Failed: 'failed',
  Deleted: 'deleted',
} as const;
export type DeploymentStatus = (typeof DeploymentStatus)[keyof typeof DeploymentStatus];
export { TRAINING_RUN_LIMIT } from '@/shared/api/overview';
/** Runs still on their way to a result. */
export const ACTIVE_TRAINING: readonly string[] = [TrainingStatus.Submitted, TrainingStatus.Running];

/** The role that can manage the project's members; the API keeps at least one person in it. */
export const ADMIN_ROLE = 'project_admin' as const satisfies ProjectRole;

/** Project roles in the order the team card lists them; each is also its `projects.role.*` key. */
export const PROJECT_ROLES = [
  'project_admin',
  'editor',
  'dataset_editor',
  'model_editor',
  'deployer',
  'viewer',
] as const satisfies readonly ProjectRole[];
