/** Turns core-api rows into what the dashboard cards render. Pure functions. */
import type { ApiActivity, ApiMetricSeries, ApiProject } from '@/features/dashboard/api';
import { relativeTime } from '@/lib/format';
import type { Activity } from './domain/types';

export { compactCount, relativeTime } from '@/lib/format';

const taskLabels: Record<string, string> = {
  image_classification: 'Image Classification',
  object_detection: 'Object Detection',
  tabular_classification: 'Tabular Classification',
  text_classification: 'Text Classification',
  legacy_untyped: 'Untyped',
};

export function taskLabel(taskType: string) {
  return taskLabels[taskType] ?? taskType;
}

// Projects have no colour of their own, so each gets a stable one from its id.
const projectColors = [
  '#6366f1', // lint-ok: data, not styling
  '#0ea5e9', // lint-ok: data, not styling
  '#10b981', // lint-ok: data, not styling
  '#f59e0b', // lint-ok: data, not styling
  '#ec4899', // lint-ok: data, not styling
  '#8b5cf6', // lint-ok: data, not styling
];

export function projectColor(projectId: string) {
  let hash = 0;
  for (const char of projectId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return projectColors[hash % projectColors.length];
}

export type DashboardProject = {
  id: string;
  name: string;
  task: string;
  models: number;
  updated: string;
  color: string;
};

export function toDashboardProject(project: ApiProject, now?: number): DashboardProject {
  return {
    id: project.id,
    name: project.name,
    task: taskLabel(project.task_type),
    models: project.model_count,
    updated: relativeTime(project.updated_at, now),
    color: projectColor(project.id),
  };
}

/** A run has no name of its own; its short id is what the API lists it by. */
export function runName(runId: string) {
  return `Run ${runId.slice(0, 8)}`;
}

type ActivityCopy = Pick<Activity, 'icon' | 'lead' | 'text'>;

const memberActions: Record<string, string> = {
  invite: 'invited to',
  accept_invitation: 'joined',
  set_member_role: 'role changed in',
  remove_member: 'removed from',
};

function activityCopy(item: ApiActivity): ActivityCopy {
  const project = item.project_name;
  switch (item.kind) {
    case 'project':
      return {
        icon: item.action === 'delete' ? 'error' : 'success',
        lead: `Project ${item.name}`,
        text: `${item.action}d`,
      };
    case 'dataset':
      return {
        icon: 'dataset',
        lead: `Dataset ${item.name}`,
        text: `added to ${project}`,
      };
    case 'training_run':
      return {
        icon: item.action === 'failed' ? 'error' : item.action === 'succeeded' ? 'success' : 'deployment',
        lead: `Training run ${item.name}`,
        text: `${item.action === 'start' ? 'started' : item.action} in ${project}`,
      };
    case 'deployment':
      return {
        icon: 'deployment',
        lead: `Deployment ${item.name}`,
        text: `created in ${project}`,
      };
    case 'model_version':
      return {
        icon: 'success',
        lead: `Model ${item.name}`,
        text: `registered in ${project}`,
      };
    default:
      // Membership and invitation events from the audit log.
      return {
        icon: 'person',
        lead: 'Member',
        text: `${memberActions[item.action] ?? item.action} ${project}`,
      };
  }
}

export function toActivity(item: ApiActivity, now?: number): Activity {
  const copy = activityCopy(item);
  return {
    id: item.id,
    // Kept for the shared `Activity` shape; the API already scopes to a tenant.
    orgId: '',
    ...copy,
    text: item.actor ? `${copy.text} by ${item.actor}` : copy.text,
    time: relativeTime(item.occurred_at, now),
    action: 'View',
  };
}

/** `▲ +3`, `▼ −1`, `+24%`: how a metric moved over the history window. */
export function metricChange({ change, change_unit }: ApiMetricSeries) {
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  const unit = change_unit === 'percent' ? '%' : '';
  return {
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
    label: `${sign}${Math.abs(change)}${unit}`,
  } as const;
}

/**
 * SVG `points` for a sparkline in a `0 0 100 34` viewBox, scaled to the
 * series' own range. A flat series draws a level line through the middle.
 */
export function sparklinePoints(values: number[]) {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const range = Math.max(...values) - min;
  const last = Math.max(values.length - 1, 1);
  return values
    .map((value, index) => {
      const x = 1 + (index / last) * 98;
      const y = range === 0 ? 17 : 32 - ((value - min) / range) * 30;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
