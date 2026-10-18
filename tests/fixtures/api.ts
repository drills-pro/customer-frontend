import type { Page, Route } from '@playwright/test'
import type { DashboardSummary } from '../../src/features/dashboard/api'

/**
 * The dev server under test is started with these (see playwright.config.ts).
 * Nothing listens at API_URL: every core-api call a test cares about is
 * answered by `mockDashboardApi`, and any other one fails fast.
 */
export const TENANT_ID = '11111111-1111-1111-1111-111111111111'
export const API_URL = 'http://core-api.test'

const RETAIL = '22222222-0000-0000-0000-000000000001'
const CHURN = '22222222-0000-0000-0000-000000000002'

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString()

export function dashboardSummary(): DashboardSummary {
  return {
    metrics: {
      active_projects: 2,
      trainings_running: 1,
      models_deployed: 1,
      inference_calls_30d: 182_000,
      datasets: 1,
      training_runs: 2,
      deployments: 0,
    },
    projects: [
      {
        id: RETAIL,
        name: 'Retail Vision',
        task_type: 'image_classification',
        status: 'active',
        created_at: minutesAgo(60 * 24 * 10),
        updated_at: minutesAgo(5),
        dataset_count: 1,
        model_count: 3,
        deployment_count: 2,
      },
      {
        id: CHURN,
        name: 'Churn Model',
        task_type: 'tabular_classification',
        status: 'active',
        created_at: minutesAgo(60 * 24 * 3),
        updated_at: minutesAgo(60 * 24 * 3),
        dataset_count: 0,
        model_count: 0,
        deployment_count: 0,
      },
    ],
    live_trainings: [
      {
        id: '44444444-0000-0000-0000-000000000002',
        project_id: RETAIL,
        project_name: 'Retail Vision',
        status: 'running',
        config: { trainer: { epochs: 10 } },
        created_at: minutesAgo(30),
      },
    ],
    deployments: [
      {
        id: '55555555-0000-0000-0000-000000000001',
        project_id: RETAIL,
        project_name: 'Retail Vision',
        route_prefix: '/retail-classify',
        status: 'active',
        created_at: minutesAgo(60 * 48),
      },
      {
        id: '55555555-0000-0000-0000-000000000002',
        project_id: RETAIL,
        project_name: 'Retail Vision',
        route_prefix: '/retail-canary',
        status: 'failed',
        created_at: minutesAgo(10),
      },
    ],
    // Seven events: the card shows five until "View all".
    activity: [
      activity('deployment:2', 'deployment', 'create', '/retail-canary', 10),
      activity('training_run:2:start', 'training_run', 'start', '44444444', 30),
      activity('deployment:1', 'deployment', 'create', '/retail-classify', 90),
      activity('model_version:1', 'model_version', 'register', 'retail v1', 95),
      activity(
        'training_run:1:failed',
        'training_run',
        'failed',
        '4444aaaa',
        99,
      ),
      activity('dataset:1', 'dataset', 'create', 'shelf-photos', 200),
      {
        ...activity('audit:1', 'project', 'create', 'Retail Vision', 300),
        actor: 'alice',
      },
    ],
  }
}

function activity(
  id: string,
  kind: string,
  action: string,
  name: string,
  minutes: number,
): DashboardSummary['activity'][number] {
  return {
    id,
    kind,
    action,
    name,
    project_id: RETAIL,
    project_name: 'Retail Vision',
    actor: null,
    occurred_at: minutesAgo(minutes),
  }
}

export const emptySummary: DashboardSummary = {
  metrics: {
    active_projects: 0,
    trainings_running: 0,
    models_deployed: 0,
    inference_calls_30d: 0,
    datasets: 0,
    training_runs: 0,
    deployments: 0,
  },
  projects: [],
  live_trainings: [],
  deployments: [],
  activity: [],
}

// The API is another origin, so a mocked answer needs the CORS header the real
// one sends (core-api allows every origin; it authenticates by header).
const cors = { 'access-control-allow-origin': '*' }

export function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    headers: cors,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

export type DashboardApi = {
  /** What `GET /v1/dashboard` answers next; tests may replace or mutate it. */
  summary: DashboardSummary
  /** Headers of every dashboard request, to assert on. */
  requests: Array<Record<string, string>>
}

/** Answers `GET /v1/dashboard` from an in-memory summary. */
export async function mockDashboardApi(
  page: Page,
  summary: DashboardSummary = dashboardSummary(),
): Promise<DashboardApi> {
  const api: DashboardApi = { summary, requests: [] }
  await page.route(`${API_URL}/v1/dashboard`, (route) => {
    api.requests.push(route.request().headers())
    return json(route, api.summary)
  })
  return api
}
