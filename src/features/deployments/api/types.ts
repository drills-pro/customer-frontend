/**
 * Request and response shapes for deployments, as the API sends them:
 * snake_case fields, lower-case enums and ISO timestamp strings.
 */

export type ApiDeploymentStatus = 'live' | 'paused' | 'deploying';
export type ApiDeploymentEnvironment = 'production' | 'staging' | 'batch' | 'edge';

export type ApiDeployment = {
  id: string;
  project_id: string;
  model_id: string;
  name: string;
  status: ApiDeploymentStatus;
  environment: ApiDeploymentEnvironment;
  endpoint_url: string;
  region: string;
  /** An instance type from `GET /v1/catalog/compute-options`. */
  instance_type: string;
  /** `pinned` keeps serving `model_id`; `latest` follows new promotions. */
  serving: 'pinned' | 'latest';
  min_replicas: number;
  max_replicas: number;
  active_replicas: number;
  target_concurrency: number;
  scale_down_delay_seconds: number;
  /** Traffic numbers are `null` while the deployment is not serving. */
  requests_24h: number | null;
  latency_p50_ms: number | null;
  latency_p95_ms: number | null;
  latency_p99_ms: number | null;
  error_rate_percent: number | null;
  cost_per_day_usd: number;
  /** `null` while the first rollout is still in progress. */
  deployed_at: string | null;
};

/** `POST /v1/projects/{id}/deployments`. */
export type CreateDeploymentRequest = {
  model_id: string;
  name?: string;
  environment?: ApiDeploymentEnvironment;
};

/** `PATCH …/{deployment_id}`. */
export type UpdateDeploymentRequest = Partial<
  Pick<
    ApiDeployment,
    'name' | 'serving' | 'min_replicas' | 'max_replicas' | 'instance_type' | 'target_concurrency' | 'scale_down_delay_seconds'
  >
>;

/** `GET …/{deployment_id}/metrics`. */
export type ApiDeploymentMetrics = {
  /** Hourly request counts, oldest first, ending with the current hour. */
  request_volume: Array<{ hours_ago: number; requests: number }>;
};

/** One row of `GET …/{deployment_id}/logs`. */
export type ApiRequestLog = {
  request_id: string;
  time: string;
  method: string;
  status: number;
  /** `null` when the request was rejected before reaching the model. */
  latency_ms: number | null;
  client: string;
};

/** `GET …/{deployment_id}/api-key`; the secret itself is never sent again. */
export type ApiDeploymentKey = {
  masked_key: string;
  created_at: string;
  last_used_at: string | null;
};

/** `POST …/{deployment_id}/api-key/rotate`: the only time `key` is readable. */
export type ApiRotatedKey = ApiDeploymentKey & { key: string };

/** `POST …/{deployment_id}/test`. */
export type ApiTestCall = {
  status: number;
  latency_ms: number;
  predictions: Array<{ label: string; confidence: number }>;
};
