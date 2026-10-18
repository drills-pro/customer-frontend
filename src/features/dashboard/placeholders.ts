/**
 * Static stand-ins for values core-api does not record yet.
 *
 * Everything on the dashboard that is NOT real data comes from this file, so
 * it is one place to look and one file to delete from. Each constant names
 * what the backend would need before it can go:
 *
 * - deployment latency and error rate: per-request metering on /v1/predict
 * - training progress, current epoch and ETA: live epoch reporting (a run
 *   only prints its epoch history when it finishes)
 *
 * The metric trends and sparklines are not here: they come from
 * `/v1/dashboard/metrics/history`, which `src/api/mock` serves for now.
 */

export const deploymentPlaceholders = {
  latencyP95: '42ms',
  errorRate: '0.2%',
} as const

export const trainingPlaceholders = {
  /** Percent shown on the progress bar. */
  progress: 50,
  currentEpoch: '—',
  eta: '—',
} as const
