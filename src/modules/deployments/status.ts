import { CheckboxOn, Close, Loader, Pause, WarningDiamond } from 'pixelarticons/react';
import { DeploymentStatus } from '@/modules/projects';
import type { PixelIcon } from '@/shared/ui/icons';

interface StatusUi {
  palette: 'gray' | 'info' | 'success' | 'danger';
  icon: PixelIcon;
  /** The deployment is moving on its own, so the pages poll it. */
  poll: boolean;
  /** Stop is offered (it serves now). */
  stop: boolean;
  /** Start is offered (it was stopped). */
  start: boolean;
  /** The Test tab can call it. */
  test: boolean;
}

/** Everything the UI decides from a deployment's status, in one table; the compiler makes every status appear. */
export const STATUS_UI: Record<DeploymentStatus, StatusUi> = {
  [DeploymentStatus.Deploying]: { palette: 'info', icon: Loader, poll: true, stop: false, start: false, test: false },
  [DeploymentStatus.Active]: { palette: 'success', icon: CheckboxOn, poll: false, stop: true, start: false, test: true },
  [DeploymentStatus.Stopped]: { palette: 'gray', icon: Pause, poll: false, stop: false, start: true, test: false },
  [DeploymentStatus.Failed]: { palette: 'danger', icon: WarningDiamond, poll: false, stop: false, start: false, test: false },
  [DeploymentStatus.Deleted]: { palette: 'gray', icon: Close, poll: false, stop: false, start: false, test: false },
};

/** The API types `status` as a plain string; an unknown one reads as still moving, so the page keeps asking. */
export const isStatus = (status: string): status is DeploymentStatus => status in STATUS_UI;
export const statusUi = (status: string): StatusUi => (isStatus(status) ? STATUS_UI[status] : STATUS_UI[DeploymentStatus.Deploying]);
