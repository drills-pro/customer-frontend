/**
 * Request and response shapes for projects, as the API sends them:
 * snake_case fields, lower-case enums and ISO timestamp strings.
 */
import type { ApiVisibility } from '@/features/organizations/api';

export type ApiProjectStatus = 'active' | 'draft' | 'archived';

export type ApiProject = {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  /** A task type id from `GET /v1/catalog/task-types`. */
  task_type: string;
  status: ApiProjectStatus;
  color: string;
  created_at: string;
  /** The newest change inside the project, or its own `created_at`. */
  updated_at: string;
  dataset_count: number;
  model_count: number;
  deployment_count: number;
};

/** `GET /v1/projects/{id}`: the list row plus what the overview page shows. */
export type ApiProjectDetail = ApiProject & {
  framework: string;
  region: string;
  visibility: ApiVisibility;
  pipeline: {
    runs: number;
    running: number;
    /** The last finished stage: 1 data, 2 train, 3 evaluate, 4 deploy. */
    complete_through: 1 | 2 | 3 | 4;
  };
  best_model: {
    name: string;
    /** Display reference of the run that produced it, e.g. `#23`. */
    run: string;
    updated_at: string;
    accuracy: number;
    f1: number;
    latency_ms: number;
    size_bytes: number;
  } | null;
  /** The generated project summary; `null` until a model has been evaluated. */
  readme: {
    about: string;
    architecture: string;
    quickstart: string;
    notes: Array<{ label: string; text: string }>;
  } | null;
  /** Markdown saved from the README editor. Shown instead of `readme` once set. */
  readme_markdown: string | null;
};

/** `POST /v1/projects`. A name already used in the organization answers 409. */
export type CreateProjectRequest = {
  organization_id: string;
  name: string;
  description: string;
  task_type: string;
  region: string;
  visibility: ApiVisibility;
  start_method: 'upload' | 'template' | 'clone';
  /** With `start_method: 'template'`; the template's sample dataset is added. */
  template_id?: string;
  /** With `start_method: 'clone'`. */
  cloned_from_project_id?: string;
};

/** `PATCH /v1/projects/{id}`. */
export type UpdateProjectRequest = {
  name?: string;
  description?: string;
  readme_markdown?: string | null;
};

export type ApiUsagePeriod = 'day' | 'week' | 'month';

/** One resource on `GET /v1/projects/{id}/usage`, with every period's bars. */
export type ApiResourceUsage = {
  id: 'gpu-hours' | 'storage' | 'endpoints';
  label: string;
  description: string;
  unit: string;
  limit: number;
  /** How a period's bars combine into its headline number. */
  aggregation: 'sum' | 'peak';
  color: string;
  series: Record<ApiUsagePeriod, Array<{ label: string; short_label: string; value: number }>>;
};

export type ApiProjectRole = 'owner' | 'editor' | 'viewer';

export type ApiProjectMember = {
  /** The member's user id. */
  id: string;
  name: string;
  email: string;
  color: string;
  role: ApiProjectRole;
  status: 'active' | 'invited';
};

/** `POST /v1/projects/{id}/invitations`. */
export type InviteProjectMemberRequest = {
  email: string;
  role: ApiProjectRole;
};

export type ApiIntegration = {
  /** `github`, `slack`, `webhook` or `s3`. */
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};
