import type { DeploymentListItem, TrainingRunSummary } from '@/modules/projects/api';
import { ACTIVE_TRAINING, DeploymentStatus, TRAINING_RUN_LIMIT, TrainingStatus } from '@/modules/projects/constants';

/** The overview's stages, in order; each id is also its `projects.overview.pipeline.*` key. */
export const PIPELINE_STAGES = ['data', 'train', 'deploy'] as const;
export type StageId = (typeof PIPELINE_STAGES)[number];

/** Where a stage stands; each is also its `projects.overview.pipeline.state.*` key. */
export const StageState = { Done: 'done', Active: 'active', Todo: 'todo', Unavailable: 'unavailable' } as const;
export type StageState = (typeof StageState)[keyof typeof StageState];

/** What a stage card shows: `count` is null while loading or when the stage cannot be read. */
export interface Stage {
  state: StageState;
  count: number | null;
  /** The count is a full page, so there are at least this many. */
  more: boolean;
  /** Train only: runs still in progress. */
  inProgress: number;
}

const pending = (failed: boolean): Stage => ({
  state: failed ? StageState.Unavailable : StageState.Todo,
  count: null,
  more: false,
  inProgress: 0,
});
const pick = (done: boolean, active: boolean) => (done ? StageState.Done : active ? StageState.Active : StageState.Todo);

export function dataStage(page: { count: number; more: boolean } | undefined, failed: boolean): Stage {
  if (!page) return pending(failed);
  return { state: pick(page.count > 0, false), count: page.count, more: page.more, inProgress: 0 };
}

/** Done once a run succeeded; in progress while one is queued or running. */
export function trainStage(runs: TrainingRunSummary[] | undefined, failed: boolean): Stage {
  if (!runs) return pending(failed);
  const inProgress = runs.filter((r) => ACTIVE_TRAINING.includes(r.status)).length;
  const succeeded = runs.some((r) => r.status === TrainingStatus.Succeeded);
  return { state: pick(succeeded, inProgress > 0), count: runs.length, more: runs.length >= TRAINING_RUN_LIMIT, inProgress };
}

/** Counts live endpoints; one still deploying makes the stage in progress. */
export function deployStage(deployments: DeploymentListItem[] | undefined, failed: boolean): Stage {
  if (!deployments) return pending(failed);
  const live = deployments.filter((d) => d.status === DeploymentStatus.Active).length;
  const deploying = deployments.some((d) => d.status === DeploymentStatus.Deploying);
  return { state: pick(live > 0, deploying), count: live, more: false, inProgress: 0 };
}
