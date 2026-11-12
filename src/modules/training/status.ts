import { CheckboxOn, Clock, Close, Loader, WarningDiamond } from 'pixelarticons/react';
import { TrainingStatus } from '@/modules/projects';
import { pollDelay } from '@/shared/api/poll';
import type { PixelIcon } from '@/shared/ui/icons';

export type StatusPalette = 'gray' | 'info' | 'success' | 'danger';

interface StatusUi {
  palette: StatusPalette;
  icon: PixelIcon;
  /** The run is moving on its own, so the page polls it. */
  poll: boolean;
  /** The Cancel button is offered. */
  cancel: boolean;
}

/** Everything the UI decides from a run's status, in one table; the compiler makes every status appear. */
export const STATUS_UI: Record<TrainingStatus, StatusUi> = {
  [TrainingStatus.Submitted]: { palette: 'info', icon: Clock, poll: true, cancel: true },
  [TrainingStatus.Running]: { palette: 'info', icon: Loader, poll: true, cancel: true },
  [TrainingStatus.Succeeded]: { palette: 'success', icon: CheckboxOn, poll: false, cancel: false },
  [TrainingStatus.Failed]: { palette: 'danger', icon: WarningDiamond, poll: false, cancel: false },
  [TrainingStatus.Cancelled]: { palette: 'gray', icon: Close, poll: false, cancel: false },
};

/** The API types `status` as a plain string; an unknown one reads as still moving, so the page keeps asking. */
export const isStatus = (status: string): status is TrainingStatus => status in STATUS_UI;
export const statusUi = (status: string): StatusUi => (isStatus(status) ? STATUS_UI[status] : STATUS_UI[TrainingStatus.Running]);

/** TanStack's `refetchInterval` value for a run: a delay while its status is moving, `false` (stop) otherwise. */
export const nextRunPoll = (status: string | undefined, answers: number): number | false =>
  status !== undefined && statusUi(status).poll ? pollDelay(answers) : false;
