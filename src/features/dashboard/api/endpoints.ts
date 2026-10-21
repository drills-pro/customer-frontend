/**
 * Calls to core-api/app/modules/user/dashboard. The summary is served by the
 * real backend; the metric history is mocked until core-api records it.
 */
import { get } from '@/api/client';
import type { ApiMetricHistory, DashboardSummary } from './types';

export const dashboardApi = {
  /** The whole landing page in one request. */
  getDashboard: () => get<DashboardSummary>('/v1/dashboard', { live: true }),
  /** A daily series per headline metric, for the trend and sparkline. */
  getMetricHistory: (days = 30) => get<ApiMetricHistory>(`/v1/dashboard/metrics/history?days=${days}`),
};
