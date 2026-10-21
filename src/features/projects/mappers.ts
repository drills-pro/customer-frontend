/** Turns project rows from the API into what the pages render. */
import type { Project, ProjectOverview, ResourceUsage } from '@/features/dashboard/domain/types';
import { initialsOf, toVisibility } from '@/features/organizations/mappers';
import { formatBytes, formatDate, formatMs, relativeTime, relativeTimeLong } from '@/lib/format';
import type { ApiProject, ApiProjectDetail, ApiProjectMember, ApiProjectRole, ApiProjectStatus, ApiResourceUsage } from './api';

// The /projects filter matches these against the catalog's labels, so a task
// type core-api serves reads the same as core-api/app/modules/user/catalog/data.py.
const taskLabels: Record<string, string> = {
  image_classification: 'Image Classification',
  object_detection: 'Object Detection',
  tabular_classification: 'Tabular Classification',
  legacy_untyped: 'Untyped (legacy)',
  segmentation: 'Segmentation',
  text_classification: 'Text Classification',
  named_entity_recognition: 'Named Entity Recognition',
  tabular_prediction: 'Tabular Prediction',
  time_series: 'Time Series',
  tabular: 'Tabular',
  document_ai: 'Document AI',
};

/** A task type the client has no name for reads as its id, title-cased. */
export function taskTypeLabel(taskType: string) {
  return (
    taskLabels[taskType] ??
    taskType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
}

const statusLabels: Record<ApiProjectStatus, Project['status']> = {
  active: 'Active',
  draft: 'Draft',
  archived: 'Archived',
};

export function toProject(row: ApiProject, now?: number): Project {
  return {
    id: row.id,
    orgId: row.organization_id,
    name: row.name,
    task: taskTypeLabel(row.task_type),
    taskType: row.task_type,
    description: row.description,
    datasets: row.dataset_count,
    models: row.model_count,
    deployed: row.deployment_count,
    status: statusLabels[row.status],
    updatedAt: new Date(row.updated_at).getTime(),
    updated: relativeTime(row.updated_at, now),
    color: row.color,
  };
}

function toResourceUsage(row: ApiResourceUsage): ResourceUsage {
  const points = (period: keyof ApiResourceUsage['series']) =>
    row.series[period].map((point) => ({
      label: point.label,
      shortLabel: point.short_label,
      value: point.value,
    }));
  return {
    id: row.id,
    label: row.label,
    description: row.description,
    unit: row.unit,
    limit: row.limit,
    aggregation: row.aggregation,
    color: row.color,
    series: {
      day: points('day'),
      week: points('week'),
      month: points('month'),
    },
  };
}

export type ProjectTeamRole = ProjectOverview['team'][number]['role'];

const roleLabels: Record<ApiProjectRole, ProjectTeamRole> = {
  owner: 'Owner',
  editor: 'Editor',
  viewer: 'Viewer',
};

export const toProjectRole = (role: ApiProjectRole) => roleLabels[role];
export const toApiProjectRole = (role: ProjectTeamRole) => role.toLowerCase() as ApiProjectRole;

export type ProjectMember = ProjectOverview['team'][number] & {
  id: string;
  email: string;
  invited?: boolean;
};

export function toProjectMember(row: ApiProjectMember): ProjectMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    initials: initialsOf(row.name),
    role: roleLabels[row.role],
    color: row.color,
    invited: row.status === 'invited' || undefined,
  };
}

export function toProjectOverview(
  detail: ApiProjectDetail,
  usage: ApiResourceUsage[],
  members: ApiProjectMember[],
  now?: number,
): ProjectOverview {
  const best = detail.best_model;
  return {
    created: formatDate(detail.created_at),
    framework: detail.framework,
    region: detail.region,
    visibility: toVisibility(detail.visibility),
    pipeline: {
      runs: detail.pipeline.runs,
      running: detail.pipeline.running,
      completeThrough: detail.pipeline.complete_through,
    },
    bestModel: best
      ? {
          name: best.name,
          run: best.run,
          updated: relativeTimeLong(best.updated_at, now),
          accuracy: best.accuracy,
          f1: best.f1,
          latency: formatMs(best.latency_ms, { compact: true }),
          size: formatBytes(best.size_bytes),
        }
      : undefined,
    resourceUsage: usage.map(toResourceUsage),
    readmeMarkdown: detail.readme_markdown ?? undefined,
    readme: detail.readme ?? undefined,
    team: members
      .filter((member) => member.status === 'active')
      .map(({ name, role, color }) => ({
        name,
        initials: initialsOf(name),
        role: roleLabels[role],
        color,
      })),
  };
}
