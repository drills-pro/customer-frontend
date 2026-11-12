import { pollDelay } from '@/shared/api/poll';
import { ImportStatus } from '@/modules/datasets/constants';

export type StatusPalette = 'gray' | 'info' | 'warning' | 'success' | 'danger';

interface StatusUi {
  palette: StatusPalette;
  /** The import is moving on its own, so the page polls it. */
  poll: boolean;
  /** No transition leaves this status. */
  terminal: boolean;
  /** Counts against the per-workspace cap on active imports. */
  active: boolean;
  /** The Cancel button is offered. */
  cancel: boolean;
  /** The report and staged preview are shown with Commit and Discard. */
  review: boolean;
  /** The import has a report worth showing (the failure reasons, or the result). */
  report: boolean;
}

/** Everything the UI decides from an import's status, in one table; the compiler makes every status appear. */
export const STATUS_UI: Record<ImportStatus, StatusUi> = {
  [ImportStatus.AwaitingUpload]: {
    palette: 'gray',
    poll: false,
    terminal: false,
    active: true,
    cancel: true,
    review: false,
    report: false,
  },
  [ImportStatus.Queued]: { palette: 'info', poll: true, terminal: false, active: true, cancel: true, review: false, report: false },
  [ImportStatus.Running]: { palette: 'info', poll: true, terminal: false, active: true, cancel: true, review: false, report: false },
  [ImportStatus.AwaitingReview]: {
    palette: 'warning',
    poll: false,
    terminal: false,
    active: true,
    cancel: false,
    review: true,
    report: true,
  },
  [ImportStatus.Committing]: { palette: 'info', poll: true, terminal: false, active: true, cancel: false, review: false, report: true },
  [ImportStatus.Succeeded]: { palette: 'success', poll: false, terminal: true, active: false, cancel: false, review: false, report: true },
  [ImportStatus.Failed]: { palette: 'danger', poll: false, terminal: true, active: false, cancel: false, review: false, report: true },
  [ImportStatus.Cancelled]: { palette: 'gray', poll: false, terminal: true, active: false, cancel: false, review: false, report: false },
  [ImportStatus.Expired]: { palette: 'gray', poll: false, terminal: true, active: false, cancel: false, review: false, report: false },
  [ImportStatus.Discarded]: { palette: 'gray', poll: false, terminal: true, active: false, cancel: false, review: false, report: true },
};

/** TanStack's `refetchInterval` value for an import: a delay while its status is moving, `false` (stop) otherwise. */
export const nextPoll = (status: ImportStatus | undefined, answers: number): number | false =>
  status && STATUS_UI[status].poll ? pollDelay(answers) : false;
