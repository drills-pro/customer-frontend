import { Archive, CheckboxOn, Circle, Clock, Loader, WarningDiamond } from 'pixelarticons/react';
import type { PixelIcon } from '@/shared/ui/icons';
import { isPromoting, isServing, PromotionStatus, type ModelVersion } from '@/modules/models/api';

/** What a version is doing, in one word: the stage and an unfinished promotion together, since in this API Production is serving.
 * Each value is also its `models.status.*` key. */
export const ModelStatus = {
  Serving: 'serving',
  Deploying: 'deploying',
  Failed: 'failed',
  Candidate: 'candidate',
  Archived: 'archived',
  None: 'none',
} as const;
export type ModelStatus = (typeof ModelStatus)[keyof typeof ModelStatus];

export const STATUS_UI: Record<ModelStatus, { palette: 'gray' | 'info' | 'success' | 'danger'; icon: PixelIcon }> = {
  [ModelStatus.Serving]: { palette: 'success', icon: CheckboxOn },
  [ModelStatus.Deploying]: { palette: 'info', icon: Loader },
  [ModelStatus.Failed]: { palette: 'danger', icon: WarningDiamond },
  [ModelStatus.Candidate]: { palette: 'info', icon: Clock },
  [ModelStatus.Archived]: { palette: 'gray', icon: Archive },
  // An empty circle, not a cross: unassigned is a normal state, not a failure.
  [ModelStatus.None]: { palette: 'gray', icon: Circle },
};

export function modelStatus(v: ModelVersion): ModelStatus {
  if (isServing(v)) return ModelStatus.Serving;
  if (isPromoting(v)) return ModelStatus.Deploying;
  if (v.promotion_status === PromotionStatus.Failed) return ModelStatus.Failed;
  if (v.stage === 'Staging') return ModelStatus.Candidate;
  if (v.stage === 'Archived') return ModelStatus.Archived;
  return ModelStatus.None;
}
