import { CheckboxOn, Close, Pause } from 'pixelarticons/react';
import { DeploymentStatus } from '@/modules/projects';
import type { PixelIcon } from '@/shared/ui/icons';

interface StatusUi {
  palette: 'gray' | 'success';
  icon: PixelIcon;
  /** Stop is offered (it serves now). */
  stop: boolean;
  /** Start is offered (it was stopped). */
  start: boolean;
  /** The Test tab can call it. */
  test: boolean;
}

/** Everything the UI decides from a deployment's status, in one table; the compiler makes every status appear. */
export const STATUS_UI: Record<DeploymentStatus, StatusUi> = {
  [DeploymentStatus.Active]: { palette: 'success', icon: CheckboxOn, stop: true, start: false, test: true },
  [DeploymentStatus.Stopped]: { palette: 'gray', icon: Pause, stop: false, start: true, test: false },
  [DeploymentStatus.Deleted]: { palette: 'gray', icon: Close, stop: false, start: false, test: false },
};

/** The API types `status` as a plain string; an unknown one reads as deleted: no actions, nothing to poll. */
export const isStatus = (status: string): status is DeploymentStatus => status in STATUS_UI;
export const statusUi = (status: string): StatusUi => (isStatus(status) ? STATUS_UI[status] : STATUS_UI[DeploymentStatus.Deleted]);
