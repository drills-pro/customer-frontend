/**
 * The dashboard page's React Query hooks. Components call these; the hooks
 * call `dashboardApi` and `datasetsApi` from each feature's `api/` folder.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardApi } from '@/features/dashboard/api';
import type { ApiProject } from '@/features/dashboard/api';
import { useDashboardLayout } from '@/features/dashboard/context';
import { datasetsApi } from '@/features/datasets/api';
import { uploadKind } from '@/features/datasets/upload-rules';

const dashboardKey = ['dashboard'] as const;

/** While something is training, refresh so its status moves on its own. */
const LIVE_REFETCH_MS = 15_000;

/**
 * The whole dashboard in one request. Every card calls this; they share one
 * cache entry, so it is fetched once. core-api answers for the organization
 * in `X-Organization-Id`, so the entry is per organization.
 */
export function useDashboardSummary() {
  const { org } = useDashboardLayout();
  return useQuery({
    queryKey: [...dashboardKey, 'summary', org.id],
    queryFn: dashboardApi.getDashboard,
    refetchInterval: (query) => (query.state.data?.live_trainings.length ? LIVE_REFETCH_MS : false),
  });
}

/**
 * A daily series per headline metric. Keyed under the summary, so anything
 * that invalidates the dashboard refreshes the trends too.
 */
export function useMetricHistory(days = 30) {
  return useQuery({
    queryKey: [...dashboardKey, 'metric-history', days],
    queryFn: () => dashboardApi.getMetricHistory(days),
  });
}

/** Creates a dataset in a project, then sends its file. */
export function useUploadDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    // The upload dialog shows the failure next to its form.
    meta: { quiet: true },
    mutationFn: async ({ project, name, file }: { project: ApiProject; name: string; file: File }) => {
      const dataset = await datasetsApi.createDataset(project.id, name);
      if (uploadKind(file) === 'zip') {
        await datasetsApi.uploadDatasetZip(project.id, dataset.id, file);
      } else {
        await datasetsApi.uploadDatasetCsv(project.id, dataset.id, file);
      }
      return dataset;
    },
    // Also on failure: the dataset row may exist even if its file was refused.
    onSettled: () => queryClient.invalidateQueries({ queryKey: dashboardKey }),
  });
}
