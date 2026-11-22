import type { DeploymentListItem, TrainingRunSummary } from '@/modules/projects/api';
import { ACTIVE_TRAINING, DeploymentStatus, StageState, TrainingStatus } from '@/modules/projects/constants';

/** What a stage card shows: `count` is null while loading or when the stage cannot be read. */
export interface Stage {
  state: StageState;
  count: number | null;
  /** The count is a full page, so there are at least this many. */
  more: boolean;
  /** Train only: runs still in progress. */
  inProgress: number;
}

/** A stage with no data yet: still loading, or failed to load. */
const unknownStage = (failed: boolean): Stage => ({
  state: failed ? StageState.Unavailable : StageState.Todo,
  count: null,
  more: false,
  inProgress: 0,
});
const pick = (done: boolean, active: boolean) => (done ? StageState.Done : active ? StageState.Active : StageState.Todo);

export function dataStage(page: { count: number; more: boolean } | undefined, failed: boolean): Stage {
  if (!page) return unknownStage(failed);
  return { state: page.count > 0 ? StageState.Done : StageState.Todo, count: page.count, more: page.more, inProgress: 0 };
}

/** Done once a run succeeded; in progress while one is queued or running. */
export function trainStage(runs: { items: TrainingRunSummary[]; next_page_token?: string | null } | undefined, failed: boolean): Stage {
  if (!runs) return unknownStage(failed);
  const inProgress = runs.items.filter((r) => ACTIVE_TRAINING.includes(r.status)).length;
  const succeeded = runs.items.some((r) => r.status === TrainingStatus.Succeeded);
  return {
    state: pick(succeeded, inProgress > 0),
    count: runs.items.length,
    more: Boolean(runs.next_page_token),
    inProgress,
  };
}

/** Counts live endpoints; one still deploying makes the stage in progress. */
export function deployStage(deployments: DeploymentListItem[] | undefined, failed: boolean): Stage {
  if (!deployments) return unknownStage(failed);
  const live = deployments.filter((d) => d.status === DeploymentStatus.Active).length;
  const deploying = deployments.some((d) => d.status === DeploymentStatus.Deploying);
  return { state: pick(live > 0, deploying), count: live, more: false, inProgress: 0 };
}
