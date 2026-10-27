import type { ComponentType, SVGProps } from 'react';
import { AiScan, Grid2x3, Image, TextStartT } from 'pixelarticons/react';
import type { ProjectRole, TASK_TYPES } from '@/modules/projects/api';

type PixelIcon = ComponentType<SVGProps<SVGSVGElement>>;

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
export const PROJECT_TABS = { overview: 'overview', datasets: 'datasets' } as const;
export type ProjectTab = (typeof PROJECT_TABS)[keyof typeof PROJECT_TABS];

/** The API types run and deployment `status` as a plain string. Values mirror core-api (training/constants.py, deployments/status.py). */
export const TrainingStatus = {
  Submitted: 'submitted',
  Running: 'running',
  Succeeded: 'succeeded',
  Failed: 'failed',
  Cancelled: 'cancelled',
} as const;
export const DeploymentStatus = { Deploying: 'deploying', Active: 'active', Failed: 'failed', Deleted: 'deleted' } as const;
/** The overview reads one page of runs: the API's largest. A full page reads as "N+". */
export const TRAINING_RUN_LIMIT = 200;
/** Runs still on their way to a result. */
export const ACTIVE_TRAINING: readonly string[] = [TrainingStatus.Submitted, TrainingStatus.Running];

/** Project roles in the order the team card lists them; each is also its `projects.role.*` key. */
export const PROJECT_ROLES = [
  'project_admin',
  'editor',
  'dataset_editor',
  'model_editor',
  'deployer',
  'viewer',
] as const satisfies readonly ProjectRole[];
