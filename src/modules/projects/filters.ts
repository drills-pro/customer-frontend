import { LEGACY_TASK_TYPE, TASK_TYPES, type ProjectStatus, type ProjectSummary } from '@/modules/projects/api';

/** Each id is also its `projects.view.*` key. */
export const VIEWS = ['grid', 'list'] as const;
export type View = (typeof VIEWS)[number];

/** Each id is also its `projects.sort.*` key. */
export const SORTS = ['newest', 'name'] as const;
export type Sort = (typeof SORTS)[number];

/** The value of a task or status filter that lets everything through. */
export const ALL = 'all';

/** Every task a listed project can have, legacy included. */
export const LISTED_TASK_TYPES = [...TASK_TYPES, LEGACY_TASK_TYPE] as const;
/** The server never lists `pending_delete`. */
export const LISTED_STATUSES: ProjectStatus[] = ['active', 'archived'];

export interface ProjectFiltersState {
  query: string;
  task: ProjectSummary['task_type'] | typeof ALL;
  status: ProjectStatus | typeof ALL;
  sort: Sort;
  view: View;
}

export const DEFAULT_FILTERS: ProjectFiltersState = { query: '', task: ALL, status: ALL, sort: 'newest', view: 'grid' };

/** The loaded projects the filters let through, in the chosen order. */
export function visibleProjects(projects: ProjectSummary[], filters: ProjectFiltersState): ProjectSummary[] {
  const query = filters.query.trim().toLowerCase();
  return projects
    .filter(
      (p) =>
        p.name.toLowerCase().includes(query) &&
        (filters.task === ALL || p.task_type === filters.task) &&
        (filters.status === ALL || p.status === filters.status),
    )
    .sort((a, b) => (filters.sort === 'name' ? a.name.localeCompare(b.name) : b.created_at.localeCompare(a.created_at)));
}
