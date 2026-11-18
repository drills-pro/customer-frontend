import { useQuery } from '@tanstack/react-query';
import { client, unwrap } from './client';
import { datasetListKey } from './keys';

/** The overview reads one page of runs: the API's largest. A full page reads as "N+". */
export const TRAINING_RUN_LIMIT = 200;

/**
 * The project's training runs, read by the projects overview (the Train stage) and the training pages alike, so neither module owns the
 * read. The key sits under the workspace's projects key (`['workspace', id, 'projects']`), so invalidating a project's list refreshes it.
 */
export const trainingRunsKey = (workspaceId: string, projectId: string) =>
  ['workspace', workspaceId, 'projects', projectId, 'training-runs'] as const;

/** One page of the project's runs, newest first. Exported so a polled read can call it directly. */
export const fetchTrainingRuns = (projectId: string) =>
  unwrap(
    client.GET('/v1/projects/{project_id}/training-runs', {
      params: { path: { project_id: projectId }, query: { limit: TRAINING_RUN_LIMIT } },
    }),
  );

export const useTrainingRuns = (workspaceId: string, projectId: string) =>
  useQuery({ queryKey: trainingRunsKey(workspaceId, projectId), queryFn: () => fetchTrainingRuns(projectId) });

/** The first page of the project's datasets, for a count. Its key sits under the dataset list's, so dataset changes refresh it. */
export function useDatasetCount(projectId: string) {
  return useQuery({
    queryKey: [...datasetListKey(projectId), 'count'],
    queryFn: () => unwrap(client.GET('/v1/projects/{project_id}/datasets', { params: { path: { project_id: projectId } } })),
    select: (page) => ({ count: page.items.length, more: Boolean(page.next_page_token) }),
  });
}
